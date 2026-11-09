from datetime import datetime
from typing import Optional
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
    target_calories: int = Field(default=2500, gt=0)
    target_protein_g: Optional[float] = Field(default=None, ge=0)
    target_carbs_g: Optional[float] = Field(default=None, ge=0)
    target_fat_g: Optional[float] = Field(default=None, ge=0)
    timezone: str = Field(default="UTC")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    bodyweight_kg: Optional[float] = Field(default=None, gt=0)
    target_calories: Optional[int] = Field(default=None, gt=0)
    target_protein_g: Optional[float] = Field(default=None, ge=0)
    target_carbs_g: Optional[float] = Field(default=None, ge=0)
    target_fat_g: Optional[float] = Field(default=None, ge=0)
    timezone: Optional[str] = None

class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    bodyweight_kg: float
    target_calories: int
    target_protein_g: Optional[float] = None
    target_carbs_g: Optional[float] = None
    target_fat_g: Optional[float] = None
    timezone: str
    created_at: datetime

    model_config = {"from_attributes": True}
