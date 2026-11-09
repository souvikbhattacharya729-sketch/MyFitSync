import math
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from zoneinfo import ZoneInfo

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.nutrition import Nutrition
from app.models.user import User
from app.schemas.nutrition import (
    DailyNutritionTotals,
    NutritionCreate,
    NutritionOut,
    NutritionUpdate,
    PaginatedNutrition,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.post("", response_model=NutritionOut, status_code=status.HTTP_201_CREATED)
def create_nutrition(
    nutr_in: NutritionCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    entry = Nutrition(
        user_id=user_id,
        meal_title=nutr_in.meal_title,
        calories=nutr_in.calories,
        protein_g=nutr_in.protein_g,
        carbs_g=nutr_in.carbs_g,
        fat_g=nutr_in.fat_g,
        eaten_on=nutr_in.eaten_on
    )
    db.add(entry)
    db.flush()
    return entry

@router.get("", response_model=PaginatedNutrition)
def list_nutrition(
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(Nutrition).filter(Nutrition.user_id == user_id)
    if from_date:
        query = query.filter(Nutrition.eaten_on >= from_date)
    if to_date:
        query = query.filter(Nutrition.eaten_on <= to_date)

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(Nutrition.eaten_on.desc(), Nutrition.id.desc()).offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedNutrition(
        items=[NutritionOut.model_validate(n) for n in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/daily-totals", response_model=DailyNutritionTotals)
def get_daily_totals(
    target_date: Optional[date] = Query(None, alias="date"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    res = AnalyticsService.get_today_nutrition(db, user, target_date=target_date)
    return DailyNutritionTotals(**res)

@router.get("/{id}", response_model=NutritionOut)
def get_nutrition(
    id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    entry = db.query(Nutrition).filter(Nutrition.id == id, Nutrition.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Nutrition entry {id} not found.")
    return entry

@router.put("/{id}", response_model=NutritionOut)
def update_nutrition(
    id: int,
    nutr_update: NutritionUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    entry = db.query(Nutrition).filter(Nutrition.id == id, Nutrition.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Nutrition entry {id} not found.")

    if nutr_update.meal_title is not None:
        entry.meal_title = nutr_update.meal_title
    if nutr_update.calories is not None:
        entry.calories = nutr_update.calories
    if nutr_update.protein_g is not None:
        entry.protein_g = nutr_update.protein_g
    if nutr_update.carbs_g is not None:
        entry.carbs_g = nutr_update.carbs_g
    if nutr_update.fat_g is not None:
        entry.fat_g = nutr_update.fat_g
    if nutr_update.eaten_on is not None:
        entry.eaten_on = nutr_update.eaten_on

    db.flush()
    return entry

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nutrition(
    id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    entry = db.query(Nutrition).filter(Nutrition.id == id, Nutrition.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Nutrition entry {id} not found.")
    db.delete(entry)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
