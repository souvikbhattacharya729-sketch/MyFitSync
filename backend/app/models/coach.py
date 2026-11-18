from sqlalchemy import Column, Date, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class CoachUsage(Base):
    __tablename__ = "coach_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    used_on = Column(Date, nullable=False)
    calls = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("user_id", "used_on", name="uq_coach_usage_user_day"),
        Index("ix_coach_usage_used_on", "used_on"),
    )

    user = relationship("User", backref="coach_usages")
