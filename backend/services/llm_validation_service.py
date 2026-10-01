"""
SatyaDrishti LLM Validation Augmentor

Provides a lightweight LLM-based verification pass on top of the deterministic
statutory validator. The LLM does NOT re-validate from scratch — it only reviews
the set of fail/warning findings produced by the deterministic layer and confirms
or dismisses each one.

Design goals:
  - Minimum latency: all findings are sent in a single batch prompt
  - Only non-passing findings are sent (pass findings are not re-evaluated)
  - Output tokens capped (~400) to keep inference fast
  - Graceful degradation: if no LLM is available, deterministic results are returned unchanged

Providers (in priority order):
  1. Local Ollama (same model as vision — qwen2.5-vl handles text-only fine)
  2. Cloud Gemini Flash (text-only, fallback)
  3. None — passthrough (deterministic results unchanged)
"""

import os
import json
import urllib.request
import urllib.error
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Tuple

# ─── Configuration ───────────────────────────────────────────────────────────

DEFAULT_OLLAMA_BASE_URL  = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_OLLAMA_MODEL     = os.getenv("OLLAMA_VISION_MODEL", "qwen2.5-vl")  # Same model as vision
GEMINI_API_KEY           = os.getenv("GEMINI_API_KEY", "")
POLLINATIONS_API_KEY     = os.getenv("POLLINATIONS_API_KEY", "")
POLLINATIONS_BASE_URL    = os.getenv("POLLINATIONS_BASE_URL", "https://gen.pollinations.ai")
POLLINATIONS_TEXT_MODEL  = os.getenv("POLLINATIONS_TEXT_MODEL", "openai")

# Output token cap — keep it tight so inference stays fast
LLM_MAX_TOKENS = int(os.getenv("LLM_VALIDATION_MAX_TOKENS", os.getenv("OLLAMA_NUM_PREDICT", "450")))



# ─── Statutory Grounding & Rule Specifications ──────────────────────────────
STATUTORY_RULE_MANDATES: Dict[str, Dict[str, str]] = {
    "PCR-R6-1A": {
        "statute": "Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011",
        "mandate": "Generic / common name of the commodity is mandatory on the principal display panel. Brand name alone is insufficient.",
        "eval_guide": "If product name is missing or <3 chars, CONFIRM violation. Do not dismiss.",
    },
    "PCR-R6-1C": {
        "statute": "Rule 6(1)(c), Legal Metrology (Packaged Commodities) Rules, 2011",
        "mandate": "Maximum Retail Price (MRP) must explicitly include the clause '(inclusive of all taxes)' or 'incl. of all taxes'.",
        "eval_guide": "If MRP is declared but lacks the explicit tax clause, CONFIRM warning. If MRP is absent, CONFIRM critical fail.",
    },
    "PCR-R6-1AA": {
        "statute": "Rule 6(1)(aa), Legal Metrology (Packaged Commodities) Amendment Rules, 2022 [G.S.R. 779(E), eff. 1 Jan 2023]",
        "mandate": "Unit Sale Price (USP) in ₹ per g or ₹ per ml is strictly mandatory for all pre-packaged commodities.",
        "eval_guide": "If USP is missing, it is a MANDATORY STATUTORY VIOLATION. Never dismiss missing USP as 'not mentioned' or 'not applicable'.",
    },
    "PCR-R6-1B": {
        "statute": "Rule 6(1)(b) & Rule 11, Legal Metrology (Packaged Commodities) Rules, 2011",
        "mandate": "Net quantity in standard metric units (g, kg, ml, l) is mandatory. Non-metric imperial units (oz, lbs) are prohibited under Rule 11.",
        "eval_guide": "If missing or imperial units used, CONFIRM violation.",
    },
    "PCR-R6-1D": {
        "statute": "Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011",
        "mandate": "Manufacturer/packer full physical address with a verified 6-digit Indian postal PIN code is mandatory.",
        "eval_guide": "If address is missing or lacks 6-digit PIN code, CONFIRM finding.",
    },
    "PCR-R6-1E": {
        "statute": "Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011",
        "mandate": "Month and year of manufacture/packing/import in MM/YYYY or MMM/YYYY format is mandatory.",
        "eval_guide": "If missing or invalid date format, CONFIRM violation.",
    },
    "PCR-R6-1F": {
        "statute": "Rule 6(1)(f), Legal Metrology (Packaged Commodities) Rules, 2011",
        "mandate": "Consumer care name, telephone number (toll-free/landline), and email address must be declared.",
        "eval_guide": "If missing customer care contact details, CONFIRM violation.",
    },
    "PCR-R6-1N": {
        "statute": "Rule 6(1)(n), Legal Metrology (Packaged Commodities) Rules, 2011 [G.S.R. 1537(E)]",
        "mandate": "Country of origin/manufacture must be declared prominently (e.g. 'Made in India' or 'Country of Origin: INDIA').",
        "eval_guide": "If missing or ambiguous, CONFIRM critical violation.",
    },
    "PCR-R6-1G": {
        "statute": "Rule 6(1)(g), Legal Metrology (Packaged Commodities) Rules, 2011",
        "mandate": "Batch number, lot number, or lot identification code is mandatory for product traceability.",
        "eval_guide": "If missing or <3 characters, CONFIRM finding.",
    },
    "PCR-R6-1D-IMP": {
        "statute": "Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011",
        "mandate": "For imported packages, importer full legal name and complete Indian address with PIN code are mandatory.",
        "eval_guide": "If imported product lacks importer details/PIN, CONFIRM finding.",
    },
    "PCR-EXP-1": {
        "statute": "Legal Metrology (Packaged Commodities) Rules, 2011 & Consumer Protection Guidelines",
        "mandate": "Expiry Date / Best Before Date declaration must NOT be in the past relative to the evaluation date.",
        "eval_guide": "If date is earlier than evaluation date, product is EXPIRED (CRITICAL VIOLATION). Do not confuse date format with expiration.",
    },
}


# ─── Result Types ────────────────────────────────────────────────────────────

@dataclass
class LLMFindingAugmentation:
    """LLM verification result for one deterministic finding."""
    rule_id: str
    verdict: str                        # "confirm" | "dismiss" | "escalate"
    reasoning: str                      # Brief legal reasoning (1–2 sentences)
    severity_override: Optional[str]    # null | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    recommendation: str                 # Concrete corrective action


@dataclass
class LLMAugmentationResult:
    """Complete LLM augmentation result for a validation run."""
    provider: str                                          # e.g. "Local-Ollama-qwen2.5-vl"
    augmentations: List[LLMFindingAugmentation] = field(default_factory=list)
    error: Optional[str] = None


# ─── Affirmative Evidence Verifier (Guardrail Helper) ───────────────────────

def _has_affirmative_text_evidence(rule_id: str, field_key: str, extracted_fields: Dict[str, str]) -> bool:
    """
    Checks if raw label text or other extracted fields affirmatively satisfy the statutory requirement.
    Used by guardrails to prevent hallucinated dismissals.
    """
    import re
    raw = (extracted_fields.get("rawText", "") + " " + extracted_fields.get(field_key, "")).lower()

    if rule_id == "PCR-R6-1AA":
        # Check if USP format actually exists anywhere in label
        return bool(re.search(r'(?:₹|rs\.?|inr)?\s*[\d.]+\s*(?:per|/)\s*(?:\d+)?\s*(?:g|gm|ml|kg|l|ltr|piece|unit|pcs|nos)\b', raw, re.I))
    elif rule_id == "PCR-R6-1C":
        return bool(re.search(r'incl(?:usive)?\.?\s*(?:of\s*)?all\s*taxes|all\s*taxes\s*incl', raw, re.I))
    elif rule_id == "PCR-R6-1D":
        return bool(re.search(r'\b[1-9][0-9]{5}\b', raw))
    elif rule_id == "PCR-R6-1N":
        return bool(re.search(r'made\s*in\s*india|country\s*of\s*origin\s*:\s*india|origin\s*:\s*india', raw, re.I))
    elif rule_id == "PCR-R6-1F":
        return bool(re.search(r'\b[\w\.-]+@[\w\.-]+\.\w+\b|\b\d{3,5}[-\s]?\d{6,8}\b|\b1800[-\s]?\d{3}[-\s]?\d{3,4}\b', raw, re.I))
    elif rule_id == "PCR-R6-1B":
        return bool(re.search(r'\b\d+\.?\d*\s*(?:g|gm|grams?|kg|ml|l|ltr|mg|pieces?|units?)\b', raw, re.I))
    
    return False


# ─── Prompt Builder ──────────────────────────────────────────────────────────

def _build_verification_prompt(
    extracted_fields: Dict[str, str],
    findings_to_review: List[Dict[str, Any]],
    evaluation_date: Optional[str] = None,
) -> str:
    """
    Builds a statutory-context-enriched compact batch prompt for non-passing findings.
    Equips the LLM with exact legal test criteria to ensure precise legal reasoning.
    """
    eval_date_str = evaluation_date or "today"

    fields_summary = {
        k: v for k, v in extracted_fields.items()
        if v and v not in ("", "(Not detected)", "null", "none", "n/a")
    }

    findings_compact = []
    for f in findings_to_review:
        rule_id = f.get("rule_id", "")
        mandate_info = STATUTORY_RULE_MANDATES.get(rule_id, {})

        findings_compact.append({
            "rule_id":        rule_id,
            "rule_code":      f.get("rule_code", ""),
            "target_field":   f.get("target_field", ""),
            "deterministic_status": f.get("status", ""),  # "fail" or "warning"
            "extracted_evidence":   f.get("evidence", ""),
            "statute":        mandate_info.get("statute", f.get("act_name", "")),
            "statutory_mandate": mandate_info.get("mandate", f.get("expected_standard", "")),
            "eval_guidance":  mandate_info.get("eval_guide", "Verify if evidence complies with statutory mandate."),
        })

    prompt = f"""You are a senior Indian statutory compliance officer specializing in the Legal Metrology Act 2009, Packaged Commodities Rules 2011, and Consumer Protection Act 2019.
Evaluation Date: {eval_date_str}

A deterministic statutory engine flagged the following compliance issues on a product label.
Verify each finding against Indian Law and provide statutory reasoning.

EXTRACTED LABEL FIELDS:
{json.dumps(fields_summary, ensure_ascii=False)}

FLAGGED FINDINGS TO VERIFY:
{json.dumps(findings_compact, ensure_ascii=False, indent=2)}

STRICT VERIFICATION RULES:
1. MISSING MANDATORY DECLARATIONS: If a statutory declaration (e.g. USP, MRP, Net Qty, Origin, Address, Mfg Date) is "(Not detected)", it is a NON-COMPLIANCE. You MUST "confirm" the violation. NEVER dismiss missing mandatory declarations as "not mentioned".
2. UNIT SALE PRICE (USP): Mandatory under G.S.R. 779(E) since 1 Jan 2023. Absence is a statutory violation.
3. MRP CLAUSE: Rule 6(1)(c) mandates the explicit wording "(inclusive of all taxes)". Missing tax clause is a valid warning.
4. EXPIRY / BEST BEFORE DATE: Must NOT be in the past relative to {eval_date_str}. If expired, CONFIRM critical violation.
5. DISMISSAL: ONLY dismiss if the extracted fields or raw text affirmatively prove the requirement is fully satisfied (false-positive).

For EACH finding return a JSON array entry:
[
  {{
    "rule_id": "<exact rule_id from above>",
    "verdict": "confirm" | "dismiss" | "escalate",
    "reasoning": "<1 sentence concise legal basis citing specific rule/act>",
    "severity_override": null | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    "recommendation": "<concrete corrective action for the manufacturer>"
  }}
]

Return ONLY the raw JSON array. No markdown, no explanations outside the JSON."""

    return prompt


# ─── Pollinations Text Provider ────────────────────────────────────────────────

class _PollinationsTextProvider:
    """Calls Pollinations AI chat completions endpoint for text-only verification."""

    def __init__(
        self,
        api_key: str = POLLINATIONS_API_KEY,
        base_url: str = POLLINATIONS_BASE_URL,
        model_name: str = POLLINATIONS_TEXT_MODEL,
        timeout_seconds: int = 45,
    ):
        self.api_key = api_key or os.getenv("POLLINATIONS_API_KEY", "")
        self.base_url = (base_url or os.getenv("POLLINATIONS_BASE_URL", "https://gen.pollinations.ai")).rstrip("/")
        self.model_name = model_name or os.getenv("POLLINATIONS_TEXT_MODEL", "openai")
        self.timeout = timeout_seconds

    def is_available(self) -> bool:
        enabled = os.getenv("POLLINATIONS_ENABLED", "true").lower() in ("true", "1", "yes")
        return bool(enabled and (self.api_key or "pollinations.ai" in self.base_url))

    def call(self, prompt: str) -> Tuple[Optional[List[Dict]], str]:
        if "chat/completions" in self.base_url:
            url = self.base_url
        elif self.base_url.endswith("/v1"):
            url = f"{self.base_url}/chat/completions"
        else:
            url = f"{self.base_url}/v1/chat/completions"
        payload = {
            "model": self.model_name,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            "temperature": 0.05,
            "max_tokens": LLM_MAX_TOKENS,
        }


        headers = {
            "Content-Type": "application/json",
            "User-Agent": "SatyaDrishti-ValidationAugmentor",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers)

        try:
            import time
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    resp_json = json.loads(resp.read().decode("utf-8"))
                    choices = resp_json.get("choices", [])
                    raw_text = ""
                    if choices:
                        raw_text = choices[0].get("message", {}).get("content", "")
                    elif "content" in resp_json:
                        raw_text = resp_json.get("content", "")

                    elapsed = time.time() - t0
                    print(f"[LLM-Validation] Pollinations model={self.model_name} | elapsed={elapsed:.2f}s")
                    parsed = _safe_parse_json_list(raw_text)
                    return parsed, raw_text
                return None, f"Pollinations HTTP {resp.status}"
        except Exception as exc:
            return None, str(exc)


# ─── Ollama Text Provider ────────────────────────────────────────────────────

class _OllamaTextProvider:
    """Calls Ollama /api/chat for text-only verification (no image needed)."""

    def __init__(
        self,
        base_url: str = DEFAULT_OLLAMA_BASE_URL,
        model_name: str = DEFAULT_OLLAMA_MODEL,
        timeout_seconds: int = 45,
    ):
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name
        self.timeout = timeout_seconds

    def is_available(self) -> bool:
        try:
            req = urllib.request.Request(
                f"{self.base_url}/api/tags",
                headers={"User-Agent": "SatyaDrishti-ValidationAugmentor"},
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    tags = json.loads(resp.read().decode("utf-8"))
                    installed = [m.get("name", "") for m in tags.get("models", [])]
                    if installed:
                        # Exact match
                        if self.model_name in installed:
                            return True
                        # Fuzzy match (handles tag variants like "qwen2.5-vl:7b")
                        clean_target = self.model_name.lower().replace("-", "").replace(":", "")
                        for m in installed:
                            clean_m = m.lower().replace("-", "").replace(":", "")
                            if clean_target in clean_m or clean_m in clean_target:
                                self.model_name = m
                                return True
                        # Use whatever is available
                        self.model_name = installed[0]
                        return True
            return False
        except Exception:
            return False

    def call(self, prompt: str) -> Tuple[Optional[List[Dict]], str]:
        """Calls /api/chat (same endpoint as vision service) and returns (parsed_json_list, raw_response)."""
        num_ctx = int(os.getenv("OLLAMA_NUM_CTX", "4096"))
        payload = {
            "model": self.model_name,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            "options": {
                "num_ctx": num_ctx,
                "temperature": 0.05,
                "top_p": 0.85,
                "num_predict": LLM_MAX_TOKENS,
                "num_gpu": 99,
            },
            "stream": False,
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/api/chat",
            data=data_bytes,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "SatyaDrishti-ValidationAugmentor",
            },
        )
        try:
            import time
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    resp_json = json.loads(resp.read().decode("utf-8"))
                    raw_text  = resp_json.get("message", {}).get("content", "")
                    elapsed   = time.time() - t0
                    eval_count = resp_json.get("eval_count", 0)
                    print(
                        f"[LLM-Validation] Ollama model={self.model_name} | "
                        f"elapsed={elapsed:.2f}s | tokens={eval_count}"
                    )
                    parsed = _safe_parse_json_list(raw_text)
                    if parsed is None:
                        preview = raw_text[:300].replace('\n', ' ')
                        print(f"[LLM-Validation] Parse failed, raw preview: {preview}")
                    return parsed, raw_text
                return None, f"Ollama HTTP {resp.status}"
        except Exception as exc:
            return None, str(exc)


# ─── Gemini Text Provider ────────────────────────────────────────────────────

class _GeminiTextProvider:
    """Calls Gemini Flash text API as fallback."""

    def __init__(self, api_key: str = GEMINI_API_KEY, timeout_seconds: int = 30):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.timeout = timeout_seconds

    def is_available(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    def call(self, prompt: str) -> Tuple[Optional[List[Dict]], str]:
        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-1.5-flash:generateContent?key={self.api_key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": LLM_MAX_TOKENS,
                "response_mime_type": "application/json",
            },
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=data_bytes,
            headers={"Content-Type": "application/json"},
        )
        try:
            import time
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    resp_json = json.loads(resp.read().decode("utf-8"))
                    candidates = resp_json.get("candidates", [])
                    if candidates:
                        parts   = candidates[0].get("content", {}).get("parts", [])
                        raw     = parts[0].get("text", "") if parts else ""
                        elapsed = time.time() - t0
                        print(f"[LLM-Validation] Gemini Flash | elapsed={elapsed:.2f}s")
                        parsed = _safe_parse_json_list(raw)
                        return parsed, raw
                return None, f"Gemini HTTP {resp.status}"
        except Exception as exc:
            return None, str(exc)


# ─── JSON Parser ─────────────────────────────────────────────────────────────

def _safe_parse_json_list(raw: str) -> Optional[List[Dict]]:
    """Robustly parses a JSON array from LLM output, handling partial/wrapped/truncated responses."""
    import re
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    try:
        result = json.loads(raw)
        if isinstance(result, list):
            return result
        if isinstance(result, dict):
            for v in result.values():
                if isinstance(v, list):
                    return v
    except Exception:
        pass

    s = raw.find("[")
    e = raw.rfind("]")
    if s != -1 and e != -1 and e > s:
        try:
            result = json.loads(raw[s : e + 1])
            if isinstance(result, list):
                return result
        except Exception:
            pass

    # Robust Fallback: Extract each individual JSON object { ... }
    extracted_objects = []
    # Match non-nested JSON objects inside the array
    obj_matches = re.findall(r'\{[^{}]*\}', raw)
    for m in obj_matches:
        try:
            obj = json.loads(m)
            if isinstance(obj, dict) and "rule_id" in obj:
                extracted_objects.append(obj)
        except Exception:
            continue

    if extracted_objects:
        return extracted_objects

    return None


# ─── Main Augmentor with Statutory Guardrails ────────────────────────────────

class LLMValidationAugmentor:
    """
    Orchestrates the LLM verification pass with hybrid architecture guardrails:
      1. Filter to only fail/warning findings
      2. Build context-enriched statutory prompt with exact legal requirements
      3. Call Pollinations AI (Priority 1), Ollama (Fallback 1), or Gemini (Fallback 2)
      4. Apply guardrails: reject hallucinated dismissals on missing mandatory fields
      5. Return high-confidence augmentations
    """

    def __init__(self):
        self._pollinations = _PollinationsTextProvider()
        self._ollama = _OllamaTextProvider()
        self._gemini = _GeminiTextProvider()

    def augment(
        self,
        extracted_fields: Dict[str, str],
        findings: List[Dict[str, Any]],
        evaluation_date: Optional[str] = None,
    ) -> LLMAugmentationResult:
        """
        Parameters
        ----------
        extracted_fields : dict
            The raw extracted label fields.
        findings : list[dict]
            Serialized list of ValidationFinding dicts from the deterministic validator.
        evaluation_date : str, optional
            ISO date string for date evaluation.

        Returns
        -------
        LLMAugmentationResult
            Contains per-finding augmentations with statutory guardrails applied.
        """
        reviewable = [f for f in findings if f.get("status") in ("fail", "warning")]
        if not reviewable:
            return LLMAugmentationResult(provider="none (all deterministic findings passed)")

        prompt = _build_verification_prompt(extracted_fields, reviewable, evaluation_date=evaluation_date)

        parsed, raw = None, ""
        provider_label = "none"

        # --- Provider 1: Pollinations AI ---
        if self._pollinations.is_available():
            parsed, raw = self._pollinations.call(prompt)
            if parsed is not None:
                provider_label = f"Cloud-Pollinations-{self._pollinations.model_name}"

        # --- Provider 2: Ollama Fallback ---
        if parsed is None and self._ollama.is_available():
            parsed, raw = self._ollama.call(prompt)
            if parsed is not None:
                provider_label = f"Local-Ollama-{self._ollama.model_name}"

        # --- Provider 3: Gemini Fallback ---
        if parsed is None and self._gemini.is_available():
            parsed, raw = self._gemini.call(prompt)
            if parsed is not None:
                provider_label = "Cloud-Gemini-Flash"

        if parsed is None:
            return LLMAugmentationResult(
                provider="none",
                error=f"LLM unavailable or returned unparseable response: {raw[:200]}",
            )

        # Index reviewable findings for quick guardrail lookup
        finding_map = {f.get("rule_id", ""): f for f in reviewable}

        augmentations: List[LLMFindingAugmentation] = []
        for item in parsed:
            if not isinstance(item, dict):
                continue
            rule_id = str(item.get("rule_id", ""))
            verdict = str(item.get("verdict", "confirm")).lower()
            if verdict not in ("confirm", "dismiss", "escalate"):
                verdict = "confirm"

            reasoning = str(item.get("reasoning", "")).strip()[:400]
            recommendation = str(item.get("recommendation", "")).strip()[:400]

            sev_raw = item.get("severity_override")
            sev_override = None
            if sev_raw and str(sev_raw).upper() in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
                sev_override = str(sev_raw).upper()

            # ── Guardrail 1: Prevent Hallucinated Dismissals of Mandatory Declarations ──
            orig_finding = finding_map.get(rule_id)
            if orig_finding and verdict == "dismiss":
                evidence = orig_finding.get("evidence", "")
                target_field = orig_finding.get("target_field", "")
                is_missing = evidence in ("(Not detected)", "", "null") or not evidence.strip()

                # If the field is missing and there is no affirmative evidence in label text, reject dismissal
                if is_missing and not _has_affirmative_text_evidence(rule_id, target_field, extracted_fields):
                    verdict = "confirm"
                    mandate = STATUTORY_RULE_MANDATES.get(rule_id, {}).get("statute", "Indian Statutory Law")
                    reasoning = f"Mandatory declaration is absent on label. Upheld under {mandate} (Guardrail: false dismissal rejected)."

            # ── Guardrail 2: Ensure Meaningful Reasoning ──
            if not reasoning:
                rule_info = STATUTORY_RULE_MANDATES.get(rule_id, {})
                reasoning = f"Statutory requirement under {rule_info.get('statute', 'PCR 2011')}: {rule_info.get('mandate', 'Compliance required.')}"

            augmentations.append(
                LLMFindingAugmentation(
                    rule_id=rule_id,
                    verdict=verdict,
                    reasoning=reasoning,
                    severity_override=sev_override,
                    recommendation=recommendation,
                )
            )

        return LLMAugmentationResult(
            provider=provider_label,
            augmentations=augmentations,
        )


# ─── Singleton ───────────────────────────────────────────────────────────────
llm_validation_augmentor = LLMValidationAugmentor()

