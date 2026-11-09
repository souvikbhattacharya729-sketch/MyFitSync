from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
def health_liveness():
    """Liveness probe: verifies process is alive and accepting requests."""
    return {"status": "ok", "service": "MyFitSync Backend"}

@router.get("/health/ready", status_code=status.HTTP_200_OK)
def health_readiness(db: Session = Depends(get_db)):
    """Readiness probe: verifies database connectivity and engine health."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
