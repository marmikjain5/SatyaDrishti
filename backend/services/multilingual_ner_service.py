"""
Multilingual BERT Named Entity Recognition (NER) & Indic Statutory Declaration Service
For Legal Metrology (Packaged Commodities) Rules, 2011/2022 Compliance Automation.

Features:
- Non-blocking Multilingual BERT (mBERT) Token Classification (Davlan/distilbert-base-multilingual-cased-ner-hrl).
- Background worker for transformer weight initialization (never freezes the server or OCR pipeline).
- Native Indic Script & Language Detection across Devanagari (Hindi, Marathi), Bengali, Tamil, Telugu, Gujarati, Kannada, and Malayalam.
- Indic Digit Normalization (Devanagari ०-९ and Bengali ০-৯ to standard Arabic numerals 0-9).
- Statutory Packaging Declaration Gazetteer with regional language patterns for Indian FMCG labels.
"""

import os
import re
import sys
import threading
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field

logger = logging.getLogger("satya_multilingual_ner")
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("[%(levelname)s] [Multilingual-NER] %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# Indic to Arabic Numerals Mapping
INDIC_DIGITS_MAP = {
    # Devanagari
    '\u0966': '0', '\u0967': '1', '\u0968': '2', '\u0969': '3', '\u096A': '4',
    '\u096B': '5', '\u096C': '6', '\u096D': '7', '\u096E': '8', '\u096F': '9',
    # Bengali
    '\u09E6': '0', '\u09E7': '1', '\u09E8': '2', '\u09E9': '3', '\u09EA': '4',
    '\u09EB': '5', '\u09EC': '6', '\u09ED': '7', '\u09EE': '8', '\u09EF': '9',
    # Gujarati
    '\u0AE6': '0', '\u0AE7': '1', '\u0AE8': '2', '\u0AE9': '3', '\u0AEA': '4',
    '\u0AEB': '5', '\u0AEC': '6', '\u0AED': '7', '\u0AEE': '8', '\u0AEF': '9',
}

def normalize_indic_digits(text: str) -> str:
    """Converts Devanagari, Bengali, and Gujarati numerals to standard ASCII 0-9."""
    for indic_char, ascii_char in INDIC_DIGITS_MAP.items():
        if indic_char in text:
            text = text.replace(indic_char, ascii_char)
    return text


def detect_scripts(text: str) -> List[str]:
    """Identifies scripts present in the text."""
    scripts = []
    if re.search(r'[\u0900-\u097F]', text):
        scripts.append("devanagari")  # Hindi, Marathi, Nepali, Sanskrit
    if re.search(r'[\u0980-\u09FF]', text):
        scripts.append("bengali")     # Bengali, Assamese
    if re.search(r'[\u0B80-\u0BFF]', text):
        scripts.append("tamil")
    if re.search(r'[\u0C00-\u0C7F]', text):
        scripts.append("telugu")
    if re.search(r'[\u0A80-\u0AFF]', text):
        scripts.append("gujarati")
    if re.search(r'[\u0C80-\u0CFF]', text):
        scripts.append("kannada")
    if re.search(r'[\u0D00-\u0D7F]', text):
        scripts.append("malayalam")
    if re.search(r'[A-Za-z]', text):
        scripts.append("latin")
    return scripts or ["latin"]


@dataclass
class MultilingualEntity:
    entity_group: str  # ORG, LOC, PER, MISC, DATE, MONEY, QUANTITY
    word: str
    score: float
    start: int = 0
    end: int = 0


@dataclass
class StatutoryNerResult:
    fields: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    detected_entities: List[MultilingualEntity] = field(default_factory=list)
    detected_scripts: List[str] = field(default_factory=list)
    ner_model_used: str = "none"


# ─── Comprehensive Multilingual Statutory Patterns ─────────────────────────
MULTILINGUAL_STATUTORY_PATTERNS: Dict[str, List[str]] = {

    # 1. Product Name / Commodity (PCR-2011-R6(1)(a))
    "productName": [
        # Hindi / Marathi
        r"(?:उत्पाद(?: का नाम)?|वस्तु(?: का नाम)?|सामग्री|ब्रांड|जिंस)[:\-\s]+([^\n।,\.]{2,80})",
        # Bengali
        r"(?:পণ্য(?:র নাম)?|বস্তু|সামগ্রী)[:\-\s]+([^\n।,\.]{2,80})",
        # Tamil
        r"(?:பொருள்(?: பெயர்)?|தயாரிப்பு(?: பெயர்)?)[:\-\s]+([^\n,\.]{2,80})",
        # Telugu
        r"(?:ఉత్పత్తి(?: పేరు)?|వస్తువు(?: పేరు)?)[:\-\s]+([^\n,\.]{2,80})",
        # Gujarati
        r"(?:ઉત્પાદન|વસ્તુનું નામ)[:\-\s]+([^\n,\.]{2,80})",
    ],

    # 2. Maximum Retail Price (MRP) (PCR-2011-R6(1)(c))
    "mrp": [
        # Hindi / Marathi
        r"(?:अधिकतम\s*खुदरा\s*मूल्य|खुदरा\s*मूल्य|एम\.?आर\.?पी\.?|मूल्य|किंमत)[:\-\s]*(?:रु\.?|₹|रू|INR)?\s*([\d,]+(?:\.\d{1,2})?)(?!\s*(?:\/|प्रति)\s*(?:ग्राम|किग्रा|मिली|लीटर|g|ml))",
        # Bengali
        r"(?:সর্বোচ্চ\s*খুচরা\s*মূল্য|খুচরা\s*মূল্য|এমআরপি)[:\-\s]*(?:টাকা|₹|रु)?\s*([\d,]+(?:\.\d{1,2})?)",
        # Tamil
        r"(?:அதிகபட்ச\s*சில்லறை\s*விலை|சில்லறை\s*விலை|விலை|எம்ஆர்பி)[:\-\s]*(?:ரூ\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
        # Telugu
        r"(?:గరిష్ట\s*చిల్లర\s*ధర|చిల్లర\s*ధర|ధర|ఎంఆర్పీ)[:\-\s]*(?:రూ\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
        # Gujarati
        r"(?:મહત્તમ\s*છૂટક\s*કિંમત|છૂટક\s*કિંમત|કિંમત)[:\-\s]*(?:રૂ\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
        # Kannada
        r"(?:ಗರಿಷ್ಠ\s*ಚಿಲ್ಲರೆ\s*ಬೆಲೆ|ಚಿಲ್ಲರೆ\s*ಬೆಲೆ|ಬೆಲೆ)[:\-\s]*(?:ರೂ\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
        # Direct ₹ / Rs followed by taxes disclaimer in Indic
        r"(?:₹|रु\.?|रू)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:सभी\s*करों\s*सहित|करों\s*सहित|सर्व\s*करांसहित)",
    ],

    # 3. Unit Sale Price (PCR-2022-R6(1)(aa))
    "unitSalePrice": [
        # Hindi / Marathi
        r"(?:इकाई\s*बिक्री\s*मूल्य|प्रति\s*इकाई\s*मूल्य|यूएसपी)[:\-\s]*(?:रु\.?|₹)?\s*([\d.]+)\s*(?:प्रति|\/)\s*(ग्राम|किग्रा|मिली|लीटर|g|kg|ml|l)\b",
        # Direct Indic currency per unit
        r"(?:₹|रु\.?)\s*([\d.]+)\s*(?:प्रति|\/)\s*(ग्राम|किग्रा|मिली|लीटर|g|kg|ml|l)\b",
    ],

    # 4. Net Quantity (PCR-2011-R6(1)(b))
    "netQuantity": [
        # Hindi / Marathi
        r"(?:शुद्ध\s*मात्रा|निव्वल\s*वजन|कुल\s*मात्रा|शुद्ध\s*वजन|मात्रा)[:\-\s]*([\d.]+\s*(?:ग्राम|किग्रा|कि\.?ग्रा\.?|मिली|लीटर|ली\.?|g|kg|ml|l|mg|पैक|नग|यूनिट))(?:\s|$|[,\.\n])",
        # Bengali
        r"(?:নিট\s*পরিমাণ|নিট\s*ওজন|পরিমাণ)[:\-\s]*([\d.]+\s*(?:গ্রাম|কেজি|মিলি|লিটার|g|kg|ml|l))(?:\s|$|[,\.\n])",
        # Tamil
        r"(?:நிகர\s*எடை|நிகர\s*அளவு|அளவு)[:\-\s]*([\d.]+\s*(?:கிராம்|கிலோ|மிலி|லிட்டர்|g|kg|ml|l))(?:\s|$|[,\.\n])",
        # Telugu
        r"(?:నికర\s*పరిమాణం|నికర\s*బరువు|పరిమాణం)[:\-\s]*([\d.]+\s*(?:గ్రాములు|కిలో|మిలీ|లీటర్లు|g|kg|ml|l))(?:\s|$|[,\.\n])",
        # Gujarati
        r"(?:ચોખ્ખું\s*વજન|ચોખ્ખી\s*માત્રા)[:\-\s]*([\d.]+\s*(?:ગ્રામ|કિગ્રા|મિલી|લીટર|g|kg|ml|l))(?:\s|$|[,\.\n])",
        # General Indic unit pattern
        r"([\d.]+\s*(?:ग्राम|किग्रा|कि\.?ग्रा\.?|मिली|लीटर|ली\.?|ग्रॅम))\s*(?:शुद्ध|\(पैकिंग\s*के\s*समय\))?",
    ],

    # 5. Manufacturer Name (PCR-2011-R6(1)(a))
    "manufacturer": [
        # Hindi / Marathi
        r"(?:निर्माता|उत्पादक|मैन्युफैक्चरर|द्वारा\s*निर्मित|पैककर्ता|पैकर)[:\-\s]+([^,\n।]{3,80}?)(?:[,\n।]|[1-9][0-9]{5}|$)",
        # Bengali
        r"(?:প্রস্তুতকারক|উৎপাদক|প্যাকার)[:\-\s]+([^,\n।]{3,80}?)(?:[,\n।]|[1-9][0-9]{5}|$)",
        # Tamil
        r"(?:தயாரிப்பாளர்|உற்பத்தியாளர்|பேக்கர்)[:\-\s]+([^,\n]{3,80}?)(?:[,\n]|[1-9][0-9]{5}|$)",
        # Telugu
        r"(?:తయారీదారు|ఉత్పత్తిదారు|ప్యాకర్)[:\-\s]+([^,\n]{3,80}?)(?:[,\n]|[1-9][0-9]{5}|$)",
        # Gujarati
        r"(?:ઉત્પાદક|પેકર)[:\-\s]+([^,\n]{3,80}?)(?:[,\n]|[1-9][0-9]{5}|$)",
    ],

    # 6. Manufacturer Address (PCR-2011-R6(1)(a))
    "manufacturerAddress": [
        # Match Indic premise address containing a 6-digit PIN code
        r"(?:निर्माता\s*का\s*पता|कार्यालय|पता|पत्ता|முகவரி|చిరునామా)[:\-\s]+(.+?[1-9][0-9]{5}[^\n।\.]*)",
        # Any Indic line with recognized Indian State & 6-digit PIN
        r"([^\n।]+(?:उत्तराखंड|उत्तर\s*प्रदेश|महाराष्ट्र|दिल्ली|कर्नाटक|तमिलनाडु|गुजरात|राजस्थान|हरियाणा|पंजाब|बंगाल|तेलंगाना|केरल|मध्य\s*प्रदेश|தமிழ்நாடு|ಕರ್ನಾಟಕ)[^\n।]*\b[1-9][0-9]{5}\b)",
        # Any address line containing a 6-digit PIN code in Indic/Arabic numerals
        r"([^\n।]+?\b[1-9][0-9]{5}\b)",
    ],

    # 7. Date of Manufacture / Packing (PCR-2011-R6(1)(e))
    "manufacturingDate": [
        # Hindi / Marathi
        r"(?:निर्माण\s*तिथि|उत्पादन\s*तिथि|पैकिंग\s*की\s*तारीख|पैकिंग\s*तिथि|एमएफडी|उत्पादन\s*दिनांक)[:\-\s]*((?:\d{1,2}[\/\-\.]\d{2,4}|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}))",
        # Bengali
        r"(?:উৎপাদন\s*তারিখ|প্যাকিং\s*তারিখ)[:\-\s]*((?:\d{1,2}[\/\-\.]\d{2,4}|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}))",
        # Tamil
        r"(?:தயாரிப்பு\s*தேதி|பேக்கிங்\s*தேதி)[:\-\s]*((?:\d{1,2}[\/\-\.]\d{2,4}|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}))",
        # Telugu
        r"(?:తయారీ\s*తేదీ|ప్యాకింగ్\s*తేదీ)[:\-\s]*((?:\d{1,2}[\/\-\.]\d{2,4}|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}))",
    ],

    # 8. Expiry / Best Before Date (PCR-2011-R6(1)(e))
    "expiryDate": [
        # Hindi / Marathi
        r"(?:उपयोग\s*की\s*अंतिम\s*तिथि|समाप्ति\s*तिथि|अवसान\s*तिथि|उपभोग\s*से\s*पहले|एक्सपायरी|उपयोग\s*अवधि)[:\-\s]*((?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}))",
        # Bengali
        r"(?:মেয়াদ\s*উত্তীর্ণের\s*তারিখ|মেয়াদ\s*শেষের\s*তারিখ)[:\-\s]*((?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}))",
        # Tamil
        r"(?:காலாவதி\s*தேதி|பயன்படுத்த\s*வேண்டிய\s*கடைசி\s*தேதி)[:\-\s]*((?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}))",
        # Telugu
        r"(?:గడువు\s*తేదీ|ఉపయోగించాల్సిన\s*చివరి\s*తేదీ)[:\-\s]*((?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}))",
    ],

    # 9. Country of Origin (PCR-2011-R6(1)(n))
    "countryOfOrigin": [
        r"(?:उत्पत्ति\s*का\s*देश|मूल\s*देश|में\s*निर्मित|उत्पत्ति\s*देश)[:\-\s]*(भारत|इंडिया|India|[A-Za-z\u0900-\u097F]+)",
        r"(?:ತಯಾರಾದ\s*ದೇಶ|తయారైన\s*దేశం|தயாரிக்கப்பட்ட\s*நாடு)[:\-\s]*(இந்தியா|భారతదేశం|India|[^\n,]+)",
    ],

    # 10. Consumer Care / Grievance Redressal (PCR-2011-R6(1)(f))
    "customerCare": [
        r"(?:ग्राहक\s*सेवा|उपभोक्ता\s*सेवा|ग्राहक\s*देखभाल|टोल[\-\s]?फ्री|हेल्पलाइन|शिकायत)[:\-\s]*([^\n]+)",
        r"(?:வாடிக்கையாளர்\s*சேவை|விనియోగదారుల\s*సేవ)[:\-\s]*([^\n]+)",
    ],

    # 11. Batch / Lot Number (PCR-2011-R6(1)(g))
    "batchNumber": [
        r"(?:बैच\s*संख्या|बैच\s*नं\.?|घान\s*संख्या|लॉट\s*संख्या)[:\-\s]*([A-Za-z0-9\-\/\s]+)",
        r"(?:ব্যাচ\s*নং|தொகுதி\s*எண்|బ్యాచ్\s*నంబర్)[:\-\s]*([A-Za-z0-9\-\/\s]+)",
    ],
}


class MultilingualBertNerService:
    """
    Multilingual Named Entity Recognition and Statutory Extraction Engine.
    Combines:
      1. Indic Script Token Normalization & Gazetteer (< 5ms response, zero download requirement)
      2. Asynchronous Multilingual BERT Token Classification
      3. Statutory PCR Declaration Alignment
    """

    _instance = None
    _pipeline = None
    _model_name = os.getenv("MBERT_MODEL_NAME", "Davlan/distilbert-base-multilingual-cased-ner-hrl")
    _is_loading = False
    _pipeline_ready = False

    @classmethod
    def get_instance(cls) -> "MultilingualBertNerService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self._enabled = os.getenv("ENABLE_MBERT_TRANSFORMER", "false").lower() in ("true", "1", "yes")

    def warmup(self, async_mode: bool = True):
        """Warm up the transformer model safely."""
        if not self._enabled or self._pipeline_ready or self._is_loading:
            return

        def _loader():
            self._is_loading = True
            try:
                logger.info(f"Loading Multilingual BERT NER model: {self._model_name}...")
                from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
                tokenizer = AutoTokenizer.from_pretrained(self._model_name)
                model = AutoModelForTokenClassification.from_pretrained(self._model_name)
                self._pipeline = pipeline(
                    "ner",
                    model=model,
                    tokenizer=tokenizer,
                    aggregation_strategy="simple"
                )
                self._pipeline_ready = True
                logger.info("Multilingual BERT NER pipeline is now active.")
            except Exception as e:
                logger.warning(f"Transformer model unavailable ({e}). Continuing with native Indic Linguistic NER.")
                self._pipeline_ready = False
            finally:
                self._is_loading = False

        if async_mode:
            thread = threading.Thread(target=_loader, daemon=True, name="mBERT-Loader")
            thread.start()
        else:
            _loader()

    def extract_entities_bert(self, text: str) -> List[MultilingualEntity]:
        """Runs Multilingual BERT Token Classification over input text if model is loaded."""
        if not self._pipeline_ready or not self._pipeline or not text.strip():
            return []

        try:
            chunks = [text[i:i+400] for i in range(0, min(len(text), 1200), 400)]
            all_entities: List[MultilingualEntity] = []

            for chunk in chunks:
                results = self._pipeline(chunk)
                for res in results:
                    all_entities.append(MultilingualEntity(
                        entity_group=res.get("entity_group", "MISC"),
                        word=res.get("word", "").strip(),
                        score=round(float(res.get("score", 0.0)), 3),
                        start=res.get("start", 0),
                        end=res.get("end", 0),
                    ))
            return all_entities
        except Exception as e:
            logger.error(f"Error during mBERT entity extraction: {e}")
            return []

    def extract_statutory_fields(self, raw_text: str) -> StatutoryNerResult:
        """
        Main extraction entrypoint:
          1. Detects scripts and normalizes Indic numerals (०-९ -> 0-9).
          2. Runs Multilingual Statutory PCR Patterns (Devanagari, Bengali, Tamil, Telugu, etc.).
          3. If mBERT is active, cross-references BERT entities (ORG, LOC, MISC) to enrich declarations.
        """
        if not raw_text or not raw_text.strip():
            return StatutoryNerResult()

        detected_scripts = detect_scripts(raw_text)
        normalized_text = normalize_indic_digits(raw_text)
        
        # 1. Run mBERT Token Classification if pipeline is ready
        bert_entities = self.extract_entities_bert(normalized_text)
        model_name = self._model_name if self._pipeline_ready else "indic-multilingual-ner"

        result = StatutoryNerResult(
            detected_entities=bert_entities,
            detected_scripts=detected_scripts,
            ner_model_used=model_name
        )

        extracted_fields: Dict[str, Dict[str, Any]] = {}

        # 2. Extract using Multilingual Statutory Patterns
        for field_key, patterns in MULTILINGUAL_STATUTORY_PATTERNS.items():
            for pattern in patterns:
                try:
                    match = re.search(pattern, normalized_text, re.IGNORECASE | re.MULTILINE)
                    if match:
                        groups = match.groups()
                        val = " ".join(g.strip() for g in groups if g).strip()
                        if val and len(val) >= 1:
                            conf = 0.94 if field_key in ("mrp", "netQuantity") else 0.89
                            extracted_fields[field_key] = {
                                "value": val,
                                "raw_match": match.group(0).strip(),
                                "confidence": conf,
                                "source": "multilingual_statutory_pattern",
                                "script": detected_scripts[0] if detected_scripts else "latin",
                            }
                            break
                except re.error:
                    continue

        # 3. Cross-reference mBERT Entities to enrich and validate extracted fields
        for ent in bert_entities:
            # ORG -> Manufacturer Candidate
            if ent.entity_group == "ORG" and ent.score > 0.70:
                if "manufacturer" not in extracted_fields:
                    comp_name = ent.word.strip()
                    if len(comp_name) >= 3:
                        extracted_fields["manufacturer"] = {
                            "value": comp_name,
                            "raw_match": ent.word,
                            "confidence": round(ent.score, 2),
                            "source": "multilingual_bert_org",
                            "script": detected_scripts[0] if detected_scripts else "latin",
                        }

            # LOC -> Manufacturer Address / Country Candidate
            elif ent.entity_group == "LOC" and ent.score > 0.70:
                loc_name = ent.word.strip()
                if "countryOfOrigin" not in extracted_fields and loc_name.lower() in ("india", "भारत", "bharat", "germany", "china", "usa"):
                    extracted_fields["countryOfOrigin"] = {
                        "value": "India" if loc_name.lower() in ("india", "भारत", "bharat") else loc_name,
                        "raw_match": ent.word,
                        "confidence": round(ent.score, 2),
                        "source": "multilingual_bert_loc",
                        "script": detected_scripts[0] if detected_scripts else "latin",
                    }

            # MISC -> Product Name Candidate
            elif ent.entity_group == "MISC" and ent.score > 0.75:
                if "productName" not in extracted_fields:
                    extracted_fields["productName"] = {
                        "value": ent.word.strip(),
                        "raw_match": ent.word,
                        "confidence": round(ent.score, 2),
                        "source": "multilingual_bert_misc",
                        "script": detected_scripts[0] if detected_scripts else "latin",
                    }

        result.fields = extracted_fields
        return result


# Global singleton instance
multilingual_ner_service = MultilingualBertNerService.get_instance()
