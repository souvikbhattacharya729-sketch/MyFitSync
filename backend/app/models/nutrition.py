from datetime import UTC, datetime

from sqlalchemy import CheckConstraint, Column, Date, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Nutrition(Base):
    __tablename__ = "nutrition"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    meal_title = Column(String(255), nullable=True)
    calories = Column(Float, nullable=True)
    protein_g = Column(Float, nullable=True)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    eaten_on = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC))

    __table_args__ = (
        CheckConstraint("calories IS NULL OR calories >= 0", name="chk_nutrition_calories_nonneg"),
        CheckConstraint("protein_g IS NULL OR protein_g >= 0", name="chk_nutrition_protein_nonneg"),
        CheckConstraint("carbs_g IS NULL OR carbs_g >= 0", name="chk_nutrition_carbs_nonneg"),
        CheckConstraint("fat_g IS NULL OR fat_g >= 0", name="chk_nutrition_fat_nonneg"),
        CheckConstraint(
            "calories IS NOT NULL OR protein_g IS NOT NULL OR carbs_g IS NOT NULL OR fat_g IS NOT NULL OR meal_title IS NOT NULL",
            name="chk_nutrition_at_least_one_field",
        ),
        Index("ix_nutrition_user_eaten", "user_id", eaten_on.desc()),
    )

    user = relationship("User", back_populates="nutrition_entries")
