from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ReadinessBase(BaseModel):
    sleep_hours: Optional[float] = Field(default=None, ge=0.0, le=24.0)
    soreness_score: Optional[float] = Field(default=None, ge=1.0, le=10.0)
    resting_hr: Optional[int] = Field(default=None, gt=0, lt=250)
    logged_date: date

class ReadinessCreate(ReadinessBase):
    pass

class ReadinessUpdate(BaseModel):
    sleep_hours: Optional[float] = Field(default=None, ge=0.0, le=24.0)
    soreness_score: Optional[float] = Field(default=None, ge=1.0, le=10.0)
    resting_hr: Optional[int] = Field(default=None, gt=0, lt=250)
    logged_date: Optional[date] = None

class ReadinessOut(ReadinessBase):
    id: int
    user_id: str
    created_at: datetime

    model_config = {"from_attributes": True}

class PaginatedReadiness(BaseModel):
    items: List[ReadinessOut]
    total: int
    page: int
    page_size: int
    total_pages: int
