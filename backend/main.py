"""
SatyaDrishti FastAPI Server
Main entrypoint for the Python backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path
from dotenv import load_dotenv

_backend_dir = Path(__file__).resolve().parent
load_dotenv(_backend_dir.parent / ".env")
load_dotenv(_backend_dir / ".env")
load_dotenv()

if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from api.routes.database_api import router as database_router
from api.routes.extraction_api import router as extraction_router
from api.routes.email_api import router as email_router
from api.routes.crawler_api import router as crawler_router
from api.routes.inspection_sync_api import router as inspection_sync_router
from services.ecommerce_crawler_service import crawler_service
import asyncio

app = FastAPI(
    title="SatyaDrishti Regulatory Intelligence API",
    description="Backend API for Legal Metrology, OCR Verification, and Consumer Protection Enforcement",
    version="1.0.0",
)

# Enable CORS for frontend Vite dev server (default http://localhost:3000 / 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(database_router)
app.include_router(extraction_router)
app.include_router(email_router)

app.include_router(crawler_router)
app.include_router(inspection_sync_router)


async def _autonomous_crawler_loop():
    """Autonomous background worker: runs daily batch of 5 products without human intervention."""
    # Allow server 5 seconds to warm up
    await asyncio.sleep(5)
    while True:
        try:
            if crawler_service.auto_schedule_active:
                crawler_service.log_event("INFO", "[Autonomous Daemon] Waking up for scheduled daily 5-product batch")
                await crawler_service.run_batch(batch_size=5)
            # Sleep 24 hours (or configurable hours)
            sleep_seconds = crawler_service.get_status().get("interval_hours", 24) * 3600
            await asyncio.sleep(sleep_seconds)
        except asyncio.CancelledError:
            break
        except Exception as e:
            crawler_service.log_event("ERROR", f"[Autonomous Daemon] Uncaught error in scheduler loop: {e}")
            await asyncio.sleep(60)


from database import Base, engine, run_migrations
import models.db_models  # Ensure all models are registered

@app.on_event("startup")
async def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        run_migrations()
        print("[Database] Schema synchronized and migrated successfully.")
    except Exception as e:
        print(f"[Database] Schema sync warning: {e}")
    asyncio.create_task(_autonomous_crawler_loop())


@app.api_route("/", methods=["GET", "HEAD"])
@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {
        "status": "healthy",
        "service": "SatyaDrishti Regulatory Backend",
        "database": "PostgreSQL / SQLite Storage Engine Active",
        "crawler_scheduler": "Active (Autonomous Daily 5-Product Batch)",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
