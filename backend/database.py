"""
SatyaDrishti Database Connection & Session Management
Connects to PostgreSQL (or SQLite fallback) via SQLAlchemy ORM.
"""

import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

# Database URL from environment or default to local PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/satyadrishti"
)
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.strip().strip('"').strip("'")
    # Remove Prisma-specific ?pgbouncer=true param — not supported by psycopg2
    DATABASE_URL = DATABASE_URL.split("?")[0]

# Detect if PostgreSQL or SQLite
is_sqlite = DATABASE_URL.startswith("sqlite")

try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        echo=False,
        connect_args={"check_same_thread": False} if is_sqlite else {}
    )
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    # If postgres connection fails, fallback gracefully to SQLite local file
    print(f"[Database] Warning: PostgreSQL not reachable at {DATABASE_URL}. Initializing local SQLite fallback satyadrishti.db. Error: {e}")
    SQLITE_PATH = Path(__file__).resolve().parent / "satyadrishti.db"
    DATABASE_URL = f"sqlite:///{SQLITE_PATH}"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


from sqlalchemy import text

def run_migrations():
    """Ensures existing tables are altered with newly added columns without data loss."""
    try:
        with engine.begin() as conn:
            if is_sqlite:
                for col in ["evidence_images", "evidence_urls", "officer_decision_history"]:
                    try:
                        conn.execute(text(f"ALTER TABLE complaints ADD COLUMN {col} TEXT DEFAULT '[]'"))
                    except Exception:
                        pass
                try:
                    conn.execute(text("ALTER TABLE complaints ADD COLUMN extracted_evidence_summary TEXT DEFAULT '{}'"))
                except Exception:
                    pass
            else:
                conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS evidence_images JSON DEFAULT '[]'::json;"))
                conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS extracted_evidence_summary JSON DEFAULT '{}'::json;"))
                conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS evidence_urls JSON DEFAULT '[]'::json;"))
                conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS officer_decision_history JSON DEFAULT '[]'::json;"))
        print("[Database] Schema column migrations completed successfully.")
    except Exception as e:
        print(f"[Database] Migration notice: {e}")


def get_db():
    """FastAPI Dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

