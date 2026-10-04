"""
SatyaDrishti Database REST API Routes
Provides full CRUD endpoints for Products, OCR Scans, Violations, Manufacturers, Complaints, and Regulatory Rules.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parents[2]
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from database import get_db
from models.db_models import (
    ProductModel,
    ManufacturerModel,
    OCRScanModel,
    ViolationModel,
    ComplaintModel,
    RegulatoryRuleModel,
)

router = APIRouter(prefix="/api", tags=["database"])


# ============================================================================
# 0. DATABASE OVERVIEW & STATS
# ============================================================================
@router.get("/stats")
def get_database_stats(db: Session = Depends(get_db)):
    """Return live table row counts and health info."""
    return {
        "status": "online",
        "counts": {
            "products": db.query(ProductModel).count(),
            "manufacturers": db.query(ManufacturerModel).count(),
            "ocr_scans": db.query(OCRScanModel).count(),
            "violations": db.query(ViolationModel).count(),
            "complaints": db.query(ComplaintModel).count(),
            "regulatory_rules": db.query(RegulatoryRuleModel).count(),
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


# ============================================================================
# 1. PRODUCTS ENDPOINTS
# ============================================================================
class ProductCreateSchema(BaseModel):
    id: Optional[str] = None
    sku: Optional[str] = None
    title: str
    brand: str
    category: str = "General"
    manufacturer_id: Optional[str] = None
    manufacturer_name: str = "Unknown"
    country_of_origin: str = "India"
    mrp: float = 0.0
    listed_price: float = 0.0
    net_weight: str = "N/A"
    platform: str = "Direct"
    product_url: Optional[str] = None
    image_url: Optional[str] = None
    status: str = "compliant"
    compliance_score: int = 100
    ocr_confidence: float = 95.0
    ingredients_list: List[str] = Field(default_factory=list)
    nutritional_info: Dict[str, Any] = Field(default_factory=dict)
    customer_care_contact: Optional[str] = None
    dietary_type: str = "Vegetarian"
    missing_mandatory_fields: List[str] = Field(default_factory=list)
    regulatory_acts: List[str] = Field(default_factory=list)
    last_scanned: Optional[str] = None


@router.get("/products")
def get_products(
    platform: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Retrieve all products with optional filtering."""
    query = db.query(ProductModel)
    if platform and platform != "All":
        query = query.filter(ProductModel.platform == platform)
    if status and status != "All":
        query = query.filter(ProductModel.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (ProductModel.title.ilike(s))
            | (ProductModel.brand.ilike(s))
            | (ProductModel.sku.ilike(s))
            | (ProductModel.manufacturer_name.ilike(s))
        )
    return query.order_by(ProductModel.created_at.desc()).limit(limit).all()


@router.get("/products/{product_id}")
def get_product_by_id(product_id: str, db: Session = Depends(get_db)):
    """Retrieve a single product by ID."""
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/products", status_code=201)
def create_product(product_in: ProductCreateSchema, db: Session = Depends(get_db)):
    """Create a new product directly from website action."""
    prod_id = product_in.id or f"prod-{uuid.uuid4().hex[:8]}"
    sku = product_in.sku or f"SKU-{uuid.uuid4().hex[:6].upper()}"

    # Check if SKU already exists
    existing = db.query(ProductModel).filter((ProductModel.id == prod_id) | (ProductModel.sku == sku)).first()
    if existing:
        prod_id = f"prod-{uuid.uuid4().hex[:8]}"
        sku = f"SKU-{uuid.uuid4().hex[:6].upper()}"

    product = ProductModel(
        id=prod_id,
        sku=sku,
        title=product_in.title,
        brand=product_in.brand,
        category=product_in.category,
        manufacturer_id=product_in.manufacturer_id,
        manufacturer_name=product_in.manufacturer_name,
        country_of_origin=product_in.country_of_origin,
        mrp=product_in.mrp,
        listed_price=product_in.listed_price,
        net_weight=product_in.net_weight,
        platform=product_in.platform,
        product_url=product_in.product_url,
        image_url=product_in.image_url,
        status=product_in.status,
        compliance_score=product_in.compliance_score,
        ocr_confidence=product_in.ocr_confidence,
        ingredients_list=product_in.ingredients_list,
        nutritional_info=product_in.nutritional_info,
        customer_care_contact=product_in.customer_care_contact,
        dietary_type=product_in.dietary_type,
        missing_mandatory_fields=product_in.missing_mandatory_fields,
        regulatory_acts=product_in.regulatory_acts,
        last_scanned=product_in.last_scanned or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    """Delete a product by ID."""
    prod = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(prod)
    db.commit()
    return {"status": "deleted", "id": product_id}


# ============================================================================
# 2. MANUFACTURERS ENDPOINTS
# ============================================================================
class ManufacturerCreateSchema(BaseModel):
    id: Optional[str] = None
    name: str
    cin: Optional[str] = None
    gstin: Optional[str] = None
    registered_address: Optional[str] = None
    risk_tier: str = "Moderate"
    risk_score: int = 50
    repeat_offender_flag: bool = False
    total_products_scanned: int = 0
    active_violations: int = 0
    notices_issued: int = 0
    brands: List[str] = Field(default_factory=list)
    top_offense_types: List[str] = Field(default_factory=list)
    last_audit_date: Optional[str] = None


@router.get("/manufacturers")
def get_manufacturers(
    risk_tier: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Retrieve all manufacturers with risk tiers."""
    query = db.query(ManufacturerModel)
    if risk_tier and risk_tier != "All":
        query = query.filter(ManufacturerModel.risk_tier == risk_tier)
    return query.all()


@router.post("/manufacturers", status_code=201)
def create_manufacturer(mfg_in: ManufacturerCreateSchema, db: Session = Depends(get_db)):
    """Add a new manufacturer entity."""
    m_id = mfg_in.id or f"mfg-{uuid.uuid4().hex[:8]}"
    cin = mfg_in.cin or f"U{uuid.uuid4().hex[:12].upper()}"
    gstin = mfg_in.gstin or f"GST{uuid.uuid4().hex[:10].upper()}"

    mfg = ManufacturerModel(
        id=m_id,
        name=mfg_in.name,
        cin=cin,
        gstin=gstin,
        registered_address=mfg_in.registered_address,
        risk_tier=mfg_in.risk_tier,
        risk_score=mfg_in.risk_score,
        repeat_offender_flag=mfg_in.repeat_offender_flag,
        total_products_scanned=mfg_in.total_products_scanned,
        active_violations=mfg_in.active_violations,
        notices_issued=mfg_in.notices_issued,
        brands=mfg_in.brands,
        top_offense_types=mfg_in.top_offense_types,
        last_audit_date=mfg_in.last_audit_date or datetime.utcnow().strftime("%Y-%m-%d"),
    )
    db.add(mfg)
    db.commit()
    db.refresh(mfg)
    return mfg


# ============================================================================
# 3. OCR SCANS ENDPOINTS
# ============================================================================
class OCRScanCreateSchema(BaseModel):
    id: Optional[str] = None
    product_id: Optional[str] = None
    image_url: str = ""
    raw_extracted_text: str = ""
    cleaned_text: Optional[str] = None
    ocr_engine: str = "Tesseract.js v5 / Vision OCR"
    confidence_score: float = 90.0
    extracted_parameters: Dict[str, Any] = Field(default_factory=dict)
    bounding_boxes: List[Any] = Field(default_factory=list)
    readability_scores: Dict[str, Any] = Field(default_factory=dict)
    rule_pack_metadata: Dict[str, Any] = Field(default_factory=dict)
    evidence_quality: Dict[str, Any] = Field(default_factory=dict)
    status: str = "completed"


@router.get("/ocr-scans")
def get_ocr_scans(
    product_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Retrieve OCR inspection scans with extracted parameters."""
    query = db.query(OCRScanModel).order_by(OCRScanModel.scan_timestamp.desc())
    if product_id:
        query = query.filter(OCRScanModel.product_id == product_id)
    return query.limit(limit).all()


@router.post("/ocr-scans", status_code=201)
def create_ocr_scan(scan_in: OCRScanCreateSchema, db: Session = Depends(get_db)):
    """Persist an OCR inspection scan directly from the web app."""
    scan_id = scan_in.id or f"scan-{uuid.uuid4().hex[:8]}"
    scan = OCRScanModel(
        id=scan_id,
        product_id=scan_in.product_id,
        image_url=scan_in.image_url,
        raw_extracted_text=scan_in.raw_extracted_text,
        cleaned_text=scan_in.cleaned_text or scan_in.raw_extracted_text,
        ocr_engine=scan_in.ocr_engine,
        confidence_score=scan_in.confidence_score,
        extracted_parameters=scan_in.extracted_parameters,
        bounding_boxes=scan_in.bounding_boxes,
        readability_scores=scan_in.readability_scores,
        rule_pack_metadata=scan_in.rule_pack_metadata,
        evidence_quality=scan_in.evidence_quality,
        status=scan_in.status,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


# ============================================================================
# 4. VIOLATIONS ENFORCEMENT LEDGER ENDPOINTS
# ============================================================================
class ViolationCreateSchema(BaseModel):
    id: Optional[str] = None
    case_number: Optional[str] = None
    product_id: Optional[str] = None
    manufacturer_id: Optional[str] = None
    product_name: str
    brand: str
    manufacturer: str
    platform: str = "E-Commerce"
    rule_code: str
    section: str
    act_name: str
    severity: str = "medium"
    description: str
    evidence: Dict[str, Any] = Field(default_factory=dict)
    penalty_estimate: float = 0.0
    status: str = "Open"
    notice_id: Optional[str] = None
    assigned_officer: str = "Zonal Compliance Officer"
    detected_at: Optional[str] = None


@router.get("/violations")
def get_violations(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Retrieve logged violations and Show Cause Notice records."""
    query = db.query(ViolationModel)
    if severity and severity != "All":
        query = query.filter(ViolationModel.severity == severity)
    if status and status != "All":
        query = query.filter(ViolationModel.status == status)
    return query.order_by(ViolationModel.created_at.desc()).limit(limit).all()


@router.post("/violations", status_code=201)
def create_violation(viol_in: ViolationCreateSchema, db: Session = Depends(get_db)):
    """Record a newly detected regulatory violation."""
    v_id = viol_in.id or f"viol-{uuid.uuid4().hex[:8]}"
    case_num = viol_in.case_number or f"CASE-2026-{uuid.uuid4().hex[:6].upper()}"

    viol = ViolationModel(
        id=v_id,
        case_number=case_num,
        product_id=viol_in.product_id,
        manufacturer_id=viol_in.manufacturer_id,
        product_name=viol_in.product_name,
        brand=viol_in.brand,
        manufacturer=viol_in.manufacturer,
        platform=viol_in.platform,
        rule_code=viol_in.rule_code,
        section=viol_in.section,
        act_name=viol_in.act_name,
        severity=viol_in.severity,
        description=viol_in.description,
        evidence=viol_in.evidence,
        penalty_estimate=viol_in.penalty_estimate,
        status=viol_in.status,
        notice_id=viol_in.notice_id,
        assigned_officer=viol_in.assigned_officer,
        detected_at=viol_in.detected_at or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(viol)
    db.commit()
    db.refresh(viol)
    return viol


@router.put("/violations/{violation_id}")
def update_violation(
    violation_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
):
    """Update status or details of a violation / notice."""
    viol = db.query(ViolationModel).filter(ViolationModel.id == violation_id).first()
    if not viol:
        raise HTTPException(status_code=404, detail="Violation not found")

    for key, value in payload.items():
        if hasattr(viol, key) and key not in ("id", "created_at"):
            setattr(viol, key, value)

    db.commit()
    db.refresh(viol)
    return viol


# ============================================================================
# 5. COMPLAINTS ENDPOINTS
# ============================================================================
class ComplaintCreateSchema(BaseModel):
    id: Optional[str] = None
    ticket_id: Optional[str] = None
    product_id: Optional[str] = None
    consumer_name: str
    consumer_email: str
    consumer_phone: Optional[str] = None
    product_name: str
    brand: str
    platform: str = "Online / In-Store"
    order_number: Optional[str] = None
    product_url: Optional[str] = None
    description: str
    category: str = "Packaging & Labeling"
    ai_matched_rule: Optional[str] = None
    status: str = "New"
    sentiment_score: float = 0.85
    needs_review: bool = False
    extracted_evidence_summary: Dict[str, Any] = Field(default_factory=dict)
    evidence_urls: List[str] = Field(default_factory=list)
    evidence_images: List[Any] = Field(default_factory=list)
    assigned_officer: Optional[str] = None
    officer_decision_history: List[Any] = Field(default_factory=list)
    submitted_at: Optional[str] = None


@router.get("/complaints")
def get_complaints(
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Retrieve logged consumer grievances."""
    query = db.query(ComplaintModel)
    if status and status != "All":
        query = query.filter(ComplaintModel.status == status)
    return query.order_by(ComplaintModel.created_at.desc()).limit(limit).all()


@router.post("/complaints", status_code=201)
def create_complaint(c_in: ComplaintCreateSchema, db: Session = Depends(get_db)):
    """File a consumer complaint directly from the Citizen / Complaints portal."""
    c_id = c_in.id or f"comp-{uuid.uuid4().hex[:8]}"
    ticket_id = c_in.ticket_id or f"NCH-2026-{uuid.uuid4().hex[:6].upper()}"

    complaint = ComplaintModel(
        id=c_id,
        ticket_id=ticket_id,
        product_id=c_in.product_id,
        consumer_name=c_in.consumer_name,
        consumer_email=c_in.consumer_email,
        consumer_phone=c_in.consumer_phone,
        product_name=c_in.product_name,
        brand=c_in.brand,
        platform=c_in.platform,
        order_number=c_in.order_number,
        product_url=c_in.product_url,
        description=c_in.description,
        category=c_in.category,
        ai_matched_rule=c_in.ai_matched_rule,
        status=c_in.status,
        sentiment_score=c_in.sentiment_score,
        needs_review=c_in.needs_review,
        extracted_evidence_summary=c_in.extracted_evidence_summary,
        evidence_urls=c_in.evidence_urls,
        evidence_images=c_in.evidence_images,
        assigned_officer=c_in.assigned_officer or "Auto-Assigned Zonal Inspector",
        officer_decision_history=c_in.officer_decision_history,
        submitted_at=c_in.submitted_at or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.put("/complaints/{complaint_id}")
def update_complaint(
    complaint_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
):
    """Update status, officer decision, or review flags for a complaint."""
    comp = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    for key, value in payload.items():
        if hasattr(comp, key) and key not in ("id", "created_at"):
            setattr(comp, key, value)

    db.commit()
    db.refresh(comp)
    return comp


# ============================================================================
# 6. REGULATORY RULES CRUD & SUPABASE PGVECTOR SEMANTIC RETRIEVAL
# ============================================================================
try:
    from backend.services.rule_vector_service import (
        search_rules_vector,
        save_rule_embedding,
        seed_all_rule_embeddings,
        check_rules_pgvector_readiness,
    )
except ImportError:
    from services.rule_vector_service import (
        search_rules_vector,
        save_rule_embedding,
        seed_all_rule_embeddings,
        check_rules_pgvector_readiness,
    )


class RuleVectorSearchSchema(BaseModel):
    query_text: str
    category: Optional[str] = None
    limit: int = 5
    threshold: float = 0.25


@router.get("/rules/vector-status")
def get_rules_vector_status(db: Session = Depends(get_db)):
    """Check whether Supabase pgvector extension is active on regulatory_rules."""
    return check_rules_pgvector_readiness(db)


@router.post("/rules/search-vector")
def search_regulatory_rules_vector(
    req: RuleVectorSearchSchema,
    db: Session = Depends(get_db),
):
    """
    Search for gazette-verified statutory rules using Supabase pgvector HNSW Cosine Distance,
    with an automatic deterministic fallback for SQLite or unindexed databases.
    """
    return search_rules_vector(
        db=db,
        query_text=req.query_text,
        category=req.category,
        limit=req.limit,
        threshold=req.threshold,
    )


@router.post("/rules/seed-embeddings")
def seed_regulatory_rules_embeddings(db: Session = Depends(get_db)):
    """Populate/sync vector embeddings for all statutory rules in the database."""
    count = seed_all_rule_embeddings(db)
    return {"status": "success", "embeddings_seeded": count}


class RegulatoryRuleCreateSchema(BaseModel):
    id: Optional[str] = None
    rule_code: str
    act_name: str
    section_clause: str
    target_field: str
    title: str
    description: str
    category_scope: str = "ALL"
    validation_spec: Dict[str, Any] = Field(default_factory=dict)
    severity: str = "CRITICAL"
    is_mandatory: bool = True
    is_conditional: bool = False
    condition_description: Optional[str] = None
    min_fine_inr: float = 25000.0
    max_fine_inr: float = 100000.0
    imprisonment_months: int = 0
    gazette_notification_no: Optional[str] = None
    gazette_date: Optional[str] = None
    effective_from: str = "2024-01-01"
    effective_to: Optional[str] = None
    is_active: bool = True


@router.post("/rules", status_code=201)
def create_regulatory_rule(rule_in: RegulatoryRuleCreateSchema, db: Session = Depends(get_db)):
    """Add a new gazette rule to the regulatory rules database."""
    r_id = rule_in.id or f"rule-{uuid.uuid4().hex[:8]}"

    existing = db.query(RegulatoryRuleModel).filter(RegulatoryRuleModel.rule_code == rule_in.rule_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Rule code '{rule_in.rule_code}' already exists.")

    rule = RegulatoryRuleModel(
        id=r_id,
        rule_code=rule_in.rule_code,
        act_name=rule_in.act_name,
        section_clause=rule_in.section_clause,
        target_field=rule_in.target_field,
        title=rule_in.title,
        description=rule_in.description,
        category_scope=rule_in.category_scope,
        validation_spec=rule_in.validation_spec,
        severity=rule_in.severity,
        is_mandatory=rule_in.is_mandatory,
        is_conditional=rule_in.is_conditional,
        condition_description=rule_in.condition_description,
        min_fine_inr=rule_in.min_fine_inr,
        max_fine_inr=rule_in.max_fine_inr,
        imprisonment_months=rule_in.imprisonment_months,
        gazette_notification_no=rule_in.gazette_notification_no,
        gazette_date=rule_in.gazette_date,
        effective_from=rule_in.effective_from,
        effective_to=rule_in.effective_to,
        is_active=rule_in.is_active,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    # Automatically compute and store vector embedding (Supabase pgvector / fallback)
    try:
        text_rep = f"{rule.act_name} {rule.section_clause} {rule.title} {rule.target_field} {rule.description}"
        save_rule_embedding(db, rule.id, text_rep)
    except Exception as e:
        print(f"[RulesAPI] Warning: embedding could not be persisted: {e}")

    return rule
