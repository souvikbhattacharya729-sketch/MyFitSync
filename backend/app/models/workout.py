from datetime import datetime, timezone
from sqlalchemy import CheckConstraint, Column, Date, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    exercise = Column(String(100), nullable=False)
    exercise_raw = Column(String(255), nullable=False)
    weight_kg = Column(Float, nullable=False)
    reps = Column(Integer, nullable=False)
    sets = Column(Integer, nullable=False)
    rpe = Column(Float, nullable=True)
    estimated_1rm = Column(Float, nullable=True)
    total_volume = Column(Float, nullable=False)
    performed_on = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("weight_kg >= 0", name="chk_workout_weight_nonneg"),
        CheckConstraint("reps > 0", name="chk_workout_reps_positive"),
        CheckConstraint("sets > 0", name="chk_workout_sets_positive"),
        CheckConstraint("rpe IS NULL OR (rpe >= 1.0 AND rpe <= 10.0)", name="chk_workout_rpe_range"),
        CheckConstraint("total_volume >= 0", name="chk_workout_volume_nonneg"),
        Index("ix_workouts_user_performed", "user_id", performed_on.desc()),
        Index("ix_workouts_user_exercise_performed", "user_id", "exercise", "performed_on"),
    )

    user = relationship("User", back_populates="workouts")
