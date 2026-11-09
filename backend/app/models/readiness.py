from datetime import UTC, datetime

from sqlalchemy import CheckConstraint, Column, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class DailyReadiness(Base):
    __tablename__ = "daily_readiness"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    sleep_hours = Column(Float, nullable=True)
    soreness_score = Column(Float, nullable=True)
    resting_hr = Column(Integer, nullable=True)
    logged_date = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC))

    __table_args__ = (
        CheckConstraint(
            "sleep_hours IS NULL OR (sleep_hours >= 0.0 AND sleep_hours <= 24.0)", name="chk_readiness_sleep_range"
        ),
        CheckConstraint(
            "soreness_score IS NULL OR (soreness_score >= 1.0 AND soreness_score <= 10.0)",
            name="chk_readiness_soreness_range",
        ),
        CheckConstraint("resting_hr IS NULL OR (resting_hr > 0 AND resting_hr < 250)", name="chk_readiness_rhr_range"),
        UniqueConstraint("user_id", "logged_date", name="uq_readiness_user_date"),
    )

    user = relationship("User", back_populates="readiness_entries")
