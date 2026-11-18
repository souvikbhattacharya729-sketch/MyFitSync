from pydantic import BaseModel, Field


class MacroTargets(BaseModel):
    protein_g: float
    protein_kcal: float
    protein_pct: float
    fat_g: float
    fat_kcal: float
    fat_pct: float
    carbs_g: float
    carbs_kcal: float
    carbs_pct: float


class TargetsOut(BaseModel):
    profile_complete: bool
    missing_fields: list[str] = Field(default_factory=list)
    bmr: float | None = None
    tdee: float | None = None
    calorie_target: int | None = None
    raw_target_calories: float | None = None
    safe_floor_applied: bool = False
    safe_floor_kcal: int | None = None
    floor_warning: str | None = None
    macros: MacroTargets | None = None
    disclaimer: str
    eating_disorder_help_url: str = "https://www.nationaleatingdisorders.org"
    hide_calorie_targets: bool = False
