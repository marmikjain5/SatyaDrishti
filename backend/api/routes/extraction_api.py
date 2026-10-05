"""
SatyaDrishti Extraction & Validation API Routes
FastAPI endpoints exposing the production-grade extraction and validation pipeline.

Endpoints:
  POST /api/v1/extract   — Extract statutory fields from raw OCR text
  POST /api/v1/validate  — Run deterministic statutory validation on extracted fields
  GET  /api/v1/rules     — Fetch all active gazette-verified statutory rules from PostgreSQL
"""

import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime

# Ensure backend directory is in sys.path for robust imports
_file_path = Path(__file__).resolve()
_backend_dir = _file_path.parents[2]
for _p in (str(_backend_dir), str(_backend_dir.parent)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.services.extraction_service import (
        extract_from_text,
        extract_from_image_hybrid,
        aggregate_multi_angle_extractions,
        get_extraction_summary,
        ExtractionResult,
    )
    from backend.services.validation_service import (
        validate_product_compliance,
        StatutoryAuditReport,
        ViolationSeverity,
    )
    from backend.services.opencv_service import preprocess_packaging_for_ocr, detect_reference_object
    from backend.database import SessionLocal
    from backend.models.db_models import RegulatoryRuleModel
except ImportError:
    from services.extraction_service import (
        extract_from_text,
        extract_from_image_hybrid,
        aggregate_multi_angle_extractions,
        get_extraction_summary,
        ExtractionResult,
    )
    from services.validation_service import validate_product_compliance, StatutoryAuditReport, ViolationSeverity
    from services.opencv_service import preprocess_packaging_for_ocr, detect_reference_object
    from database import SessionLocal
    from models.db_models import RegulatoryRuleModel



# ─── Helper: Extraction Result Serializer ──────────────────────────────────

def _serialize_extraction_result(result: ExtractionResult) -> Dict[str, Any]:
    """Converts an ExtractionResult to a JSON-serializable dict."""
    return {
        "image_id": result.image_id,
        "raw_text": result.raw_text,
        "cleaned_text": result.cleaned_text,
        "extraction_engine": result.extraction_engine,
        "overall_confidence_pct": round(result.overall_confidence * 100, 1),
        "preprocessing_passes": result.preprocessing_passes,
        "errors": result.errors,
        "fields": {
            key: {
                "key": f.key,
                "value": f.value,
                "raw_match": f.raw_match,
                "confidence_pct": round(f.confidence * 100, 1),
                "is_mandatory": f.is_mandatory,
                "validation_status": f.validation_status,
            }
            for key, f in result.fields.items()
        },
        "summary": get_extraction_summary(result),
    }


# ─── Helper: Audit Report Serializer ───────────────────────────────────────

def _serialize_audit_report(report: StatutoryAuditReport) -> Dict[str, Any]:
    """Converts a StatutoryAuditReport to a JSON-serializable dict."""
    return {
        "scan_id": report.scan_id,
        "evaluation_date": report.evaluation_date,
        "product_category": report.product_category,
        "overall_status": report.overall_status,
        "compliance_score": report.compliance_score,
        "violation_count": report.violation_count,
        "warning_count": report.warning_count,
        "pass_count": report.pass_count,
        "total_estimated_penalty_inr": report.total_estimated_penalty_inr,
        "missing_declarations": report.missing_declarations,
        "auto_notice_required": report.auto_notice_required,
        # LLM augmentation metadata
        "llm_provider": report.llm_provider,
        "llm_augmentation_error": report.llm_augmentation_error,
        "findings": [
            {
                "rule_id": f.rule_id,
                "rule_code": f.rule_code,
                "section_clause": f.section_clause,
                "act_name": f.act_name,
                "target_field": f.target_field,
                "title": f.title,
                "status": f.status,
                "severity": f.severity.value if hasattr(f.severity, 'value') else f.severity,
                "evidence": f.evidence,
                "expected_standard": f.expected_standard,
                "recommendation": f.recommendation,
                "min_fine_inr": f.min_fine_inr,
                "max_fine_inr": f.max_fine_inr,
                "imprisonment_months": f.imprisonment_months,
                "estimated_penalty_inr": f.estimated_penalty_inr,
                # LLM augmentation per-finding
                "llm_verdict": f.llm_verdict,
                "llm_reasoning": f.llm_reasoning,
                "llm_severity_override": f.llm_severity_override,
                "llm_recommendation": f.llm_recommendation,
            }
            for f in report.findings
        ],
    }


# ─── API Handler Class & APIRouter ──────────────────────────────────────────

from fastapi import APIRouter, Body, Query

router = APIRouter(prefix="/api/v1", tags=["extraction-validation"])

class ExtractionAPIHandler:
    """
    Handler for /api/v1 extraction, validation, and rules endpoints.
    Designed to be integrated into FastAPI/Starlette router.
    """

    def handle_extract(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        POST /api/v1/extract

        Extracts all statutory declaration fields from raw OCR text.
        """
        raw_text = payload.get("raw_text", "")
        if not raw_text or not raw_text.strip():
            return {
                "error": "raw_text is required and must not be empty.",
                "status": 400,
            }

        image_id = payload.get("image_id", f"img-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        preprocessing_passes = payload.get("preprocessing_passes", ["raw_pass"])

        result = extract_from_text(
            raw_text=raw_text,
            image_id=image_id,
            preprocessing_passes=preprocessing_passes,
        )

        return {
            "status": "success",
            "extraction": _serialize_extraction_result(result),
        }

    def handle_validate(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        POST /api/v1/validate

        Runs deterministic statutory validation against all gazette-verified rules,
        optionally followed by an LLM verification pass on fail/warning findings.
        """
        extracted_fields = payload.get("extracted_fields")
        if not extracted_fields or not isinstance(extracted_fields, dict):
            return {
                "error": "extracted_fields is required and must be a dictionary of field key -> value.",
                "status": 400,
            }

        scan_id = payload.get("scan_id", f"scan-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        product_category = payload.get("product_category", "ALL").upper()
        is_repeat_offender = bool(payload.get("is_repeat_offender", False))
        evaluation_date = payload.get("evaluation_date")
        use_llm = bool(payload.get("use_llm", True))  # default on

        report = validate_product_compliance(
            extracted_fields=extracted_fields,
            scan_id=scan_id,
            product_category=product_category,
            is_repeat_offender=is_repeat_offender,
            evaluation_date=evaluation_date,
            use_llm=use_llm,
        )

        return {
            "status": "success",
            "audit_report": _serialize_audit_report(report),
        }

    def handle_extract_and_validate(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        POST /api/v1/extract-and-validate

        Convenience endpoint: runs extraction + validation in one call.
        Supports both image inputs (image_base64 / image_path) and raw_text.
        """
        if payload.get("image_base64") or payload.get("image_path"):
            extraction_response = self.handle_extract_image(payload)
        else:
            extract_payload = {
                "raw_text": payload.get("raw_text", ""),
                "image_id": payload.get("image_id"),
                "preprocessing_passes": payload.get("preprocessing_passes", ["raw_pass"]),
            }
            extraction_response = self.handle_extract(extract_payload)

        if "error" in extraction_response or extraction_response.get("status") != "success":
            return extraction_response

        extraction = extraction_response["extraction"]
        extracted_fields = {
            key: field_data["value"]
            for key, field_data in extraction["fields"].items()
        }
        extracted_fields["rawText"] = extraction.get("raw_text", "")

        validate_payload = {
            "extracted_fields": extracted_fields,
            "scan_id": payload.get("image_id", ""),
            "product_category": payload.get("product_category", "ALL"),
            "is_repeat_offender": payload.get("is_repeat_offender", False),
            "evaluation_date": payload.get("evaluation_date"),
            "use_llm": payload.get("use_llm", True),
        }
        validation_response = self.handle_validate(validate_payload)

        return {
            "status": "success",
            "extraction": extraction,
            "audit_report": validation_response.get("audit_report", {}),
        }

    def handle_get_rules(
        self,
        category: Optional[str] = None,
        active_only: bool = True,
        severity: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        GET /api/v1/rules

        Fetches gazette-verified statutory rules from the PostgreSQL regulatory_rules table.
        """
        try:
            db = SessionLocal()
            query = db.query(RegulatoryRuleModel)

            if active_only:
                query = query.filter(RegulatoryRuleModel.is_active == True)

            if category and category.upper() not in ("ALL", ""):
                query = query.filter(
                    (RegulatoryRuleModel.category_scope == category.upper()) |
                    (RegulatoryRuleModel.category_scope == "ALL")
                )

            if severity:
                query = query.filter(RegulatoryRuleModel.severity == severity.upper())

            rules = query.order_by(RegulatoryRuleModel.severity, RegulatoryRuleModel.rule_code).all()

            return {
                "status": "success",
                "total_rules": len(rules),
                "filters_applied": {
                    "category": category,
                    "active_only": active_only,
                    "severity": severity,
                },
                "rules": [
                    {
                        "id": r.id,
                        "rule_code": r.rule_code,
                        "act_name": r.act_name,
                        "section_clause": r.section_clause,
                        "target_field": r.target_field,
                        "title": r.title,
                        "description": r.description,
                        "category_scope": r.category_scope,
                        "validation_spec": r.validation_spec,
                        "severity": r.severity,
                        "is_mandatory": r.is_mandatory,
                        "is_conditional": r.is_conditional,
                        "condition_description": r.condition_description,
                        "min_fine_inr": r.min_fine_inr,
                        "max_fine_inr": r.max_fine_inr,
                        "imprisonment_months": r.imprisonment_months,
                        "gazette_notification_no": r.gazette_notification_no,
                        "gazette_date": r.gazette_date,
                        "effective_from": r.effective_from,
                        "effective_to": r.effective_to,
                        "is_active": r.is_active,
                    }
                    for r in rules
                ],
            }
        except Exception as e:
            return {"error": str(e), "status": 500}
        finally:
            try:
                db.close()
            except Exception:
                pass


    def handle_preprocess_image(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        POST /api/v1/preprocess-image

        Executes full OpenCV optical packaging enhancement prior to OCR:
        - Package/Label detection & background removal cropping
        - 4-point homographic perspective transformation (angled to flat rectangle)
        - Optical rotational deskewing
        - CLAHE contrast normalization (glare and shadow removal)
        - Small-text super-resolution upscaling (2x bicubic)
        - Bilateral denoising and unsharp stroke sharpening
        """
        image_data = payload.get("image_base64") or payload.get("image_path")
        if not image_data:
            return {
                "error": "image_base64 or image_path is required.",
                "status": 400,
            }

        result = preprocess_packaging_for_ocr(image_data)
        return result

    def handle_extract_image(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        POST /api/v1/extract-image

        Extracts statutory fields from a base64-encoded image or image file path using
        the OpenCV Optical Enhancement -> Hybrid Vision / OCR -> LLM mapping pipeline.
        """
        image_data = payload.get("image_base64") or payload.get("image_path")
        if not image_data:
            return {
                "error": "image_base64 or image_path is required.",
                "status": 400,
            }

        image_id = payload.get("image_id", f"img-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        fallback_raw_text = payload.get("raw_text")

        # Decode base64 bytes if passed as raw base64 string
        if payload.get("image_base64"):
            try:
                # Remove potential data:image/...;base64, header
                b64_str = payload["image_base64"]
                if "," in b64_str:
                    b64_str = b64_str.split(",", 1)[1]
                import base64
                image_input = base64.b64decode(b64_str)
            except Exception as e:
                return {"error": f"Invalid base64 image data: {e}", "status": 400}
        else:
            image_input = payload["image_path"]

        # Run OpenCV optical enhancement before downstream extraction
        cv_telemetry = []
        try:
            cv_res = preprocess_packaging_for_ocr(image_input)
            if cv_res.get("status") == "success":
                cv_telemetry = cv_res.get("operations_applied", [])
                if cv_res.get("processed_image_base64"):
                    image_input = cv_res["processed_image_base64"]
        except Exception as cv_err:
            print(f"[OpenCV Preprocessor] Optical step skipped: {cv_err}")

        result = extract_from_image_hybrid(
            image_input=image_input,
            image_id=image_id,
            fallback_raw_text=fallback_raw_text,
        )

        serialized = _serialize_extraction_result(result)
        serialized["opencv_enhancements"] = cv_telemetry
        serialized["mrp_sticker_signal"] = cv_res.get("mrp_sticker_signal") if 'cv_res' in locals() else None
        serialized["package_bounds"] = cv_res.get("package_bounds") if 'cv_res' in locals() else None
        return {
            "status": "success",
            "extraction": serialized,
        }

    def handle_extract_multi_angle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        POST /api/v1/extract-multi-angle

        Processes multiple angle views/crops of a product and compiles a consolidated master declaration profile.
        """
        angles = payload.get("angles", [])
        if not angles or not isinstance(angles, list):
            return {
                "error": "angles is required and must be a list of image objects (each having image_base64 or image_path or raw_text).",
                "status": 400,
            }

        product_id = payload.get("product_id", f"prod-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        extractions = []

        for idx, angle_obj in enumerate(angles, 1):
            angle_id = angle_obj.get("angle_id", f"{product_id}-angle-{idx}")
            if angle_obj.get("image_base64") or angle_obj.get("image_path"):
                angle_res = self.handle_extract_image({**angle_obj, "image_id": angle_id})
                # Reconstruct ExtractionResult object for aggregation
                if angle_res.get("status") == "success":
                    ext_data = angle_res["extraction"]
                    from backend.services.extraction_service import ExtractedField, ExtractionResult
                    res_obj = ExtractionResult(
                        image_id=angle_id,
                        raw_text=angle_obj.get("raw_text", ""),
                        cleaned_text="",
                        extraction_engine=ext_data.get("extraction_engine", "Vision-LLM")
                    )
                    for fk, fv in ext_data.get("fields", {}).items():
                        res_obj.fields[fk] = ExtractedField(
                            key=fk,
                            value=fv.get("value", ""),
                            raw_match=fv.get("raw_match", ""),
                            confidence=fv.get("confidence_pct", 0) / 100.0,
                            regex_pattern="vision",
                            is_mandatory=fv.get("is_mandatory", False),
                            validation_status=fv.get("validation_status", "missing")
                        )
                    extractions.append(res_obj)
            elif angle_obj.get("raw_text"):
                res_obj = extract_from_text(angle_obj["raw_text"], image_id=angle_id)
                extractions.append(res_obj)

        if not extractions:
            return {"error": "No valid angle extractions were completed.", "status": 400}

        master_extraction = aggregate_multi_angle_extractions(extractions, master_id=product_id)
        serialized_extraction = _serialize_extraction_result(master_extraction)

        # Optional immediate statutory validation
        audit_report = None
        if payload.get("validate", True):
            extracted_fields = {
                k: f["value"] for k, f in serialized_extraction["fields"].items()
            }
            val_payload = {
                "extracted_fields": extracted_fields,
                "scan_id": product_id,
                "product_category": payload.get("product_category", "ALL"),
                "is_repeat_offender": payload.get("is_repeat_offender", False),
                "use_llm": payload.get("use_llm", True),
            }
            val_resp = self.handle_validate(val_payload)
            audit_report = val_resp.get("audit_report")

        return {
            "status": "success",
            "angles_processed": len(extractions),
            "master_extraction": serialized_extraction,
            "audit_report": audit_report,
        }


# ─── FastAPI Router Endpoints ───────────────────────────────────────────────

_handler = ExtractionAPIHandler()

@router.post("/preprocess-image")
@router.post("/opencv-preprocess")
def preprocess_image_endpoint(payload: Dict[str, Any] = Body(...)):
    """Run OpenCV packaging optical preprocessing (crop, perspective warp, deskew, upscale, CLAHE)."""
    return _handler.handle_preprocess_image(payload)

@router.post("/detect-reference-object")
def detect_reference_object_endpoint(payload: Dict[str, Any] = Body(...)):
    """Detect a selected coin or ID-card candidate for scale calibration."""
    image_data = payload.get("image_base64") or payload.get("image_path")
    reference_type = payload.get("reference_type", "")
    if not image_data or reference_type not in {"coin_5", "coin_10", "id_card"}:
        return {"status": "error", "message": "image_base64/image_path and a supported reference_type are required."}
    return detect_reference_object(image_data, reference_type)

@router.post("/extract")
def extract_endpoint(payload: Dict[str, Any] = Body(...)):
    """Extract statutory fields from raw OCR text."""
    return _handler.handle_extract(payload)

@router.post("/extract-image")
def extract_image_endpoint(payload: Dict[str, Any] = Body(...)):
    """Extract statutory fields directly from packaging image using Hybrid Vision LLM."""
    return _handler.handle_extract_image(payload)

@router.post("/extract-multi-angle")
def extract_multi_angle_endpoint(payload: Dict[str, Any] = Body(...)):
    """Process multiple product angles and aggregate master statutory declarations."""
    return _handler.handle_extract_multi_angle(payload)

@router.post("/validate")
def validate_endpoint(payload: Dict[str, Any] = Body(...)):
    """Validate extracted fields against gazette statutory rules."""
    return _handler.handle_validate(payload)

@router.post("/extract-and-validate")
def extract_and_validate_endpoint(payload: Dict[str, Any] = Body(...)):
    """Run full extraction + validation pipeline."""
    return _handler.handle_extract_and_validate(payload)

@router.get("/rules")
def get_rules_endpoint(
    category: Optional[str] = Query(None),
    active_only: bool = Query(True),
    severity: Optional[str] = Query(None),
):
    """Fetch gazette-verified statutory rules from database."""
    return _handler.handle_get_rules(category=category, active_only=active_only, severity=severity)


