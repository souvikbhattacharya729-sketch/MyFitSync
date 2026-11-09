from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import User
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/acwr")
def get_acwr_analytics(
    target_date: date | None = Query(None, alias="date"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return AnalyticsService.compute_acwr_for_user(db, user_id, target_date=target_date)


@router.get("/strength")
def get_strength_analytics(
    exercise: str | None = Query(None), user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    return AnalyticsService.get_strength_trends(db, user_id, exercise=exercise)


@router.get("/volume")
def get_volume_analytics(
    group_by: str = Query("daily", pattern="^(daily|weekly)$"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return AnalyticsService.get_volume_analytics(db, user_id, group_by=group_by)


@router.get("/nutrition")
def get_nutrition_analytics(
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    # Return today summary and recent macro trends
    return AnalyticsService.get_today_nutrition(db, user)
