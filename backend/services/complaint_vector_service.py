"""
SatyaDrishti Complaint Vector & Deduplication Service
Integrates with Supabase pgvector for semantic search, complaint deduplication,
and historical precedent clustering, with automatic fallback for SQLite / local development.
"""

import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

try:
    from backend.models.db_models import ComplaintModel
    from backend.services.retrieval.hybrid_retriever import (
        generate_char_trigram_vector,
        compute_cosine_similarity,
    )
except ImportError:
    from models.db_models import ComplaintModel
    from services.retrieval.hybrid_retriever import (
        generate_char_trigram_vector,
        compute_cosine_similarity,
    )

VECTOR_DIM = 64


def generate_complaint_embedding(text_content: str) -> List[float]:
    """Generates a normalized 64-dimensional dense embedding vector from complaint text."""
    if not text_content:
        return [0.0] * VECTOR_DIM
    return generate_char_trigram_vector(text_content, dim=VECTOR_DIM)


def vector_to_sql_literal(vec: List[float]) -> str:
    """Formats a float vector into a pgvector string representation: '[0.1, 0.2, ...]'."""
    return f"[{','.join(f'{x:.6f}' for x in vec)}]"


def check_pgvector_readiness(db: Session) -> Dict[str, Any]:
    """
    Checks if Supabase PostgreSQL has pgvector extension and complaints.embedding column enabled.
    """
    try:
        # Check if vector extension is active
        ext_check = db.execute(
            text("SELECT count(*) FROM pg_extension WHERE extname = 'vector';")
        ).scalar()
        if not ext_check or ext_check == 0:
            return {
                "available": False,
                "reason": "pgvector extension not enabled in Supabase yet. Run: CREATE EXTENSION vector;",
            }

        # Check if embedding column exists on complaints table
        col_check = db.execute(
            text(
                "SELECT count(*) FROM information_schema.columns "
                "WHERE table_name = 'complaints' AND column_name = 'embedding';"
            )
        ).scalar()
        if not col_check or col_check == 0:
            return {
                "available": False,
                "reason": "complaints.embedding vector column missing. Run ALTER TABLE complaints ADD COLUMN embedding vector(64);",
            }

        return {"available": True, "reason": "Supabase pgvector active and ready."}
    except Exception as e:
        return {"available": False, "reason": f"Non-Postgres/SQLite environment: {e}"}


def save_complaint_embedding(db: Session, complaint_id: str, raw_text: str) -> bool:
    """
    Calculates and persists the vector embedding for a complaint record.
    Gracefully degrades if pgvector column is not yet present.
    """
    try:
        vec = generate_complaint_embedding(raw_text)
        vec_literal = vector_to_sql_literal(vec)

        # Attempt to store in pgvector column
        try:
            db.execute(
                text("UPDATE complaints SET embedding = :vec::vector WHERE id = :cid"),
                {"vec": vec_literal, "cid": complaint_id},
            )
            db.commit()
            return True
        except Exception:
            db.rollback()
            # If pgvector update fails (e.g., column doesn't exist or SQLite), store in JSON metadata
            comp = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
            if comp:
                summary = comp.extracted_evidence_summary or {}
                summary["embedding_vector"] = vec
                comp.extracted_evidence_summary = dict(summary)
                db.commit()
            return False
    except Exception as e:
        print(f"[ComplaintVectorService] Embedding save notice: {e}")
        return False


def search_similar_complaints(
    db: Session,
    query_text: str,
    brand: Optional[str] = None,
    product_name: Optional[str] = None,
    limit: int = 5,
    threshold: float = 0.40,
) -> Dict[str, Any]:
    """
    Finds semantically similar complaints using Supabase pgvector HNSW cosine distance,
    with an automatic deterministic fallback for SQLite or unindexed databases.
    """
    combined_query = f"{brand or ''} {product_name or ''} {query_text}".strip()
    if not combined_query:
        return {"total_matches": 0, "engine": "None", "is_pgvector": False, "matches": []}

    query_vec = generate_complaint_embedding(combined_query)
    vec_literal = vector_to_sql_literal(query_vec)

    # ─────────────────────────────────────────────────────────────
    # Method 1: Try Native Supabase pgvector query via raw SQL
    # ─────────────────────────────────────────────────────────────
    try:
        sql = """
            SELECT id, ticket_id, consumer_name, product_name, brand, platform, category,
                   description, status, submitted_at,
                   ROUND(CAST(1 - (embedding <=> :vec::vector) AS NUMERIC), 3) AS similarity
            FROM complaints
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> :vec::vector ASC
            LIMIT :limit;
        """
        result = db.execute(text(sql), {"vec": vec_literal, "limit": limit * 2}).fetchall()

        matches = []
        for row in result:
            sim = float(row.similarity) if row.similarity is not None else 0.0
            if sim >= threshold:
                matches.append({
                    "id": row.id,
                    "ticket_id": row.ticket_id,
                    "consumer_name": row.consumer_name,
                    "product_name": row.product_name,
                    "brand": row.brand,
                    "platform": row.platform,
                    "category": row.category,
                    "description": row.description,
                    "status": row.status,
                    "submitted_at": row.submitted_at,
                    "similarity_score": sim,
                    "is_likely_duplicate": sim >= 0.72,
                    "pattern": _infer_violation_pattern(row.description),
                })

        if matches:
            return {
                "total_matches": len(matches),
                "engine": "Supabase pgvector (HNSW Cosine Distance)",
                "is_pgvector": True,
                "matches": matches[:limit],
            }
    except Exception as e:
        # Expected if pgvector not yet created in Supabase or running on SQLite
        db.rollback()

    # ─────────────────────────────────────────────────────────────
    # Method 2: Graceful Deterministic Cosine In-Memory Fallback
    # ─────────────────────────────────────────────────────────────
    try:
        all_comps = db.query(ComplaintModel).limit(200).all()
        scored_items = []

        for c in all_comps:
            summary = c.extracted_evidence_summary or {}
            c_vec = summary.get("embedding_vector")
            if not c_vec:
                c_text = f"{c.brand} {c.product_name} {c.category} {c.description}"
                c_vec = generate_complaint_embedding(c_text)

            sim = compute_cosine_similarity(query_vec, c_vec)
            # Boost score if brand matches
            if brand and c.brand and brand.lower() in c.brand.lower():
                sim = min(1.0, sim + 0.15)

            if sim >= threshold:
                scored_items.append({
                    "id": c.id,
                    "ticket_id": c.ticket_id,
                    "consumer_name": c.consumer_name,
                    "product_name": c.product_name,
                    "brand": c.brand,
                    "platform": c.platform,
                    "category": c.category,
                    "description": c.description,
                    "status": c.status,
                    "submitted_at": c.submitted_at,
                    "similarity_score": round(sim, 3),
                    "is_likely_duplicate": sim >= 0.72,
                    "pattern": _infer_violation_pattern(c.description),
                })

        scored_items.sort(key=lambda x: x["similarity_score"], reverse=True)
        return {
            "total_matches": len(scored_items),
            "engine": "In-Memory Cosine Vector Fallback (Zero Setup)",
            "is_pgvector": False,
            "matches": scored_items[:limit],
        }
    except Exception as fallback_err:
        print(f"[ComplaintVectorService] Fallback error: {fallback_err}")
        return {"total_matches": 0, "engine": "Error", "is_pgvector": False, "matches": []}


def _infer_violation_pattern(description: str) -> str:
    """Classifies citizen text into legal metrology grievance pattern categories."""
    d = (description or "").lower()
    if any(k in d for k in ["sticker", "tamper", "pasted", "overprinted", "dual price"]):
        return "Altered / Pasted MRP Sticker Over Declaration (Rule 6)"
    if any(k in d for k in ["unit sale", "usp", "per gram", "per ml"]):
        return "Missing Mandatory Unit Sale Price (USP G.S.R. 779(E))"
    if any(k in d for k in ["weight", "volume", "underfill", "net qty", "gram"]):
        return "Short Delivery / Deficient Net Quantity (Rule 24)"
    if any(k in d for k in ["date", "expiry", "expired", "best before"]):
        return "Missing / Obscured Manufacturing or Expiry Date"
    if any(k in d for k in ["origin", "country", "import", "china"]):
        return "Non-Declaration of Country of Origin (Rule 6(1)(b))"
    if any(k in d for k in ["helpline", "care", "customer care", "contact"]):
        return "Defective Consumer Care Grievance Redressal Mechanism"
    return "Statutory Package Declaration Non-Compliance"
