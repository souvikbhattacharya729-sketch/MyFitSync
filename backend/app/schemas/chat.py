from typing import Any, Dict, List

from pydantic import BaseModel, Field

from app.schemas.nutrition import NutritionOut
from app.schemas.readiness import ReadinessOut
from app.schemas.workout import WorkoutOut


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    timezone: str | None = None


class ClarificationItem(BaseModel):
    field: str
    exercise: str | None = None
    question: str


class SavedRecords(BaseModel):
    workouts: List[WorkoutOut] = Field(default_factory=list)
    nutrition: List[NutritionOut] = Field(default_factory=list)
    readiness: List[ReadinessOut] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    saved: SavedRecords
    clarifications: List[ClarificationItem] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)
