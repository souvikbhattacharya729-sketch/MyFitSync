from datetime import date, datetime
from typing import Any, Dict, List

from pydantic import BaseModel, Field, model_validator


class NutritionBase(BaseModel):
    meal_title: str | None = Field(default=None, max_length=255)
    calories: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)
    eaten_on: date

    @model_validator(mode="after")
    def check_at_least_one_field(self) -> "NutritionBase":
        if (
            self.calories is None
            and self.protein_g is None
            and self.carbs_g is None
            and self.fat_g is None
            and (self.meal_title is None or not self.meal_title.strip())
        ):
            raise ValueError(
                "At least one nutrition field (meal_title, calories, protein, carbs, fat) must be provided."
            )
        return self


class NutritionCreate(NutritionBase):
    pass


class NutritionUpdate(BaseModel):
    meal_title: str | None = Field(default=None, max_length=255)
    calories: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)
    eaten_on: date | None = None


class NutritionOut(NutritionBase):
    id: int
    user_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedNutrition(BaseModel):
    items: List[NutritionOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class DailyNutritionTotals(BaseModel):
    date: date
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    target_calories: int
    target_protein_g: float | None = None
    calories_pct: float
    protein_pct: float | None = None
    macro_split: Dict[str, Any]
