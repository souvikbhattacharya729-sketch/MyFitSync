from datetime import date
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.nutrition import NutritionOut
from app.schemas.readiness import ReadinessOut
from app.schemas.workout import WorkoutOut

class DashboardTotals(BaseModel):
    total_volume_kg: float = 0.0
    workouts_count: int = 0
    active_days: int = 0

class TodayNutritionSummary(BaseModel):
    date: date
    calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0
    target_calories: int = 2500
    target_protein_g: Optional[float] = None
    calories_pct: float = 0.0
    protein_pct: Optional[float] = None
    macro_split: Dict[str, Any] = Field(default_factory=dict)

class LastReadinessSummary(BaseModel):
    logged_date: Optional[date] = None
    sleep_hours: Optional[float] = None
    soreness_score: Optional[float] = None
    resting_hr: Optional[int] = None

class ACWRBlock(BaseModel):
    acwr: Optional[float] = None
    acute_load: float = 0.0
    chronic_load: float = 0.0
    status: str = "insufficient_data"
    zone: str = "insufficient_data"
    days_of_history: int = 0
    disclaimer: str

class RecentActivity(BaseModel):
    workouts: List[WorkoutOut] = Field(default_factory=list)
    nutrition: List[NutritionOut] = Field(default_factory=list)
    readiness: List[ReadinessOut] = Field(default_factory=list)

class SectionEmptyFlags(BaseModel):
    overall: bool = True
    workouts: bool = True
    nutrition: bool = True
    readiness: bool = True

class DashboardResponse(BaseModel):
    totals: DashboardTotals
    latest_e1rm: Dict[str, Optional[float]] = Field(default_factory=dict)
    today_nutrition: TodayNutritionSummary
    last_readiness: LastReadinessSummary
    acwr: ACWRBlock
    recent_activity: RecentActivity
    is_empty: SectionEmptyFlags
