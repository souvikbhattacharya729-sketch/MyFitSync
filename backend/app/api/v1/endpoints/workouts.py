import math
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.sports_science import calculate_set_volume, compute_estimated_1rm
from app.models.workout import Workout
from app.schemas.workout import PaginatedWorkouts, WorkoutCreate, WorkoutOut, WorkoutUpdate

router = APIRouter()

@router.post("", response_model=WorkoutOut, status_code=status.HTTP_201_CREATED)
def create_workout(
    workout_in: WorkoutCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    primary_e1rm, _, _ = compute_estimated_1rm(workout_in.weight_kg, workout_in.reps)
    volume = calculate_set_volume(workout_in.weight_kg, workout_in.reps, workout_in.sets)

    workout = Workout(
        user_id=user_id,
        exercise=workout_in.exercise.strip().lower(),
        exercise_raw=workout_in.exercise_raw or workout_in.exercise,
        weight_kg=workout_in.weight_kg,
        reps=workout_in.reps,
        sets=workout_in.sets,
        rpe=workout_in.rpe,
        estimated_1rm=primary_e1rm,
        total_volume=volume,
        performed_on=workout_in.performed_on
    )
    db.add(workout)
    db.flush()
    return workout

@router.get("", response_model=PaginatedWorkouts)
def list_workouts(
    exercise: Optional[str] = Query(None),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    sort: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(Workout).filter(Workout.user_id == user_id)

    if exercise:
        query = query.filter(Workout.exercise == exercise.strip().lower())
    if from_date:
        query = query.filter(Workout.performed_on >= from_date)
    if to_date:
        query = query.filter(Workout.performed_on <= to_date)

    total = query.count()

    if sort == "asc":
        query = query.order_by(Workout.performed_on.asc(), Workout.id.asc())
    else:
        query = query.order_by(Workout.performed_on.desc(), Workout.id.desc())

    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedWorkouts(
        items=[WorkoutOut.model_validate(w) for w in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{id}", response_model=WorkoutOut)
def get_workout(
    id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Scoped by user_id; returns 404 if not found or belongs to another user
    workout = db.query(Workout).filter(Workout.id == id, Workout.user_id == user_id).first()
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout with id {id} not found."
        )
    return workout

@router.put("/{id}", response_model=WorkoutOut)
def update_workout(
    id: int,
    workout_update: WorkoutUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    workout = db.query(Workout).filter(Workout.id == id, Workout.user_id == user_id).first()
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout with id {id} not found."
        )

    if workout_update.exercise is not None:
        workout.exercise = workout_update.exercise.strip().lower()
    if workout_update.exercise_raw is not None:
        workout.exercise_raw = workout_update.exercise_raw
    if workout_update.weight_kg is not None:
        workout.weight_kg = workout_update.weight_kg
    if workout_update.reps is not None:
        workout.reps = workout_update.reps
    if workout_update.sets is not None:
        workout.sets = workout_update.sets
    if workout_update.rpe is not None:
        workout.rpe = workout_update.rpe
    if workout_update.performed_on is not None:
        workout.performed_on = workout_update.performed_on

    # Recalculate derived 1RM and total volume
    primary_e1rm, _, _ = compute_estimated_1rm(workout.weight_kg, workout.reps)
    workout.estimated_1rm = primary_e1rm
    workout.total_volume = calculate_set_volume(workout.weight_kg, workout.reps, workout.sets)

    db.flush()
    return workout

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    workout = db.query(Workout).filter(Workout.id == id, Workout.user_id == user_id).first()
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout with id {id} not found."
        )
    db.delete(workout)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
