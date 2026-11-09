import uuid
from datetime import UTC, datetime

from sqlalchemy import CheckConstraint, Column, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    bodyweight_kg = Column(Float, nullable=False, default=75.0)
    target_calories = Column(Integer, nullable=False, default=2500)
    target_protein_g = Column(Float, nullable=True)
    target_carbs_g = Column(Float, nullable=True)
    target_fat_g = Column(Float, nullable=True)
    timezone = Column(String(50), nullable=False, default="UTC")
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC))

    __table_args__ = (
        CheckConstraint("bodyweight_kg > 0", name="chk_user_bodyweight_positive"),
        CheckConstraint("target_calories > 0", name="chk_user_target_calories_positive"),
        CheckConstraint("target_protein_g IS NULL OR target_protein_g >= 0", name="chk_user_target_protein_nonneg"),
        CheckConstraint("target_carbs_g IS NULL OR target_carbs_g >= 0", name="chk_user_target_carbs_nonneg"),
        CheckConstraint("target_fat_g IS NULL OR target_fat_g >= 0", name="chk_user_target_fat_nonneg"),
    )

    # Cascade relationships: user deletion removes all their data
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    nutrition_entries = relationship(
        "Nutrition", back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    readiness_entries = relationship(
        "DailyReadiness", back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
