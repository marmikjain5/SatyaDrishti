"""
SatyaDrishti SQLAlchemy Database Models
Maps tables for Manufacturers, Products, OCR Scan Records, Violations, and Complaints.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parents[1]
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from backend.database import Base


class ManufacturerModel(Base):
    __tablename__ = "manufacturers"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    cin = Column(String(32), unique=True, index=True)
    gstin = Column(String(32), unique=True, index=True)
    registered_address = Column(Text, nullable=True)
    risk_tier = Column(String(32), nullable=False, default="Moderate")  # Critical, High, Moderate, Low
    risk_score = Column(Integer, nullable=False, default=50)
    repeat_offender_flag = Column(Boolean, nullable=False, default=False)
    total_products_scanned = Column(Integer, nullable=False, default=0)
    active_violations = Column(Integer, nullable=False, default=0)
    notices_issued = Column(Integer, nullable=False, default=0)
    brands = Column(JSON, default=list)
    top_offense_types = Column(JSON, default=list)
    last_audit_date = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    products = relationship("ProductModel", back_populates="manufacturer_rel")
    violations = relationship("ViolationModel", back_populates="manufacturer_rel")


class ProductModel(Base):
    __tablename__ = "products"

    id = Column(String(64), primary_key=True, index=True)
    sku = Column(String(64), unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False, index=True)
    brand = Column(String(255), nullable=False, index=True)
    category = Column(String(255), nullable=False, index=True)
    manufacturer_id = Column(String(64), ForeignKey("manufacturers.id"), nullable=True)
    manufacturer_name = Column(String(255), nullable=False)
    country_of_origin = Column(String(128), nullable=False, default="India")
    mrp = Column(Float, nullable=False)
    listed_price = Column(Float, nullable=False)
    net_weight = Column(String(128), nullable=False)
    platform = Column(String(64), nullable=False, index=True)
    product_url = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    status = Column(String(64), nullable=False, default="compliant", index=True)
    compliance_score = Column(Integer, nullable=False, default=100)
    ocr_confidence = Column(Float, nullable=False, default=95.0)
    ingredients_list = Column(JSON, default=list)
    nutritional_info = Column(JSON, default=dict)
    customer_care_contact = Column(Text, nullable=True)
    dietary_type = Column(String(64), default="Vegetarian")
    missing_mandatory_fields = Column(JSON, default=list)
    regulatory_acts = Column(JSON, default=list)
    last_scanned = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    manufacturer_rel = relationship("ManufacturerModel", back_populates="products")
    ocr_scans = relationship("OCRScanModel", back_populates="product_rel")
    violations = relationship("ViolationModel", back_populates="product_rel")


class OCRScanModel(Base):
    __tablename__ = "ocr_scans"

    id = Column(String(64), primary_key=True, index=True)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=True)
    image_url = Column(Text, nullable=False)
    raw_extracted_text = Column(Text, nullable=False)
    cleaned_text = Column(Text, nullable=True)
    ocr_engine = Column(String(64), default="Tesseract.js v5 / Vision OCR")
    confidence_score = Column(Float, nullable=False, default=0.0)
    extracted_parameters = Column(JSON, default=dict)
    bounding_boxes = Column(JSON, default=list)
    readability_scores = Column(JSON, default=dict)
    rule_pack_metadata = Column(JSON, default=dict)
    evidence_quality = Column(JSON, default=dict)
    status = Column(String(32), nullable=False, default="completed")
    scan_timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product_rel = relationship("ProductModel", back_populates="ocr_scans")


class OfflineInspectionModel(Base):
    __tablename__ = "offline_inspections"

    id = Column(String(128), primary_key=True, index=True)
    payload_digest = Column(String(64), nullable=False)
    scan_payload = Column(JSON, nullable=False)
    analysis_payload = Column(JSON, nullable=False)
    evidence_images = Column(JSON, nullable=False, default=list)
    client_created_at = Column(String(64), nullable=False)
    synced_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ViolationModel(Base):
    __tablename__ = "violations"

    id = Column(String(64), primary_key=True, index=True)
    case_number = Column(String(64), unique=True, nullable=False, index=True)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=True)
    manufacturer_id = Column(String(64), ForeignKey("manufacturers.id"), nullable=True)
    product_name = Column(String(500), nullable=False)
    brand = Column(String(255), nullable=False)
    manufacturer = Column(String(255), nullable=False)
    platform = Column(String(64), nullable=False)
    rule_code = Column(String(64), nullable=False, index=True)
    section = Column(String(255), nullable=False)
    act_name = Column(String(255), nullable=False)
    severity = Column(String(32), nullable=False, default="medium", index=True)
    description = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=False, default=dict)
    penalty_estimate = Column(Float, nullable=False, default=0.0)
    status = Column(String(64), nullable=False, default="Open", index=True)
    notice_id = Column(String(64), nullable=True)
    assigned_officer = Column(String(255), nullable=False, default="Zonal Compliance Officer")
    detected_at = Column(String(64), nullable=True)
    resolved_at = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product_rel = relationship("ProductModel", back_populates="violations")
    manufacturer_rel = relationship("ManufacturerModel", back_populates="violations")


class ComplaintModel(Base):
    __tablename__ = "complaints"

    id = Column(String(64), primary_key=True, index=True)
    ticket_id = Column(String(64), unique=True, nullable=False, index=True)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=True)
    consumer_name = Column(String(255), nullable=False)
    consumer_email = Column(String(255), nullable=False, index=True)
    consumer_phone = Column(String(64), nullable=True)
    product_name = Column(String(500), nullable=False)
    brand = Column(String(255), nullable=False)
    platform = Column(String(64), nullable=False)
    order_number = Column(String(64), nullable=True)
    product_url = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    category = Column(String(255), nullable=False)
    ai_matched_rule = Column(String(255), nullable=True)
    status = Column(String(64), nullable=False, default="New", index=True)
    sentiment_score = Column(Float, default=0.85)
    needs_review = Column(Boolean, nullable=False, default=False)
    extracted_evidence_summary = Column(JSON, default=dict)
    evidence_urls = Column(JSON, default=list)
    evidence_images = Column(JSON, default=list)  # Full EvidenceImageItem[] with OCR metadata & Supabase Storage URLs
    assigned_officer = Column(String(255), nullable=True)
    officer_decision_history = Column(JSON, default=list)
    submitted_at = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RegulatoryRuleModel(Base):
    """
    Gazette-verified statutory rules used by the backend validation engine.

    Architecture note:
    - This table = production-grade ground truth seeded from official Gazette notifications.
    - The frontend ragKnowledgeService.ts = separate DEMO layer for showing live rule ingestion.
    - The two layers operate in parallel and do NOT replace each other.
    """

    __tablename__ = "regulatory_rules"

    id = Column(String(64), primary_key=True, index=True)
    rule_code = Column(String(128), unique=True, nullable=False, index=True)
    act_name = Column(String(255), nullable=False)
    section_clause = Column(String(128), nullable=False)
    target_field = Column(String(64), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    # Category scope: ALL | FOOD | COSMETICS | ELECTRONICS | APPAREL | NUTRACEUTICALS
    category_scope = Column(String(64), nullable=False, default="ALL")
    # JSONB validation spec: thresholds, regex patterns, conditional logic
    validation_spec = Column(JSON, nullable=False, default=dict)
    severity = Column(String(32), nullable=False, default="CRITICAL")  # CRITICAL, HIGH, MEDIUM, LOW
    is_mandatory = Column(Boolean, nullable=False, default=True)
    is_conditional = Column(Boolean, nullable=False, default=False)
    condition_description = Column(Text, nullable=True)
    min_fine_inr = Column(Float, nullable=False, default=25000.0)
    max_fine_inr = Column(Float, nullable=False, default=100000.0)
    imprisonment_months = Column(Integer, nullable=False, default=0)
    # Gazette provenance
    gazette_notification_no = Column(String(128), nullable=True)
    gazette_date = Column(String(64), nullable=True)
    effective_from = Column(String(32), nullable=False)  # ISO date string
    effective_to = Column(String(32), nullable=True)    # NULL = currently active
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
