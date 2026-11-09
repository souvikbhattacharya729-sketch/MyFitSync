import math
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.readiness import DailyReadiness
from app.schemas.readiness import (
    PaginatedReadiness,
    ReadinessCreate,
    ReadinessOut,
    ReadinessUpdate,
)

router = APIRouter()

@router.post("", response_model=ReadinessOut, status_code=status.HTTP_201_CREATED)
def create_or_upsert_readiness(
    readiness_in: ReadinessCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    existing = (
        db.query(DailyReadiness)
        .filter(
            DailyReadiness.user_id == user_id,
            DailyReadiness.logged_date == readiness_in.logged_date
        )
        .first()
    )
    if existing:
        if readiness_in.sleep_hours is not None:
            existing.sleep_hours = readiness_in.sleep_hours
        if readiness_in.soreness_score is not None:
            existing.soreness_score = readiness_in.soreness_score
        if readiness_in.resting_hr is not None:
            existing.resting_hr = readiness_in.resting_hr
        db.flush()
        return existing

    entry = DailyReadiness(
        user_id=user_id,
        sleep_hours=readiness_in.sleep_hours,
        soreness_score=readiness_in.soreness_score,
        resting_hr=readiness_in.resting_hr,
        logged_date=readiness_in.logged_date
    )
    db.add(entry)
    db.flush()
    return entry

@router.get("", response_model=PaginatedReadiness)
def list_readiness(
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(DailyReadiness).filter(DailyReadiness.user_id == user_id)
    if from_date:
        query = query.filter(DailyReadiness.logged_date >= from_date)
    if to_date:
        query = query.filter(DailyReadiness.logged_date <= to_date)

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(DailyReadiness.logged_date.desc(), DailyReadiness.id.desc()).offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedReadiness(
        items=[ReadinessOut.model_validate(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{id}", response_model=ReadinessOut)
def get_readiness(
    id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    entry = db.query(DailyReadiness).filter(DailyReadiness.id == id, DailyReadiness.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Readiness record {id} not found.")
    return entry

@router.put("/{id}", response_model=ReadinessOut)
def update_readiness(
    id: int,
    readiness_update: ReadinessUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    entry = db.query(DailyReadiness).filter(DailyReadiness.id == id, DailyReadiness.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Readiness record {id} not found.")

    if readiness_update.sleep_hours is not None:
        entry.sleep_hours = readiness_update.sleep_hours
    if readiness_update.soreness_score is not None:
        entry.soreness_score = readiness_update.soreness_score
    if readiness_update.resting_hr is not None:
        entry.resting_hr = readiness_update.resting_hr
    if readiness_update.logged_date is not None:
        entry.logged_date = readiness_update.logged_date

    db.flush()
    return entry

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_readiness(
    id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    entry = db.query(DailyReadiness).filter(DailyReadiness.id == id, DailyReadiness.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Readiness record {id} not found.")
    db.delete(entry)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
