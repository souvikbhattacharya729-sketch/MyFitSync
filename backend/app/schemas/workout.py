from datetime import date, datetime
from typing import List

from pydantic import BaseModel, Field


class WorkoutBase(BaseModel):
    exercise: str = Field(..., min_length=1, max_length=100)
    exercise_raw: str | None = Field(default=None, max_length=255)
    weight_kg: float = Field(..., ge=0)
    reps: int = Field(..., gt=0)
    sets: int = Field(..., gt=0)
    rpe: float | None = Field(default=None, ge=1.0, le=10.0)
    performed_on: date


class WorkoutCreate(WorkoutBase):
    pass


class WorkoutUpdate(BaseModel):
    exercise: str | None = Field(default=None, min_length=1, max_length=100)
    exercise_raw: str | None = Field(default=None, max_length=255)
    weight_kg: float | None = Field(default=None, ge=0)
    reps: int | None = Field(default=None, gt=0)
    sets: int | None = Field(default=None, gt=0)
    rpe: float | None = Field(default=None, ge=1.0, le=10.0)
    performed_on: date | None = None


class WorkoutOut(WorkoutBase):
    id: int
    user_id: str
    exercise_raw: str
    estimated_1rm: float | None = None
    total_volume: float
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedWorkouts(BaseModel):
    items: List[WorkoutOut]
    total: int
    page: int
    page_size: int
    total_pages: int
