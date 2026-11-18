from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in_seconds: int


class TokenPayload(BaseModel):
    sub: str
    exp: int
    type: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=10)
    name: str = Field(..., min_length=1, max_length=100)
    bodyweight_kg: float = Field(default=75.0, gt=0)
    height_cm: float | None = Field(default=None, ge=100.0, le=250.0)
    age: int | None = Field(default=None, ge=13, le=100)
    sex: str | None = Field(default=None, pattern="^(male|female)$")
    activity_level: str | None = Field(default=None, pattern="^(sedentary|light|moderate|very_active|extra_active)$")
    goal: str | None = Field(default=None, pattern="^(lose|maintain|gain)$")
    target_calories: int = Field(default=2500, gt=0)
    target_protein_g: float | None = Field(default=None, ge=0)
    target_carbs_g: float | None = Field(default=None, ge=0)
    target_fat_g: float | None = Field(default=None, ge=0)
    hide_calorie_targets: bool = Field(default=False)
    timezone: str = Field(default="UTC")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    bodyweight_kg: float | None = Field(default=None, gt=0)
    height_cm: float | None = Field(default=None, ge=100.0, le=250.0)
    age: int | None = Field(default=None, ge=13, le=100)
    sex: str | None = Field(default=None, pattern="^(male|female)$")
    activity_level: str | None = Field(default=None, pattern="^(sedentary|light|moderate|very_active|extra_active)$")
    goal: str | None = Field(default=None, pattern="^(lose|maintain|gain)$")
    target_calories: int | None = Field(default=None, gt=0)
    target_protein_g: float | None = Field(default=None, ge=0)
    target_carbs_g: float | None = Field(default=None, ge=0)
    target_fat_g: float | None = Field(default=None, ge=0)
    hide_calorie_targets: bool | None = Field(default=None)
    timezone: str | None = None


class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    bodyweight_kg: float
    height_cm: float | None = None
    age: int | None = None
    sex: str | None = None
    activity_level: str | None = None
    goal: str | None = None
    target_calories: int
    target_protein_g: float | None = None
    target_carbs_g: float | None = None
    target_fat_g: float | None = None
    hide_calorie_targets: bool = False
    timezone: str
    created_at: datetime

    model_config = {"from_attributes": True}
