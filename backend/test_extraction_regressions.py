"""Regression coverage for the local OCR/text extraction boundary."""

import os

os.environ.setdefault("POLLINATIONS_ENABLED", "false")

from backend.services.extraction_service import extract_from_text
from backend.services.vision_service import HybridVisionService


ATTACHED_LABEL_OCR = """
NIVEA Natural Glow Cell Repair SPF 15 Lotion
Marketed by: NIVEA India Pvt. Ltd.
4th Floor, AGH, Phoenix Market City, Kurla (W), Mumbai, Maharashtra 400070
Query/Feedback: Contact NIVEA CARE Executive at above address
(022) 62487999 care@beiersdorfcom
Net Content (when packed): 400ml
MRP (Incl. 550 of all taxes), USP, 1.38/ml
Batch No., 342133650 04
MFD. (M) & 05/24
UseBefore(U): 10/26
"""


def test_attached_label_priority_declarations():
    result = extract_from_text(ATTACHED_LABEL_OCR, image_id="attached-label")

    assert result.fields["mrp"].value == "550"
    assert result.fields["unitSalePrice"].value == "1.38/ml"
    assert result.fields["batchNumber"].value == "B42133650 04"
    assert result.fields["manufacturingDate"].value == "05/24"
    assert result.fields["expiryDate"].value == "10/26"
    assert result.fields["netQuantity"].value == "400 ml"
    assert "NIVEA Natural Glow Cell Repair SPF 15 Lotion" in result.fields["productName"].value
    assert result.fields["customerCare"].value == "(022) 62487999 | care@beiersdorf.com"
    assert result.fields["address"].value.endswith("400070")


def test_image_provider_boundary_is_ocr_only():
    result = HybridVisionService().extract_from_image(object())

    assert result["status"] == "ocr_only"
    assert result["fields"] == {}
    assert "local" in result["message"]
