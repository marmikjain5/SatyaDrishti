"""
SatyaDrishti E-Commerce Crawler & Statutory Inspection API Routes

Exposes endpoints to trigger batch automated inspections, inspect custom live URLs,
retrieve crawler logs, and monitor scheduled compliance execution.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query, Body, HTTPException
from pydantic import BaseModel, HttpUrl

from backend.services.ecommerce_crawler_service import crawler_service

router = APIRouter(prefix="/api/v1/crawler", tags=["E-Commerce Crawler & Inspector"])


class BatchRequest(BaseModel):
    batch_size: int = 5
    platform: Optional[str] = None
    force_live: bool = True


class InspectUrlRequest(BaseModel):
    url: str


@router.get("/status")
def get_crawler_status() -> Dict[str, Any]:
    """Returns the current state, scheduler stats, and next run schedule of the crawler."""
    return crawler_service.get_status()


@router.get("/history")
def get_crawler_history(limit: int = Query(default=20, ge=1, le=100)) -> List[Dict[str, Any]]:
    """Returns previous inspected product records with Rule 6 compliance audits."""
    return crawler_service.history_records[:limit]


@router.get("/logs")
def get_crawler_logs(limit: int = Query(default=50, ge=1, le=200)) -> List[Dict[str, Any]]:
    """Returns live activity and scraping logs from the crawler."""
    return crawler_service.execution_logs[-limit:]


@router.post("/run-batch")
async def run_inspection_batch(request: BatchRequest = Body(default=BatchRequest())) -> Dict[str, Any]:
    """
    Triggers an automated inspection batch of products (default 5 products across platforms).
    Attempts live scraping first via ScraperAPI, Jina Reader, or Direct Stealth.
    """
    batch_size = max(1, min(request.batch_size, 20))
    results = await crawler_service.run_batch(
        batch_size=batch_size,
        platform_filter=request.platform,
        force_live=request.force_live,
    )
    return {
        "success": True,
        "message": f"Successfully completed compliance audit for {len(results)} packaged commodity listings.",
        "batch_size": len(results),
        "products": results,
        "summary": crawler_service.get_status(),
    }


@router.post("/inspect-url")
async def inspect_single_url(request: InspectUrlRequest) -> Dict[str, Any]:
    """
    Inspects ANY arbitrary live product URL provided by the user or enforcement officer.
    Extracts statutory fields and applies Legal Metrology Rules, 2011 compliance checks.
    """
    url = request.url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Invalid URL. Must begin with http:// or https://")

    result = await crawler_service.inspect_custom_url(url)
    return {
        "success": True,
        "message": f"Successfully inspected product URL: {url}",
        "record": result,
    }
