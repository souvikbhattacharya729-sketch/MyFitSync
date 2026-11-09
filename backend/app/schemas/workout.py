from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class WorkoutBase(BaseModel):
    exercise: str = Field(..., min_length=1, max_length=100)
    exercise_raw: Optional[str] = Field(default=None, max_length=255)
    weight_kg: float = Field(..., ge=0)
    reps: int = Field(..., gt=0)
    sets: int = Field(..., gt=0)
    rpe: Optional[float] = Field(default=None, ge=1.0, le=10.0)
    performed_on: date

class WorkoutCreate(WorkoutBase):
    pass

class WorkoutUpdate(BaseModel):
    exercise: Optional[str] = Field(default=None, min_length=1, max_length=100)
    exercise_raw: Optional[str] = Field(default=None, max_length=255)
    weight_kg: Optional[float] = Field(default=None, ge=0)
    reps: Optional[int] = Field(default=None, gt=0)
    sets: Optional[int] = Field(default=None, gt=0)
    rpe: Optional[float] = Field(default=None, ge=1.0, le=10.0)
    performed_on: Optional[date] = None

class WorkoutOut(WorkoutBase):
    id: int
    user_id: str
    exercise_raw: str
    estimated_1rm: Optional[float] = None
    total_volume: float
    created_at: datetime

    model_config = {"from_attributes": True}

class PaginatedWorkouts(BaseModel):
    items: List[WorkoutOut]
    total: int
    page: int
    page_size: int
    total_pages: int
