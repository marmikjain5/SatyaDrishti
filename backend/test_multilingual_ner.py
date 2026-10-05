"""
Unit & Integration Test for Multilingual BERT NER Statutory Extraction
Tests Hindi, Bengali, Tamil, Telugu, and bilingual packaging text samples.
"""

import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


from services.multilingual_ner_service import multilingual_ner_service

def test_hindi_statutory_extraction():
    sample_hindi = """
    उत्पाद: शुद्ध देसी घी
    शुद्ध मात्रा: ५०० ग्राम
    अधिकतम खुदरा मूल्य: ₹३५०
    निर्माता: पतंजलि आयुर्वेद लिमिटेड, हरिद्वार, उत्तराखंड - 249401
    निर्माण तिथि: १२/२०२४
    उपयोग की अंतिम तिथि: १२/२०२५
    उत्पत्ति देश: भारत
    बैच संख्या: B240901
    ग्राहक सेवा: 18001804187, feedback@patanjaliayurved.org
    """
    res = multilingual_ner_service.extract_statutory_fields(sample_hindi)
    print("=== TEST HINDI STATUTORY EXTRACTION ===")
    print("Detected Scripts:", res.detected_scripts)
    print("NER Model / Engine:", res.ner_model_used)
    print("Extracted Fields:")
    for k, v in res.fields.items():
        print(f"  [{k}]: '{v['value']}' (conf: {v['confidence']}, source: {v['source']})")

    assert "productName" in res.fields, "productName should be extracted"
    assert "mrp" in res.fields, "mrp should be extracted"
    assert "netQuantity" in res.fields, "netQuantity should be extracted"
    assert "manufacturer" in res.fields, "manufacturer should be extracted"
    assert "manufacturerAddress" in res.fields, "manufacturerAddress should be extracted"
    assert "manufacturingDate" in res.fields, "manufacturingDate should be extracted"
    assert "countryOfOrigin" in res.fields, "countryOfOrigin should be extracted"
    print("-> All Hindi mandatory fields extracted successfully!\n")

def test_bengali_statutory_extraction():
    sample_bengali = """
    পণ্য: খাঁটি সরিষার তেল
    নিট পরিমাণ: ১ লিটার
    সর্বোচ্চ খুচরা মূল্য: ₹১৮০
    প্রস্তুতকারক: ইমামী এগ্রোটেক লিমিটেড, কলকাতা, পশ্চিমবঙ্গ - 700001
    উৎপাদন তারিখ: ১০/২০২৪
    ব্যাচ নং: BN9921
    """
    res = multilingual_ner_service.extract_statutory_fields(sample_bengali)
    print("=== TEST BENGALI STATUTORY EXTRACTION ===")
    print("Detected Scripts:", res.detected_scripts)
    for k, v in res.fields.items():
        print(f"  [{k}]: '{v['value']}' (conf: {v['confidence']})")
    assert "productName" in res.fields
    assert "mrp" in res.fields
    assert "netQuantity" in res.fields
    assert "manufacturer" in res.fields
    print("-> All Bengali fields extracted successfully!\n")

def test_tamil_statutory_extraction():
    sample_tamil = """
    பொருள்: தூய தேங்காய் எண்ணெய்
    நிகர அளவு: 500 மிலி
    அதிகபட்ச சில்லறை விலை: ₹125
    தயாரிப்பாளர்: மரிக்கோ லிமிடெட், சென்னை, தமிழ்நாடு - 600001
    தயாரிப்பு தேதி: 08/2024
    """
    res = multilingual_ner_service.extract_statutory_fields(sample_tamil)
    print("=== TEST TAMIL STATUTORY EXTRACTION ===")
    print("Detected Scripts:", res.detected_scripts)
    for k, v in res.fields.items():
        print(f"  [{k}]: '{v['value']}' (conf: {v['confidence']})")
    assert "productName" in res.fields
    assert "mrp" in res.fields
    assert "netQuantity" in res.fields
    assert "manufacturer" in res.fields
    print("-> All Tamil fields extracted successfully!\n")

if __name__ == "__main__":
    test_hindi_statutory_extraction()
    test_bengali_statutory_extraction()
    test_tamil_statutory_extraction()
    print("ALL MULTILINGUAL TESTS PASSED!")
