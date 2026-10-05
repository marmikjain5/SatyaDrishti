"""
SatyaDrishti Regulatory Rules pgvector & Semantic Retrieval Service
Implements PostgreSQL pgvector (HNSW Cosine Distance) semantic search for Gazette-verified
statutory rules, with automatic in-memory fallback for SQLite and offline edge environments.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

try:
    from backend.models.db_models import RegulatoryRuleModel
    from backend.services.retrieval.hybrid_retriever import (
        generate_char_trigram_vector,
        compute_cosine_similarity,
    )
except ImportError:
    from models.db_models import RegulatoryRuleModel
    from services.retrieval.hybrid_retriever import (
        generate_char_trigram_vector,
        compute_cosine_similarity,
    )

VECTOR_DIM = 64


def generate_rule_embedding(text_content: str) -> List[float]:
    """Generates a unit-normalized 64-dimensional dense feature vector from regulatory text."""
    if not text_content:
        return [0.0] * VECTOR_DIM
    return generate_char_trigram_vector(text_content, dim=VECTOR_DIM)


def vector_to_sql_literal(vec: List[float]) -> str:
    """Formats float vector into pgvector SQL literal: '[0.123, 0.456, ...]'."""
    return f"[{','.join(f'{x:.6f}' for x in vec)}]"


def check_rules_pgvector_readiness(db: Session) -> Dict[str, Any]:
    """
    Checks if Supabase PostgreSQL has pgvector extension and regulatory_rules.embedding enabled.
    """
    try:
        ext_check = db.execute(
            text("SELECT count(*) FROM pg_extension WHERE extname = 'vector';")
        ).scalar()
        if not ext_check or ext_check == 0:
            return {
                "available": False,
                "reason": "pgvector extension not enabled in Supabase. Run: CREATE EXTENSION IF NOT EXISTS vector;",
            }

        col_check = db.execute(
            text(
                "SELECT count(*) FROM information_schema.columns "
                "WHERE table_name = 'regulatory_rules' AND column_name = 'embedding';"
            )
        ).scalar()
        if not col_check or col_check == 0:
            return {
                "available": False,
                "reason": "regulatory_rules.embedding vector column missing. Run ALTER TABLE regulatory_rules ADD COLUMN embedding vector(64);",
            }

        return {"available": True, "reason": "Supabase pgvector active on regulatory_rules."}
    except Exception as e:
        return {"available": False, "reason": f"Non-Postgres/SQLite environment: {e}"}


def save_rule_embedding(db: Session, rule_id: str, raw_text: str) -> bool:
    """
    Calculates and persists dense vector embedding for a statutory rule.
    """
    try:
        vec = generate_rule_embedding(raw_text)
        vec_literal = vector_to_sql_literal(vec)

        # Attempt to store in pgvector column
        try:
            db.execute(
                text("UPDATE regulatory_rules SET embedding = :vec::vector WHERE id = :rid"),
                {"vec": vec_literal, "rid": rule_id},
            )
            db.commit()
            return True
        except Exception:
            db.rollback()
            # If pgvector update fails (e.g. column missing or SQLite), store in validation_spec JSON
            rule = db.query(RegulatoryRuleModel).filter(RegulatoryRuleModel.id == rule_id).first()
            if rule:
                vspec = rule.validation_spec or {}
                vspec["embedding_vector"] = vec
                rule.validation_spec = dict(vspec)
                db.commit()
            return False
    except Exception as e:
        print(f"[RuleVectorService] Embedding save notice: {e}")
        return False


def seed_all_rule_embeddings(db: Session) -> int:
    """
    Generates and persists embeddings for all statutory rules in regulatory_rules.
    Called on startup or migration to ensure full vector coverage.
    """
    try:
        rules = db.query(RegulatoryRuleModel).all()
        count = 0
        for r in rules:
            text_rep = f"{r.act_name} {r.section_clause} {r.title} {r.target_field} {r.description}"
            save_rule_embedding(db, r.id, text_rep)
            count += 1
        return count
    except Exception as e:
        print(f"[RuleVectorService] Seed embeddings notice: {e}")
        return 0


def search_rules_vector(
    db: Session,
    query_text: str,
    category: Optional[str] = None,
    limit: int = 5,
    threshold: float = 0.25,
) -> Dict[str, Any]:
    """
    Performs semantic vector search across statutory rules using Supabase pgvector HNSW Cosine Distance,
    with an automatic deterministic fallback for SQLite or unindexed databases.
    """
    clean_query = (query_text or "").strip()
    if not clean_query:
        return {"total_matches": 0, "engine": "None", "is_pgvector": False, "rules": []}

    query_vec = generate_rule_embedding(clean_query)
    vec_literal = vector_to_sql_literal(query_vec)

    # ─────────────────────────────────────────────────────────────
    # Method 1: Native Supabase pgvector query via raw SQL
    # ─────────────────────────────────────────────────────────────
    try:
        sql = """
            SELECT id, rule_code, act_name, section_clause, target_field, title, description,
                   category_scope, severity, is_mandatory, is_conditional, condition_description,
                   min_fine_inr, max_fine_inr, imprisonment_months, gazette_notification_no,
                   gazette_date, effective_from, is_active,
                   ROUND(CAST(1 - (embedding <=> :vec::vector) AS NUMERIC), 3) AS similarity
            FROM regulatory_rules
            WHERE is_active = true AND embedding IS NOT NULL
            ORDER BY embedding <=> :vec::vector ASC
            LIMIT :limit;
        """
        result = db.execute(text(sql), {"vec": vec_literal, "limit": limit * 2}).fetchall()

        matched_rules = []
        for row in result:
            sim = float(row.similarity) if row.similarity is not None else 0.0
            if sim >= threshold:
                matched_rules.append({
                    "id": row.id,
                    "rule_code": row.rule_code,
                    "act_name": row.act_name,
                    "section_clause": row.section_clause,
                    "target_field": row.target_field,
                    "title": row.title,
                    "description": row.description,
                    "category_scope": row.category_scope,
                    "severity": row.severity,
                    "is_mandatory": row.is_mandatory,
                    "min_fine_inr": row.min_fine_inr,
                    "max_fine_inr": row.max_fine_inr,
                    "imprisonment_months": row.imprisonment_months,
                    "gazette_notification_no": row.gazette_notification_no,
                    "gazette_date": row.gazette_date,
                    "effective_from": row.effective_from,
                    "similarity_score": sim,
                })

        if matched_rules:
            return {
                "total_matches": len(matched_rules),
                "engine": "Supabase pgvector (HNSW Cosine Distance)",
                "is_pgvector": True,
                "rules": matched_rules[:limit],
            }
    except Exception:
        db.rollback()

    # ─────────────────────────────────────────────────────────────
    # Method 2: Graceful Deterministic Cosine In-Memory Fallback
    # ─────────────────────────────────────────────────────────────
    try:
        all_rules = db.query(RegulatoryRuleModel).filter(RegulatoryRuleModel.is_active == True).all()
        scored_rules = []

        for r in all_rules:
            vspec = r.validation_spec or {}
            r_vec = vspec.get("embedding_vector")
            if not r_vec:
                r_text = f"{r.act_name} {r.section_clause} {r.title} {r.target_field} {r.description}"
                r_vec = generate_rule_embedding(r_text)

            sim = compute_cosine_similarity(query_vec, r_vec)
            
            # Boost score if category matches
            if category and r.category_scope and (category.upper() in r.category_scope.upper() or r.category_scope == "ALL"):
                sim = min(1.0, sim + 0.10)

            if sim >= threshold:
                scored_rules.append({
                    "id": r.id,
                    "rule_code": r.rule_code,
                    "act_name": r.act_name,
                    "section_clause": r.section_clause,
                    "target_field": r.target_field,
                    "title": r.title,
                    "description": r.description,
                    "category_scope": r.category_scope,
                    "severity": r.severity,
                    "is_mandatory": r.is_mandatory,
                    "min_fine_inr": r.min_fine_inr,
                    "max_fine_inr": r.max_fine_inr,
                    "imprisonment_months": r.imprisonment_months,
                    "gazette_notification_no": r.gazette_notification_no,
                    "gazette_date": r.gazette_date,
                    "effective_from": r.effective_from,
                    "similarity_score": round(sim, 3),
                })

        scored_rules.sort(key=lambda x: x["similarity_score"], reverse=True)
        return {
            "total_matches": len(scored_rules),
            "engine": "In-Memory Cosine Vector Fallback (Zero Setup)",
            "is_pgvector": False,
            "rules": scored_rules[:limit],
        }
    except Exception as fallback_err:
        print(f"[RuleVectorService] Fallback error: {fallback_err}")
        return {"total_matches": 0, "engine": "Error", "is_pgvector": False, "rules": []}
