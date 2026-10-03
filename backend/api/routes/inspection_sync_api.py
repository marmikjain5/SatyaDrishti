"""Idempotent sync endpoint for inspections captured offline in the browser."""

import hashlib
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

_backend_dir = Path(__file__).resolve().parents[2]
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from database import get_db
from models.db_models import OfflineInspectionModel

router = APIRouter(prefix="/api/inspections", tags=["offline inspections"])


class EvidenceImageSchema(BaseModel):
    name: str = Field(min_length=1, max_length=512)
    mimeType: str = Field(min_length=1, max_length=128)
    dataUrl: str = Field(min_length=1, max_length=30_000_000)

    @field_validator("dataUrl")
    @classmethod
    def validate_image_data_url(cls, value: str) -> str:
        if not value.startswith("data:image/") or ";base64," not in value:
            raise ValueError("Evidence must be a base64 image data URL.")
        return value


class OfflineInspectionSchema(BaseModel):
    id: str = Field(min_length=1, max_length=128)
    clientCreatedAt: str = Field(min_length=1, max_length=64)
    scan: Dict[str, Any]
    analysis: Dict[str, Any]
    evidenceImages: List[EvidenceImageSchema] = Field(default_factory=list)

    @field_validator("scan")
    @classmethod
    def validate_scan_id(cls, value: Dict[str, Any], info) -> Dict[str, Any]:
        inspection_id = info.data.get("id")
        if inspection_id and value.get("id") != inspection_id:
            raise ValueError("Inspection ID must match the scan ID.")
        if value.get("status") != "completed":
            raise ValueError("Only completed inspections can be synced.")
        return value


class InspectionSyncRequest(BaseModel):
    inspections: List[OfflineInspectionSchema] = Field(min_length=1, max_length=25)

    @model_validator(mode="after")
    def validate_request_size(self):
        total_evidence_size = sum(
            len(image.dataUrl)
            for inspection in self.inspections
            for image in inspection.evidenceImages
        )
        if total_evidence_size > 32_000_000:
            raise ValueError("Evidence images exceed the 32 MB sync request limit.")
        return self


def digest_inspection(inspection: OfflineInspectionSchema) -> str:
    canonical_payload = inspection.model_dump(mode="json")
    serialized = json.dumps(canonical_payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def sync_result(inspection_id: str, status: str, message: str | None = None) -> Dict[str, str]:
    result = {"id": inspection_id, "status": status}
    if message:
        result["message"] = message
    return result


@router.post("/sync")
def sync_offline_inspections(
    request: InspectionSyncRequest,
    db: Session = Depends(get_db),
):
    """Persist offline scans and evidence; repeated identical IDs are safe to retry."""
    results = []
    for inspection in request.inspections:
        digest = digest_inspection(inspection)
        existing = db.query(OfflineInspectionModel).filter(
            OfflineInspectionModel.id == inspection.id
        ).first()

        if existing:
            if existing.payload_digest == digest:
                results.append(sync_result(inspection.id, "already_synced"))
            else:
                results.append(sync_result(
                    inspection.id,
                    "conflict",
                    "The server already has different inspection data with this ID. Save the local copy as a new inspection to preserve both records.",
                ))
            continue

        record = OfflineInspectionModel(
            id=inspection.id,
            payload_digest=digest,
            scan_payload=inspection.scan,
            analysis_payload=inspection.analysis,
            evidence_images=[image.model_dump() for image in inspection.evidenceImages],
            client_created_at=inspection.clientCreatedAt,
        )
        db.add(record)
        try:
            db.commit()
            results.append(sync_result(inspection.id, "synced"))
        except IntegrityError:
            db.rollback()
            existing = db.query(OfflineInspectionModel).filter(
                OfflineInspectionModel.id == inspection.id
            ).first()
            if existing and existing.payload_digest == digest:
                results.append(sync_result(inspection.id, "already_synced"))
            elif existing:
                results.append(sync_result(
                    inspection.id,
                    "conflict",
                    "A different inspection was synced with this ID at the same time. Save the local copy as a new inspection to preserve both records.",
                ))
            else:
                raise HTTPException(status_code=500, detail="Could not persist the offline inspection.")
        except Exception as error:
            db.rollback()
            raise HTTPException(status_code=500, detail="Could not persist the offline inspection.") from error

    return {"results": results}
