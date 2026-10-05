"""
SatyaDrishti Email API Routes
FastAPI controller endpoints for dispatching statutory SCN notices and inspection directives via backend Email Service.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.email_service import send_scn_notice_email, send_surprise_inspection_email

router = APIRouter(prefix="/api/email", tags=["Email Dispatch"])


class SCNEmailSchema(BaseModel):
    noticeReference: str
    caseNumber: str
    manufacturer: str
    productName: str
    brand: str
    platform: str
    actName: str
    section: str
    description: str
    extractedValue: str
    expectedStandard: str
    penaltyEstimate: float = Field(default=0.0)
    assignedOfficer: str
    recipientEmail: Optional[str] = None


class SurpriseInspectionEmailSchema(BaseModel):
    factoryId: str
    factoryName: str
    registrationNumber: str
    location: str
    city: str
    state: str
    category: str
    overallScore: float = Field(default=100.0)
    complianceStatus: str
    activeAlerts: int = Field(default=0)
    openViolationsCount: int = Field(default=0)
    assignedOfficer: str
    officerEmail: Optional[str] = None
    priority: Optional[str] = None
    directiveNotes: Optional[str] = None


class EmailResponseSchema(BaseModel):
    success: bool
    recipient: str
    mode: str
    messageId: Optional[str] = None
    error: Optional[str] = None


@router.post("/send-scn", response_model=EmailResponseSchema)
def dispatch_scn_notice(payload: SCNEmailSchema):
    """
    Endpoint to dispatch Show Cause Notice email safely from backend.
    """
    try:
        result = send_scn_notice_email(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dispatch SCN notice: {str(e)}")


@router.post("/send-inspection", response_model=EmailResponseSchema)
def dispatch_surprise_inspection(payload: SurpriseInspectionEmailSchema):
    """
    Endpoint to dispatch Surprise Inspection Order email safely from backend.
    """
    try:
        result = send_surprise_inspection_email(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dispatch surprise inspection: {str(e)}")
