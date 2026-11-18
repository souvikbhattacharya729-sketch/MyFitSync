"""Add height, age, sex, activity level, goal, and preferences to users table

Revision ID: 002_user_profile_targets
Revises: 001_initial_schema
Create Date: 2026-11-17 15:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "002_user_profile_targets"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new columns to users table with sensible nullable defaults
    op.add_column("users", sa.Column("height_cm", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("age", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("sex", sa.String(length=10), nullable=True))
    op.add_column("users", sa.Column("activity_level", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("goal", sa.String(length=20), nullable=True))
    op.add_column(
        "users",
        sa.Column("hide_calorie_targets", sa.Boolean(), server_default="false", nullable=False),
    )

    # 2. Add validation check constraints
    op.create_check_constraint(
        "chk_user_height_range",
        "users",
        "height_cm IS NULL OR (height_cm >= 100 AND height_cm <= 250)",
    )
    op.create_check_constraint(
        "chk_user_age_range",
        "users",
        "age IS NULL OR (age >= 13 AND age <= 100)",
    )
    op.create_check_constraint(
        "chk_user_sex_valid",
        "users",
        "sex IS NULL OR sex IN ('male', 'female')",
    )
    op.create_check_constraint(
        "chk_user_activity_valid",
        "users",
        "activity_level IS NULL OR activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'extra_active')",
    )
    op.create_check_constraint(
        "chk_user_goal_valid",
        "users",
        "goal IS NULL OR goal IN ('lose', 'maintain', 'gain')",
    )


def downgrade() -> None:
    # 1. Drop check constraints
    op.drop_constraint("chk_user_goal_valid", "users", type_="check")
    op.drop_constraint("chk_user_activity_valid", "users", type_="check")
    op.drop_constraint("chk_user_sex_valid", "users", type_="check")
    op.drop_constraint("chk_user_age_range", "users", type_="check")
    op.drop_constraint("chk_user_height_range", "users", type_="check")

    # 2. Drop columns
    op.drop_column("users", "hide_calorie_targets")
    op.drop_column("users", "goal")
    op.drop_column("users", "activity_level")
    op.drop_column("users", "sex")
    op.drop_column("users", "age")
    op.drop_column("users", "height_cm")
