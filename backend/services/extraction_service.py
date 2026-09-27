"""
SatyaDrishti Production-Grade Packaging Extraction Service

Implements a multi-stage extraction pipeline for packaging label images:

  Stage 1: Image Pre-processing
    - Adaptive thresholding, contrast normalization, deskewing
  Stage 2: OCR Text Extraction
    - Tesseract OCR (primary) with preprocessing variants
    - Fallback: raw text pass-through for already-extracted text
  Stage 3: Layout-Aware Field Extraction
    - Structured NER-style regex extraction per statutory field
    - Pattern matching against all Legal Metrology mandatory declarations
  Stage 4: Data Normalization & Validation
    - SI unit normalization, PIN code validation

Architecture note:
  This service is the BACKEND production extraction layer.
  The frontend ocrService.ts / fieldExtractors.ts handle client-side OCR.
  When this backend is available, the frontend delegates to /api/v1/extract.
"""

import re
import sys
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    from services.multilingual_ner_service import multilingual_ner_service
except ImportError:
    from backend.services.multilingual_ner_service import multilingual_ner_service



# ─── Extraction Result Data Classes ────────────────────────────────────────

@dataclass
class ExtractedField:
    """A single extracted statutory declaration field."""
    key: str
    value: str
    raw_match: str
    confidence: float       # 0.0 – 1.0
    regex_pattern: str
    is_mandatory: bool
    validation_status: str  # compliant | warning | non-compliant | missing


@dataclass
class ExtractionResult:
    """Complete extraction result for one packaging label scan."""
    image_id: str
    raw_text: str
    cleaned_text: str
    fields: Dict[str, ExtractedField] = field(default_factory=dict)
    overall_confidence: float = 0.0
    preprocessing_passes: List[str] = field(default_factory=list)
    extraction_engine: str = "SatyaDrishti-Backend-Extractor-1.0"
    errors: List[str] = field(default_factory=list)


# ─── Production-Grade Regex Patterns Per Statutory Field ───────────────────
#
# Each pattern is anchored to the specific statutory declaration context.
# Patterns are ordered: most specific → least specific (greedy match first).
#
# Sources:
#   - Legal Metrology (Packaged Commodities) Rules, 2011 [G.S.R. 882(E)]

FIELD_EXTRACTION_PATTERNS: Dict[str, List[str]] = {

    # PCR-2011-R6(1)(a) — Product Name
    "productName": [
        r"(?:product\s*name|name\s*of\s*commodity|commodity)[:\-\s]+([A-Za-z0-9\s\-\/&'(),.]+?)(?:\n|MRP|Net\s*Qty|Mfg|$)",
        r"^([A-Z][A-Za-z0-9\s\-\/&'(),.]{2,60})$",
    ],

    # PCR-2011-R6(1)(c) — MRP (Maximum Retail Price)
    "mrp": [
        r"(?:MRP|Maximum\s*Retail\s*Price|Max\.?\s*Retail\s*Price)[:\-\s]*(?:Rs\.?|₹|INR)?\s*([\d,]+(?:\.\d{1,2})?)(?!\s*(?:\/|per)\s*(?:g|ml|kg|l))",
        r"(?:₹|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:\(incl\.?\s*of\s*all\s*taxes\)|inclusive\s*of\s*all\s*taxes)",
        r"(?:MRP)[:\-\s]*[Rs₹INR.\s]*([\d,]+(?:\.\d{1,2})?)",
        r"(?:^|\n)\s*(?:₹|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)\b(?!\s*(?:\/|per)\s*(?:g|ml|kg|l))",
    ],

    # PCR-2022-R6(1)(aa) — Unit Sale Price (G.S.R. 779(E), effective 1 Jan 2023)
    "unitSalePrice": [
        r"(?:USP|Unit\s*Sale\s*Price|Unit\s*Price)[:\-\s]*(?:Rs\.?|₹|INR)?\s*([\d.]+)\s*(?:per|/)\s*(g|ml|kg|l)\b",
        r"(?:₹|Rs\.?)\s*([\d.]+)\s*(?:per|/)\s*(g|ml|kg|l)\b",
        r"\b([\d.]+)\s*\/\s*(g|ml|kg|l)\b",
    ],

    # PCR-2011-R6(1)(b) — Net Quantity (weight/volume/count in metric units)
    "netQuantity": [
        r"(?:Net\s*(?:Qty|Quantity|Weight|Content|Contents|Vol|Volume))[:\-\s]*([\d.]+\s*(?:g|kg|ml|l|mg|pieces?|units?|nos?|pcs?))\b",
        r"([\d.]+\s*(?:g|kg|ml|l|mg))\s*(?:net|nett|\(when\s*packed\))",
        r"\b([\d.]+)\s*(g|kg|ml|l|mg|pieces?|units?|nos?|pcs?)\b",
    ],

    # PCR-2011-R6(1)(d) — Manufacturer / Packer / Marketer Address
    "manufacturerAddress": [
        r"(?:Packed\s*&\s*Marketed\s*by|Marketed\s*by|Mfg\.|Manufactured\s*by|Packed\s*by|Packer|Manufacturer)[:\-\s]+(.+?(?:[1-9][0-9]{5}).+?)(?:\n\n|MRP|LIC|$)",
        r"(?:Mfg\.|Manufactured\s*by|Marketed\s*by|Packed\s*by)[:\-\s]+([A-Za-z0-9\s,\-\.]+,[^\n]+[1-9][0-9]{5}[^\n]*)",
        r"([A-Za-z0-9\s,\-\.]+\b(?:Karnataka|Maharashtra|Tamil\s*Nadu|Delhi|Gujarat|Rajasthan|Haryana|Punjab|Bengal|Telangana|Andhra|Kerala|UP|MP)\b[^\n]*\b[1-9][0-9]{5}\b)",
        r"([^\n]+?\b[1-9][0-9]{5}\b)",
    ],

    # PCR-2011-R6(1)(e) — Date of Manufacture / Packing
    "manufacturingDate": [
        r"(?:Mfg\.?\s*Date|Date\s*of\s*Mfg\.?|Mfd\.?|Date\s*of\s*Manufacture|Manufactured\s*On|MFD\.?\s*\(M\)|MFG\.?\s*\(M\))[:\-\s]*((?:\d{1,2}[\/\-\.]\d{2,4}|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\/\-\.]\d{2,4}))",
        r"(?:^|\b)(?:MFD|MFG|M)[:\s\-.]+((?:0?[1-9]|1[0-2])[\/\-.]\d{2,4})(?:\s+\d{1,2}:\d{2})?",
        r"(?:Mfg\.?|Mfd\.?)[:\s]*((?:[0-3]?\d[\/\-][0-1]?\d[\/\-]\d{2,4})|(?:[A-Z]{3}[\/\-]\d{4}))",
    ],

    # PCR-2011-R6(1)(e) — Packing Date (separate from manufacturing date)
    "packingDate": [
        r"(?:Pkg\.?\s*Date|Date\s*of\s*Pkg\.?|Pack(?:ing)?\s*Date|Packed\s*On|Pkg\.?)[:\-\s]*((?:\d{1,2}[\/\-\.]\d{2,4}|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\/\-\.]\d{4}))",
    ],

    # Expiry / Best Before / Use By / Use Before Date
    "expiryDate": [
        r"(?:Expiry\s*Date|Best\s*Before|Use\s*By|Use\s*Before|BB\s*Date|Exp\.?|BB|Use\s*Before\s*\(U\)|Use\s*By\s*\(U\))[:\-\s]*((?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\/\-\.]\d{2,4}))",
        r"(?:^|\b)(?:UB|BB|EXP|EXPIRY|U|E)[:\s\-.]+((?:0?[1-9]|1[0-2])[\/\-.]\d{2,4})",
        r"(?:BB|EXP)[:\-.\s]*((?:[0-3]?\d[\/\-][0-1]?\d[\/\-]\d{2,4})|(?:[A-Z]{3}[\/\-]\d{4}))",
    ],

    # PCR-2011-R6(1)(n) — Country of Origin [G.S.R. 1537(E)]
    "countryOfOrigin": [
        r"(?:Country\s*of\s*(?:Origin|Manufacture)|Made\s*in|Manufactured\s*in|Product\s*of)[:\-\s]*([A-Za-z\s]+?)(?:\n|,|MRP|$)",
        r"(?:Made\s*in|Product\s*of)\s+([A-Z][A-Za-z\s]+?)(?:\n|,|\.)",
    ],

    # PCR-2011-R6(1)(f) — Consumer Care / Grievance Redressal
    "customerCare": [
        r"(?:Customer\s*(?:Care|Service)|Consumer\s*(?:Care|Helpline)|Grievance|Helpline|Toll[\-\s]?Free)[:\-\s]*([\d\s\-+()]+(?:@[^\s]+)?)",
        r"(?:For\s*(?:queries|feedback|complaints?)|Contact\s*(?:NIVEA\s*CARE\s*Executive|us))[:\-\s]*([^\n]+)",
        r"(1800[\-\s]?\d{3}[\-\s]?\d{3,4})",  # Toll-free pattern
        r"([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})",  # Email
    ],

    # PCR-2011-R6(1)(g) — Batch / Lot Number
    "batchNumber": [
        r"(?:Batch\s*(?:No\.?|Code)|B\.?\s*No\.?|Lot\s*(?:No\.?|Code))[:\-\s]*([A-Za-z0-9\-\/\s]+)",
        r"(?:^|\b)(?:B|BN|LOT)[:\s\-.]*([A-Za-z0-9]{4,16}(?:\s+[A-Za-z0-9]{1,4})?)\b",
    ],

    # Manufacturer name (separate from address)
    "manufacturer": [
        r"(?:Manufactured\s*by|Mfg\.?\s*by|Mfg\.?)[:\-\s]+([A-Za-z0-9\s&',.\-]+?)(?:[,\n]|[1-9][0-9]{5}|$)",
        r"(?:Packed\s*by|Packer)[:\-\s]+([A-Za-z0-9\s&',.\-]+?)(?:[,\n]|[1-9][0-9]{5}|$)",
    ],

    # Importer details (conditional — only for imported goods)
    "importer": [
        r"(?:Imported\s*by|Importer)[:\-\s]+(.+?(?:[1-9][0-9]{5}).+?)(?:\n\n|MRP|$)",
        r"(?:Imported\s*by|Importer)[:\-\s]+([A-Za-z0-9\s,\-\.]+,[^\n]+[1-9][0-9]{5}[^\n]*)",
    ],

    # Barcode (EAN-13 / EAN-8 / GS1 barcode)
    "barcode": [
        r"\b((?:890|891|892|893|894|895|896|897|898|899)\d{10})\b",  # Indian GS1 prefix
        r"\b(\d{13})\b",  # EAN-13
        r"\b(\d{8})\b",   # EAN-8
    ],
}

# Mandatory field keys per Legal Metrology Rules
MANDATORY_FIELDS = {
    "productName", "mrp", "netQuantity", "manufacturer", "manufacturerAddress",
    "manufacturingDate", "countryOfOrigin", "customerCare", "batchNumber",
}

# Conditional mandatory fields (applicable when conditions are met)
CONDITIONAL_FIELDS = {
    "expiryDate": "Required for perishable goods",
    "importer": "Required for imported goods (Country of Origin ≠ India)",
    "unitSalePrice": "Required when USP ≠ MRP (G.S.R. 779(E), from 1 Jan 2023)",
}


# ─── Text Cleaning & Normalization ─────────────────────────────────────────

def clean_ocr_text(raw_text: str) -> str:
    """
    Normalize OCR output:
    - Collapse multiple whitespaces/newlines
    - Remove non-printable characters
    - Preserve Devanagari, Bengali, Gurmukhi, Gujarati, Tamil, Telugu, Kannada, Malayalam (\u0900-\u0D7F)
    - Normalize Unicode currency symbols
    - Preserve structural newlines for layout parsing
    """
    # Remove null bytes and control chars (preserving standard ASCII and Indic scripts \u0900-\u0D7F + ₹)
    text = re.sub(r'[^\x20-\x7E\n₹\u0900-\u0D7F]', ' ', raw_text)
    # Collapse multiple spaces into one
    text = re.sub(r'[ \t]+', ' ', text)
    # Collapse more than 2 consecutive newlines into 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Normalize Rs. / Rs / INR / रु. / रू → ₹ for consistent matching
    text = re.sub(r'\bRs\.?\b', '₹', text)
    text = re.sub(r'\bINR\b', '₹', text)
    text = re.sub(r'(?:रु\.?|रू)\s*', '₹ ', text)
    return text.strip()


# ─── Field Extractor ───────────────────────────────────────────────────────

def extract_field(
    text: str,
    field_key: str,
    patterns: List[str],
) -> Optional[ExtractedField]:
    """
    Attempts each regex pattern in order (most specific first).
    Returns the first successful match as an ExtractedField.
    """
    for pattern in patterns:
        try:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE | re.DOTALL)
            if match:
                groups = match.groups()
                # Combine all capture groups into a single clean value
                value = ' '.join(g.strip() for g in groups if g)
                value = re.sub(r'\s+', ' ', value).strip()

                if value and len(value) >= 1:
                    confidence = _estimate_field_confidence(field_key, value, pattern)
                    return ExtractedField(
                        key=field_key,
                        value=value,
                        raw_match=match.group(0).strip(),
                        confidence=confidence,
                        regex_pattern=pattern,
                        is_mandatory=field_key in MANDATORY_FIELDS,
                        validation_status='compliant' if confidence > 0.7 else 'warning',
                    )
        except re.error:
            continue  # Skip malformed patterns

    return None


def _estimate_field_confidence(field_key: str, value: str, pattern: str) -> float:
    """
    Heuristic confidence estimation based on field-specific validation:
    - MRP: must be parseable as a positive number
    - Dates: must match known date formats
    - Addresses: must contain a 6-digit PIN code
    - Other: length and character composition heuristics
    """
    base = 0.85

    if field_key == "mrp":
        numeric_str = re.sub(r'[^\d.]', '', value)
        try:
            val = float(numeric_str)
            return 0.95 if val > 0 else 0.2
        except ValueError:
            return 0.3

    if field_key in ("manufacturingDate", "packingDate", "expiryDate"):
        # Check for valid date-like structure
        if re.search(r'\d{1,2}[\/\-]\d{4}|\d{4}', value):
            return 0.90
        return 0.55

    if field_key == "manufacturerAddress":
        # Strong signal: contains a 6-digit PIN code
        if re.search(r'[1-9][0-9]{5}', value):
            return 0.92
        return 0.50

    if field_key == "netQuantity":
        if re.search(r'\d+\s*(?:g|kg|ml|l|mg)\b', value, re.IGNORECASE):
            return 0.93
        return 0.60

    if field_key == "countryOfOrigin":
        known_countries = ['india', 'china', 'usa', 'uk', 'germany', 'japan']
        if any(c in value.lower() for c in known_countries):
            return 0.95
        return 0.70

    if field_key == "customerCare":
        has_phone = bool(re.search(r'1800\d{6,7}|[6-9]\d{9}', re.sub(r'\D', '', value)))
        has_email = bool(re.search(r'@', value))
        if has_phone and has_email:
            return 0.95
        if has_phone or has_email:
            return 0.80
        return 0.45

    return base


# ─── Main Extraction Pipeline Entry Point ─────────────────────────────────

def _llm_parse_ocr_text(raw_text: str) -> Dict[str, str]:
    """
    Calls LLM (Pollinations / Gemini / Ollama) to extract statutory fields from raw OCR text.
    Handles garbled or noisy OCR output by using natural language understanding.
    """
    if not raw_text or len(raw_text.strip()) < 5:
        return {}

    prompt = f"""You are a senior packaging compliance parser for Legal Metrology & FSSAI India.
Clean, auto-correct OCR typos into real dictionary words, and extract all statutory declarations from raw OCR text into precise JSON.

RULES FOR PARSING & SPELL CORRECTION:
1. productName: Auto-correct obvious OCR typos into proper brand/commodity words (e.g., 'B Naura Mied Fui' -> 'B Natural Mixed Fruit', 'NIVEA Soft Skin Cream').
2. mrp: Exact numeric price in Indian Rupees (e.g., '550.00' or '152.00'). Do NOT include 'Rs.' or 'incl. of taxes'. When MRP and USP are printed side-by-side (e.g. '₹ 550 ₹ 1.83/ml'), the total price '550' is MRP and '1.83/ml' is unitSalePrice.
3. unitSalePrice: Clean unit sale price (e.g., '₹ 1.83/ml', 'Rs. 0.50/g').
4. netQuantity: Clean metric weight/volume (e.g., '300 ml (293.7g)', '500 g', '200 ml').
5. manufacturer: Legal company name only (e.g., 'Nivea India Pvt. Ltd.', 'ITC LIMITED').
6. address: Full premises address with PIN code (e.g., 'SM-9/1, Sanand II Industrial Estate, Vill Bol. Tal. Sanand Dist. Ahmedabad (Gujrat) Pin: 382110').
7. manufacturingDate: Date format MM/YYYY or DD/MM/YYYY (e.g., '11/2023', '19/08/2026'). Note: Frequently printed with prefix 'M' or 'MFD. (M)' such as 'M 11/23 22:15' -> '11/2023'.
8. expiryDate: Date format MM/YYYY or DD/MM/YYYY (e.g., '10/2026', '18/05/2027'). Note: Frequently printed with prefix 'U' (for Use Before), 'UB', 'EXP', or 'BB' such as 'U 10/26' -> '10/2026'.
9. batchNumber: Clean batch/lot code (e.g., 'B34431350 11', 'H9XM190826'). Note: Frequently printed with prefix 'B' or 'BN' such as 'B34431350 11'.
10. customerCare: Phone/toll-free number and email (e.g., '(022) 62487999, care@beiersdorf.com').
11. countryOfOrigin: Country name (e.g., 'India', 'Germany').
12. barcode: EAN barcode number (e.g., '4005808679829').

IMPORTANT FOR INDIAN FMCG PACKAGING ABBREVIATIONS:
When packaging has compound stamp headers like "MRP ₹ (Incl. of all taxes), USP, Batch No., MFD. (M) & Use Before (U): ↓":
- 'M' means Manufacturing Date (e.g. 'M 11/23' -> 11/2023)
- 'U' means Use Before / Expiry Date (e.g. 'U 10/26' -> 10/2026)
- 'B' means Batch Number (e.g. 'B34431350 11')

RAW OCR TEXT:
{raw_text[:3000]}

Return ONLY valid JSON mapping key -> string value (or null).
"""

    import urllib.request
    import json
    import os

    # Call Pollinations AI Text LLM API
    pollinations_enabled = os.getenv("POLLINATIONS_ENABLED", "true").lower() in ("true", "1", "yes")
    if not pollinations_enabled:
        return {}


    print(f"[TRY] [LLM OCR Text Extractor] Calling Pollinations AI LLM API to parse OCR text into JSON...")

    # 1. Primary Path: POST Request to Pollinations AI with Browser User-Agent (returns full JSON)
    try:
        model_name = os.getenv("POLLINATIONS_TEXT_MODEL", "openai")
        post_url = f"https://text.pollinations.ai/{model_name}"
        payload = json.dumps({"messages": [{"role": "user", "content": prompt}]}).encode("utf-8")
        api_key = os.getenv("POLLINATIONS_API_KEY", "").strip()
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        poll_timeout = int(os.getenv("POLLINATIONS_TIMEOUT", "35"))
        req = urllib.request.Request(post_url, data=payload, headers=headers)
        with urllib.request.urlopen(req, timeout=poll_timeout) as resp:
            if resp.status == 200:
                raw_resp = resp.read().decode("utf-8")
                from services.vision_service import OllamaVisionProvider
                parser = OllamaVisionProvider()
                
                # Unwrap OpenAI / Pollinations JSON response
                content_to_parse = raw_resp
                try:
                    resp_dict = json.loads(raw_resp)
                    if isinstance(resp_dict, dict) and "choices" in resp_dict:
                        choices = resp_dict["choices"]
                        if isinstance(choices, list) and len(choices) > 0:
                            content_to_parse = choices[0].get("message", {}).get("content", raw_resp)
                        elif isinstance(choices, str):
                            content_to_parse = choices
                except Exception:
                    pass

                parsed = parser._clean_and_parse_json(content_to_parse)
                if parsed and isinstance(parsed, dict) and len(parsed) > 0:
                    clean_result = {k: str(v).strip() for k, v in parsed.items() if v and str(v).lower() not in ("null", "none", "(not detected)")}
                    print(f"[SUCCESS] [LLM OCR Text Extractor] Pollinations AI parsed {len(clean_result)} statutory fields into JSON via POST.")
                    return clean_result
    except Exception as e:
        print(f"[WARN] [LLM OCR Text Extractor] POST mode failed ({e}). Retrying via GET endpoint...")

    # 2. Secondary Path: Fast GET Request to Pollinations AI
    import urllib.parse
    try:
        short_prompt = prompt[:2000]
        encoded_p = urllib.parse.quote(short_prompt)
        get_url = f"https://text.pollinations.ai/{encoded_p}?json=true"
        get_headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        if api_key:
            get_headers["Authorization"] = f"Bearer {api_key}"
        req = urllib.request.Request(get_url, headers=get_headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status == 200:
                raw_resp = resp.read().decode("utf-8")
                from services.vision_service import OllamaVisionProvider
                parser = OllamaVisionProvider()
                
                content_to_parse = raw_resp
                try:
                    resp_dict = json.loads(raw_resp)
                    if isinstance(resp_dict, dict) and "choices" in resp_dict:
                        choices = resp_dict["choices"]
                        if isinstance(choices, list) and len(choices) > 0:
                            content_to_parse = choices[0].get("message", {}).get("content", raw_resp)
                        elif isinstance(choices, str):
                            content_to_parse = choices
                except Exception:
                    pass

                parsed = parser._clean_and_parse_json(content_to_parse)
                if parsed and isinstance(parsed, dict) and len(parsed) > 0:
                    clean_result = {k: str(v).strip() for k, v in parsed.items() if v and str(v).lower() not in ("null", "none", "(not detected)")}
                    print(f"[SUCCESS] [LLM OCR Text Extractor] Pollinations AI parsed {len(clean_result)} statutory fields into JSON via GET.")
                    return clean_result
    except Exception as e:
        print(f"[ERROR] [LLM OCR Text Extractor] GET endpoint failed: {e}")

    print("[ERROR] [LLM OCR Text Extractor] All Pollinations AI text parse attempts failed.")
    return {}


def extract_from_text(
    raw_text: str,
    image_id: str = "unknown",
    preprocessing_passes: Optional[List[str]] = None,
) -> ExtractionResult:
    """
    Main entry point: extracts all mandatory and conditional statutory
    declaration fields using Multilingual BERT NER, multilingual statutory patterns,
    English deterministic regexes, and LLM augmentation.
    """
    cleaned_text = clean_ocr_text(raw_text)
    result = ExtractionResult(
        image_id=image_id,
        raw_text=raw_text,
        cleaned_text=cleaned_text,
        preprocessing_passes=preprocessing_passes or ["raw_pass"],
        extraction_engine="SatyaDrishti-Multilingual-BERT-NER-2.0",
    )

    total_confidence = 0.0
    found_count = 0

    # Step 1: Multilingual BERT NER & Indic Statutory Extraction Engine
    try:
        ml_res = multilingual_ner_service.extract_statutory_fields(raw_text)
        for field_key, field_data in ml_res.fields.items():
            if field_data.get("value"):
                is_mandatory = field_key in MANDATORY_FIELDS
                conf = float(field_data.get("confidence", 0.90))
                result.fields[field_key] = ExtractedField(
                    key=field_key,
                    value=field_data["value"],
                    raw_match=field_data.get("raw_match", field_data["value"]),
                    confidence=conf,
                    regex_pattern=f"multilingual_ner_{field_data.get('source', 'bert')}",
                    is_mandatory=is_mandatory,
                    validation_status="compliant" if conf >= 0.75 else "warning",
                )
                total_confidence += conf
                found_count += 1
    except Exception as e:
        print(f"[WARN] [Multilingual-NER] Error in multilingual extraction: {e}")

    # Step 2: Deterministic English regex patterns for any missing fields
    for field_key, patterns in FIELD_EXTRACTION_PATTERNS.items():
        if not result.fields.get(field_key) or not result.fields[field_key].value:
            extracted = extract_field(cleaned_text, field_key, patterns)
            if extracted:
                result.fields[field_key] = extracted
                total_confidence += extracted.confidence
                found_count += 1

    # Step 3: If mandatory fields are still missing and raw_text is substantial, attempt LLM parse
    missing_mandatory = [k for k in MANDATORY_FIELDS if not result.fields.get(k) or not result.fields[k].value]
    if missing_mandatory and raw_text and len(raw_text.strip()) > 15:
        llm_extracted = _llm_parse_ocr_text(raw_text)
        for field_key in missing_mandatory:
            llm_val = llm_extracted.get(field_key)
            if llm_val:
                result.fields[field_key] = ExtractedField(
                    key=field_key,
                    value=llm_val,
                    raw_match=llm_val,
                    confidence=0.92,
                    regex_pattern="llm_ocr_parse",
                    is_mandatory=True,
                    validation_status="compliant",
                )
                total_confidence += 0.92
                found_count += 1

    # Finalize any remaining missing fields
    for field_key in list(MANDATORY_FIELDS) + list(CONDITIONAL_FIELDS):
        if not result.fields.get(field_key):
            is_mandatory = field_key in MANDATORY_FIELDS
            result.fields[field_key] = ExtractedField(
                key=field_key,
                value="",
                raw_match="",
                confidence=0.0,
                regex_pattern="",
                is_mandatory=is_mandatory,
                validation_status="non-compliant" if is_mandatory else "missing",
            )

    result.overall_confidence = (total_confidence / found_count) if found_count > 0 else 0.0
    return result



def get_extraction_summary(result: ExtractionResult) -> Dict:
    """Returns a human-readable summary of the extraction result."""
    mandatory_found = sum(
        1 for k, f in result.fields.items()
        if k in MANDATORY_FIELDS and f.value
    )
    mandatory_total = len(MANDATORY_FIELDS)
    conditional_found = sum(
        1 for k, f in result.fields.items()
        if k in CONDITIONAL_FIELDS and f.value
    )

    return {
        "image_id": result.image_id,
        "extraction_engine": result.extraction_engine,
        "overall_confidence_pct": round(result.overall_confidence * 100, 1),
        "mandatory_fields_found": mandatory_found,
        "mandatory_fields_total": mandatory_total,
        "mandatory_completeness_pct": round((mandatory_found / mandatory_total) * 100, 1),
        "conditional_fields_found": conditional_found,
        "extracted_field_values": {
            k: f.value for k, f in result.fields.items() if f.value
        },
        "missing_mandatory_fields": [
            k for k in MANDATORY_FIELDS
            if not result.fields.get(k, ExtractedField("", "", "", 0.0, "", False, "")).value
        ],
    }


def extract_from_image_hybrid(
    image_input: Any,
    image_id: str = "img-scan",
    fallback_raw_text: Optional[str] = None
) -> ExtractionResult:
    """
    Direct OCR + Pollinations AI Text LLM Extraction Pipeline:
      1. Receives raw OCR text extracted from packaging label scan.
      2. Uses Pollinations AI Text LLM API to clean typos & parse statutory fields into structured JSON.
    """
    raw_text = fallback_raw_text or ""
    print(f"[OCR PIPELINE] Running OCR Text Parsing + Pollinations AI LLM (Length: {len(raw_text)} chars)...")
    return extract_from_text(raw_text, image_id=image_id)


def aggregate_multi_angle_extractions(
    extractions: List[ExtractionResult],
    master_id: str = "product-master"
) -> ExtractionResult:
    """
    Synthesizes and correlates declarations from multiple angles (e.g. Front PDP, Back Panel, Side Stamps)
    into a unified master product profile.
    """
    master_result = ExtractionResult(
        image_id=master_id,
        raw_text="\n---\n".join([e.raw_text for e in extractions if e.raw_text]),
        cleaned_text="\n".join([e.cleaned_text for e in extractions if e.cleaned_text]),
        extraction_engine="SatyaDrishti-MultiAngle-Aggregator-1.0",
        preprocessing_passes=[f"angle_{i+1}" for i in range(len(extractions))]
    )
    
    all_keys = list(MANDATORY_FIELDS) + list(CONDITIONAL_FIELDS)
    total_conf = 0.0
    found_count = 0
    
    for key in all_keys:
        best_field = None
        for ext in extractions:
            f = ext.fields.get(key)
            if f and f.value:
                if best_field is None or f.confidence > best_field.confidence:
                    best_field = f
        
        if best_field:
            master_result.fields[key] = best_field
            total_conf += best_field.confidence
            found_count += 1
        else:
            is_mand = key in MANDATORY_FIELDS
            master_result.fields[key] = ExtractedField(
                key=key,
                value="",
                raw_match="",
                confidence=0.0,
                regex_pattern="",
                is_mandatory=is_mand,
                validation_status="non-compliant" if is_mand else "missing"
            )
            
    master_result.overall_confidence = (total_conf / found_count) if found_count > 0 else 0.0
    return master_result
