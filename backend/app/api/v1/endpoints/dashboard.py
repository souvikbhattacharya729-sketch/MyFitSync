from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.nutrition import Nutrition
from app.models.readiness import DailyReadiness
from app.models.user import User
from app.models.workout import Workout
from app.schemas.dashboard import (
    ACWRBlock,
    DashboardResponse,
    DashboardTotals,
    LastReadinessSummary,
    RecentActivity,
    SectionEmptyFlags,
    TodayNutritionSummary,
)
from app.schemas.nutrition import NutritionOut
from app.schemas.readiness import ReadinessOut
from app.schemas.workout import WorkoutOut
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("", response_model=DashboardResponse)
def get_dashboard_data(
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # 1. Totals query
    workout_query = db.query(Workout).filter(Workout.user_id == user_id)
    if from_date:
        workout_query = workout_query.filter(Workout.performed_on >= from_date)
    if to_date:
        workout_query = workout_query.filter(Workout.performed_on <= to_date)

    workouts_list = workout_query.all()
    total_volume = sum(w.total_volume for w in workouts_list)
    workouts_count = len(workouts_list)
    active_days = len(set(w.performed_on for w in workouts_list))

    totals = DashboardTotals(
        total_volume_kg=round(total_volume, 1),
        workouts_count=workouts_count,
        active_days=active_days
    )

    # 2. Key lifts latest E1RM
    latest_e1rm = AnalyticsService.get_latest_e1rm_by_exercise(db, user_id)

    # 3. Today's nutrition vs targets
    today_nutrition_data = AnalyticsService.get_today_nutrition(db, user)
    today_nutrition = TodayNutritionSummary(**today_nutrition_data)

    # 4. Last readiness / recovery
    last_readiness_data = AnalyticsService.get_last_readiness(db, user_id)
    last_readiness = LastReadinessSummary(**last_readiness_data)

    # 5. ACWR Block
    acwr_data = AnalyticsService.compute_acwr_for_user(db, user_id)
    acwr = ACWRBlock(**acwr_data)

    # 6. Recent activity (last 5 of each)
    recent_workouts = (
        db.query(Workout)
        .filter(Workout.user_id == user_id)
        .order_by(Workout.performed_on.desc(), Workout.id.desc())
        .limit(5)
        .all()
    )
    recent_nutrition = (
        db.query(Nutrition)
        .filter(Nutrition.user_id == user_id)
        .order_by(Nutrition.eaten_on.desc(), Nutrition.id.desc())
        .limit(5)
        .all()
    )
    recent_readiness = (
        db.query(DailyReadiness)
        .filter(DailyReadiness.user_id == user_id)
        .order_by(DailyReadiness.logged_date.desc(), DailyReadiness.id.desc())
        .limit(5)
        .all()
    )

    recent = RecentActivity(
        workouts=[WorkoutOut.model_validate(w) for w in recent_workouts],
        nutrition=[NutritionOut.model_validate(n) for n in recent_nutrition],
        readiness=[ReadinessOut.model_validate(r) for r in recent_readiness]
    )

    # 7. Section empty flags
    has_workouts = workouts_count > 0 or len(recent_workouts) > 0
    has_nutrition = (
        db.query(Nutrition.id).filter(Nutrition.user_id == user_id).first() is not None
    )
    has_readiness = (
        db.query(DailyReadiness.id).filter(DailyReadiness.user_id == user_id).first() is not None
    )

    is_empty = SectionEmptyFlags(
        overall=not (has_workouts or has_nutrition or has_readiness),
        workouts=not has_workouts,
        nutrition=not has_nutrition,
        readiness=not has_readiness
    )

    return DashboardResponse(
        totals=totals,
        latest_e1rm=latest_e1rm,
        today_nutrition=today_nutrition,
        last_readiness=last_readiness,
        acwr=acwr,
        recent_activity=recent,
        is_empty=is_empty
    )
