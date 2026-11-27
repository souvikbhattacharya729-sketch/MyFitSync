"""add coach usage

Revision ID: 361a6d40e98c
Revises: 002_user_profile_targets
Create Date: 2026-11-18 05:58:41.055597

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "361a6d40e98c"
down_revision: Union[str, None] = "002_user_profile_targets"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "coach_usage",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("used_on", sa.Date(), nullable=False),
        sa.Column("calls", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "used_on", name="uq_coach_usage_user_day"),
    )
    op.create_index("ix_coach_usage_used_on", "coach_usage", ["used_on"], unique=False)
    op.create_index(op.f("ix_coach_usage_user_id"), "coach_usage", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_coach_usage_user_id"), table_name="coach_usage")
    op.drop_index("ix_coach_usage_used_on", table_name="coach_usage")
    op.drop_table("coach_usage")
