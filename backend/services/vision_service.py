"""
SatyaDrishti Hybrid Vision Extraction Service

Coordinates multimodal vision models (Local Ollama Vision LLMs like Qwen2.5-VL / MiniCPM-V / Llama3.2-Vision
and Cloud Gemini Flash Vision) for statutory packaging declaration extraction.

Statutory Frameworks:
  - Legal Metrology (Packaged Commodities) Rules, 2011 [G.S.R. 882(E)]
  - Unit Sale Price Amendment [G.S.R. 779(E), effective 1 Jan 2023]
  - Country of Origin Mandatory Declaration [G.S.R. 1537(E)]
  - Consumer Protection Act, 2019 / E-Commerce Rules, 2020
"""

import os
import sys
import json
import base64
import urllib.request
import urllib.error
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Default Configurations
DEFAULT_OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "qwen2.5-vl")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
POLLINATIONS_API_KEY = os.getenv("POLLINATIONS_VISION_API_KEY") or os.getenv("POLLINATIONS_API_KEY", "")
POLLINATIONS_BASE_URL = os.getenv("POLLINATIONS_VISION_BASE_URL") or os.getenv("POLLINATIONS_BASE_URL", "https://gen.pollinations.ai")
POLLINATIONS_VISION_MODEL = os.getenv("POLLINATIONS_VISION_MODEL", "openai")


STATUTORY_VISION_PROMPT = """You are SatyaDrishti's statutory packaging compliance inspector under the Legal Metrology Act, 2009, Legal Metrology (Packaged Commodities) Rules 2011/2022, and Consumer Protection Regulations.

Carefully inspect all text, labels, stamps, dot-matrix imprints, symbols, and tables in this product image (including curved surfaces, bottle sides, and nutritional panels).

Extract the following statutory declarations into exact JSON. Fill ALL fields you can see:
{
  "manufacturer": "Name of manufacturer, packer, or marketer company (Look for 'Packed & Marketed by', 'Manufactured by', 'Marketed by', 'Mfg. by', 'Mfrd. by', or visible company name on label)",
  "manufacturerAddress": "Complete premises address with 6-digit PIN code (Look for address block after 'Packed & Marketed by', 'Manufactured by', or any address line with PIN)",
  "productName": "Generic or common name of commodity / brand title",
  "mrp": "Maximum Retail Price number only (e.g. 550.00 or 152.00, or null if blank). If MRP and USP are printed side-by-side like '₹ 550 ₹ 1.83/ml', '550' is mrp and '1.83/ml' is unitSalePrice.",
  "mrpRaw": "Exact raw text of MRP clause (e.g. MRP Rs. 550.00 incl. of all taxes, or null if blank)",
  "netQuantity": "Net weight/volume/count in metric units (e.g. 300ml (293.7g), 500 g, 20 g, 350 ml)",
  "unitSalePrice": "Unit Sale Price (e.g. Rs. 1.83 / ml or Rs. 0.50 / g, or null if not declared)",
  "manufacturingDate": "Date of manufacture/packing (e.g. MM/YYYY, DD/MM/YYYY, or null if blank). Note: Often printed as 'M MM/YY' like 'M 11/23 22:15' -> '11/2023'",
  "expiryDate": "Expiry / Best Before / Use By date (e.g. MM/YYYY, or null if blank). Note: Often printed as 'U MM/YY' like 'U 10/26' -> '10/2026'",
  "batchNumber": "Batch or Lot number (e.g. B34431350 11, BN: 1234, or null if blank)",
  "countryOfOrigin": "Country of Origin / Manufacture (e.g. Product of India, Made in India, Germany)",
  "customerCare": "Consumer grievance redressal toll-free number, telephone, or email",
  "vegNonVeg": "VEG (Green dot in square) or NON-VEG (Brown triangle in square) or NONE",
  "rawDetectedText": "Key transcript of all visible text on package"
}

IMPORTANT FOR INDIAN FMCG PACKAGING ABBREVIATIONS:
When packaging has compound stamp headers like "MRP ₹ (Incl. of all taxes), USP, Batch No., MFD. (M) & Use Before (U): ↓":
- 'M' means Manufacturing Date (e.g. 'M 11/23' -> 11/2023)
- 'U' means Use Before / Expiry Date (e.g. 'U 10/26' -> 10/2026)
- 'B' means Batch Number (e.g. 'B34431350 11')
- manufacturer and manufacturerAddress are critical fields — always extract them even if other fields are unclear.
- If a field is blank/unprinted, set its value to null.
- For manufacturerAddress: Extract full address with PIN code. Include street, city, state, PIN.
Return ONLY the JSON object without markdown fences or extra text.
"""

def encode_image_to_base64(image_path_or_bytes: Any, max_dimension: int = 896) -> str:
    """Encodes an image file path or raw bytes to a base64 string, resizing to optimal dimension for speed and accuracy."""
    try:
        from PIL import Image
        import io
        
        if isinstance(image_path_or_bytes, (str, Path)):
            p = Path(image_path_or_bytes)
            if not p.exists():
                raise FileNotFoundError(f"Image file not found: {p}")
            with Image.open(p) as img:
                img = img.convert("RGB")
                if max(img.size) > max_dimension:
                    img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=85)
                return base64.b64encode(buf.getvalue()).decode("utf-8")
        elif isinstance(image_path_or_bytes, bytes):
            with Image.open(io.BytesIO(image_path_or_bytes)) as img:
                img = img.convert("RGB")
                if max(img.size) > max_dimension:
                    img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=85)
                return base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception:
        # Fallback to direct bytes if PIL is not available
        if isinstance(image_path_or_bytes, (str, Path)):
            with open(Path(image_path_or_bytes), "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")
        elif isinstance(image_path_or_bytes, bytes):
            return base64.b64encode(image_path_or_bytes).decode("utf-8")
    raise ValueError("image_path_or_bytes must be a file path str/Path or raw bytes.")


class OllamaVisionProvider:
    """Local Vision Extraction via Ollama (qwen2.5-vl, minicpm-v, llama3.2-vision)."""

    def __init__(
        self,
        base_url: str = DEFAULT_OLLAMA_BASE_URL,
        model_name: str = DEFAULT_OLLAMA_VISION_MODEL,
        timeout_seconds: int = 120
    ):
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name
        self.timeout = timeout_seconds


    def is_available(self) -> bool:
        """Checks if local Ollama server is running and accessible."""
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags", headers={"User-Agent": "SatyaDrishti-Agent"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    tags = json.loads(resp.read().decode("utf-8"))
                    installed = [m.get("name", "") for m in tags.get("models", [])]
                    if installed:
                        if self.model_name in installed:
                            return True
                        clean_target = self.model_name.lower().replace("-", "").replace(":", "")
                        for m in installed:
                            clean_m = m.lower().replace("-", "").replace(":", "")
                            if clean_target in clean_m or clean_m in clean_target:
                                self.model_name = m
                                return True
                        self.model_name = installed[0]
                        return True
                return False
        except Exception:
            return False

    def extract_declarations(self, base64_image: str) -> Tuple[Optional[Dict[str, Any]], str]:
        """Calls Ollama /api/chat endpoint with image, token pruning, and speed optimizations."""
        self.is_available()

        num_predict = int(os.getenv("OLLAMA_NUM_PREDICT", "900"))
        num_ctx = int(os.getenv("OLLAMA_NUM_CTX", "4096"))

        payload = {
            "model": self.model_name,
            "messages": [
                {
                    "role": "user",
                    "content": STATUTORY_VISION_PROMPT,
                    "images": [base64_image]
                }
            ],
            "options": {
                "num_ctx": num_ctx,
                "temperature": 0.05,
                "top_p": 0.85,
                "num_predict": num_predict,
                "num_gpu": 99,
            },
            "stream": False,
            "format": "json"
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/api/chat",
            data=data_bytes,
            headers={"Content-Type": "application/json", "User-Agent": "SatyaDrishti-Agent"}
        )

        try:
            import time
            start_t = time.time()
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    resp_json = json.loads(resp.read().decode("utf-8"))
                    raw_text = resp_json.get("message", {}).get("content", "")
                    elapsed = time.time() - start_t
                    eval_count = resp_json.get("eval_count", 0)
                    eval_duration_s = resp_json.get("eval_duration", 0) / 1e9
                    tok_per_sec = (eval_count / eval_duration_s) if eval_duration_s > 0 else 0
                    print(f"[Ollama Vision] Model: {self.model_name} | Elapsed: {elapsed:.2f}s | Speed: {tok_per_sec:.1f} tok/s | Tokens: {eval_count}")
                    extracted = self._clean_and_parse_json(raw_text)
                    return extracted, raw_text
                return None, f"Ollama HTTP {resp.status}"
        except Exception as e:
            return None, str(e)


    def _clean_and_parse_json(self, raw_str: str) -> Optional[Dict[str, Any]]:
        import re
        raw_str = raw_str.strip()

        # If Pollinations/OpenAI wrapper structure exists, extract content first
        if "'content':" in raw_str or '"content":' in raw_str:
            m_content = re.search(r'[\'"]content[\'"]\s*:\s*[\'"]({.*})[\'"]', raw_str, re.DOTALL)
            if m_content:
                raw_str = m_content.group(1).replace("\\n", "\n").replace('\\"', '"').replace("\\\\", "\\")

        # 1. Try standard JSON parse / markdown fence cleaning first
        clean_s = raw_str
        if clean_s.startswith("```json"):
            clean_s = clean_s[7:]
        if clean_s.startswith("```"):
            clean_s = clean_s[3:]
        if clean_s.endswith("```"):
            clean_s = clean_s[:-3]
        clean_s = clean_s.strip()

        try:
            parsed = json.loads(clean_s)
            if isinstance(parsed, dict):
                statutory_keys = {"productName", "mrp", "netQuantity", "manufacturer", "address", "manufacturerAddress", "manufacturingDate", "expiryDate", "batchNumber", "customerCare", "countryOfOrigin", "barcode"}
                if any(k in statutory_keys for k in parsed.keys()):
                    return parsed
        except Exception:
            pass

        # 2. Extract outermost statutory JSON block using { and }
        s = raw_str.find("{")
        e = raw_str.rfind("}")
        if s != -1 and e != -1 and e > s:
            json_snippet = raw_str[s:e+1].replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
            try:
                parsed_inner = json.loads(json_snippet)
                if isinstance(parsed_inner, dict):
                    statutory_keys = {"productName", "mrp", "netQuantity", "manufacturer", "address", "manufacturerAddress", "manufacturingDate", "expiryDate", "batchNumber", "customerCare", "countryOfOrigin", "barcode"}
                    if any(k in statutory_keys for k in parsed_inner.keys()):
                        return parsed_inner
            except Exception:
                pass

        # 3. Key-value regex extractor fallback across statutory fields
        statutory_keys = [
            "productName", "mrp", "mrpRaw", "unitSalePrice", "netQuantity",
            "manufacturer", "address", "manufacturerAddress", "manufacturingDate", "expiryDate",
            "batchNumber", "countryOfOrigin", "customerCare", "barcode",
            "vegNonVeg", "rawDetectedText"
        ]
        
        res: Dict[str, Any] = {}
        for k in statutory_keys:
            m = re.search(rf'"{k}"\s*:\s*("(?:[^"\\]|\\.)*"|null|true|false|\d+(?:\.\d+)?)', raw_str)
            if m:
                val = m.group(1).strip()
                if val.startswith('"') and val.endswith('"'):
                    val = val[1:-1].replace('\\"', '"')
                if val and val.lower() not in ("null", "none"):
                    res[k] = val

        return res if res else None


class PollinationsVisionProvider:
    """Cloud Vision Extraction via Pollinations AI API."""

    def __init__(
        self,
        api_key: str = POLLINATIONS_API_KEY,
        base_url: str = POLLINATIONS_BASE_URL,
        model_name: str = POLLINATIONS_VISION_MODEL,
        timeout_seconds: int = 60,
    ):
        self.api_key = api_key or os.getenv("POLLINATIONS_API_KEY", "")
        self.base_url = (base_url or os.getenv("POLLINATIONS_BASE_URL", "https://gen.pollinations.ai")).rstrip("/")
        self.model_name = model_name or os.getenv("POLLINATIONS_VISION_MODEL", "openai")
        self.timeout = timeout_seconds

    def is_available(self) -> bool:
        enabled = os.getenv("POLLINATIONS_ENABLED", "true").lower() in ("true", "1", "yes")
        return bool(enabled and (self.api_key or "pollinations.ai" in self.base_url))



    def extract_declarations(self, base64_image: str) -> Tuple[Optional[Dict[str, Any]], str]:
        if not self.is_available():
            print("[Pollinations Vision] Skipped: Pollinations AI is disabled or not configured.")
            return None, "Pollinations AI not configured/available."

        models_to_try = [self.model_name]
        if "openai" not in models_to_try:
            models_to_try.append("openai")

        url = f"{self.base_url}/v1/chat/completions" if not self.base_url.endswith("/v1/chat/completions") else self.base_url
        print(f"[Pollinations Vision] Sending request to {url} (models to try: {models_to_try})...")

        for m_name in models_to_try:
            payload = {
                "model": m_name,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": STATUTORY_VISION_PROMPT},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"}
            }

            headers = {
                "Content-Type": "application/json",
                "User-Agent": "SatyaDrishti-VisionAgent"
            }
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            data_bytes = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=data_bytes, headers=headers)

            try:
                import time
                start_t = time.time()
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    elapsed = time.time() - start_t
                    if resp.status == 200:
                        resp_json = json.loads(resp.read().decode("utf-8"))
                        choices = resp_json.get("choices", [])
                        raw_text = ""
                        if choices:
                            raw_text = choices[0].get("message", {}).get("content", "")
                        elif "content" in resp_json:
                            raw_text = resp_json.get("content", "")

                        parser = OllamaVisionProvider()
                        extracted = parser._clean_and_parse_json(raw_text) or {}
                        print(f"[DEBUG] Pollinations raw response text (first 300 chars): {repr(raw_text[:300])}")
                        print(f"[DEBUG] Pollinations parsed keys: {list(extracted.keys()) if isinstance(extracted, dict) else extracted}")

                        statutory_keys = {
                            "productName", "mrp", "netQuantity", "manufacturer",
                            "manufacturerAddress", "manufacturingDate", "expiryDate",
                            "batchNumber", "fssaiLicense", "customerCare", "countryOfOrigin"
                        }
                        has_statutory_fields = any(
                            k in statutory_keys and isinstance(v, str) and v.strip() and v != "(Not detected)"
                            for k, v in extracted.items()
                        )
                        if has_statutory_fields:
                            print(f"[SUCCESS] [Pollinations Vision] Model: {m_name} | Elapsed: {elapsed:.2f}s | Extracted {len(extracted)} fields.")
                            return extracted, raw_text
                        else:
                            print(f"[WARN] [Pollinations Vision] Model {m_name} returned status 200 but no valid statutory fields detected.")

            except Exception as e:
                print(f"[ERROR] [Pollinations Vision] Model '{m_name}' failed: {e}")
                continue

        print("[FAIL] [Pollinations Vision] All Pollinations Vision attempts failed or rate-limited.")
        return None, "All Pollinations Vision models failed or rate-limited."


class GeminiVisionProvider:
    """Cloud Vision Extraction via Google Gemini API."""

    def __init__(self, api_key: str = GEMINI_API_KEY, timeout_seconds: int = 45):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.timeout = timeout_seconds

    def is_available(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    def extract_declarations(self, base64_image: str) -> Tuple[Optional[Dict[str, Any]], str]:
        if not self.is_available():
            return None, "GEMINI_API_KEY not configured."

        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": STATUTORY_VISION_PROMPT},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64_image
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=data_bytes,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    resp_json = json.loads(resp.read().decode("utf-8"))
                    candidates = resp_json.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_text = parts[0].get("text", "")
                            extracted = json.loads(raw_text.strip())
                            print(f"[SUCCESS] [Gemini Vision] Extracted {len(extracted)} fields via Gemini 1.5 Flash.")
                            return extracted, raw_text
                return None, f"Gemini HTTP {resp.status}"
        except Exception as e:
            print(f"[ERROR] [Gemini Vision] Failed: {e}")
            return None, str(e)


class HybridVisionService:
    """
    Main Statutory Extraction Pipeline:
      1. Keep image preprocessing and OCR local to the application.
      2. Hand the resulting OCR transcript to the text-only LLM parser.

    Privacy boundary: this service must not forward packaging images to a
    remote vision provider. The image-capable provider classes remain
    available for explicit future use, but are not part of the product scan
    path.
    """

    def __init__(self):
        self.pollinations = PollinationsVisionProvider()

    def extract_from_image(self, image_input: Any) -> Dict[str, Any]:
        """
        Preserve the image-only entry point without forwarding the image.

        The caller supplies the local OCR transcript separately to
        ``extract_from_text``. Returning an explicit OCR-only response here
        prevents accidental base64 encoding or remote image upload.
        """
        return {
            "status": "ocr_only",
            "provider": "none",
            "message": "Image remains local; only the OCR transcript may be sent to the text parser.",
            "fields": {},
        }


# Singleton instance
vision_service = HybridVisionService()

