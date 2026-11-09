"""Initial database schema for MyFitSync

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-11-09 10:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        "users",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("bodyweight_kg", sa.Float(), server_default="75.0", nullable=False),
        sa.Column("target_calories", sa.Integer(), server_default="2500", nullable=False),
        sa.Column("target_protein_g", sa.Float(), nullable=True),
        sa.Column("target_carbs_g", sa.Float(), nullable=True),
        sa.Column("target_fat_g", sa.Float(), nullable=True),
        sa.Column("timezone", sa.String(length=50), server_default="UTC", nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("user_id"),
        sa.UniqueConstraint("email"),
        sa.CheckConstraint("bodyweight_kg > 0", name="chk_user_bodyweight_positive"),
        sa.CheckConstraint("target_calories > 0", name="chk_user_target_calories_positive"),
        sa.CheckConstraint("target_protein_g IS NULL OR target_protein_g >= 0", name="chk_user_target_protein_nonneg"),
        sa.CheckConstraint("target_carbs_g IS NULL OR target_carbs_g >= 0", name="chk_user_target_carbs_nonneg"),
        sa.CheckConstraint("target_fat_g IS NULL OR target_fat_g >= 0", name="chk_user_target_fat_nonneg"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 2. workouts table
    op.create_table(
        "workouts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("exercise", sa.String(length=100), nullable=False),
        sa.Column("exercise_raw", sa.String(length=255), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=False),
        sa.Column("sets", sa.Integer(), nullable=False),
        sa.Column("rpe", sa.Float(), nullable=True),
        sa.Column("estimated_1rm", sa.Float(), nullable=True),
        sa.Column("total_volume", sa.Float(), nullable=False),
        sa.Column("performed_on", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("weight_kg >= 0", name="chk_workout_weight_nonneg"),
        sa.CheckConstraint("reps > 0", name="chk_workout_reps_positive"),
        sa.CheckConstraint("sets > 0", name="chk_workout_sets_positive"),
        sa.CheckConstraint("rpe IS NULL OR (rpe >= 1.0 AND rpe <= 10.0)", name="chk_workout_rpe_range"),
        sa.CheckConstraint("total_volume >= 0", name="chk_workout_volume_nonneg"),
    )
    op.create_index("ix_workouts_user_id", "workouts", ["user_id"])
    op.create_index("ix_workouts_user_performed", "workouts", ["user_id", sa.text("performed_on DESC")])
    op.create_index("ix_workouts_user_exercise_performed", "workouts", ["user_id", "exercise", "performed_on"])

    # 3. nutrition table
    op.create_table(
        "nutrition",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("meal_title", sa.String(length=255), nullable=True),
        sa.Column("calories", sa.Float(), nullable=True),
        sa.Column("protein_g", sa.Float(), nullable=True),
        sa.Column("carbs_g", sa.Float(), nullable=True),
        sa.Column("fat_g", sa.Float(), nullable=True),
        sa.Column("eaten_on", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("calories IS NULL OR calories >= 0", name="chk_nutrition_calories_nonneg"),
        sa.CheckConstraint("protein_g IS NULL OR protein_g >= 0", name="chk_nutrition_protein_nonneg"),
        sa.CheckConstraint("carbs_g IS NULL OR carbs_g >= 0", name="chk_nutrition_carbs_nonneg"),
        sa.CheckConstraint("fat_g IS NULL OR fat_g >= 0", name="chk_nutrition_fat_nonneg"),
        sa.CheckConstraint(
            "calories IS NOT NULL OR protein_g IS NOT NULL OR carbs_g IS NOT NULL OR fat_g IS NOT NULL OR meal_title IS NOT NULL",
            name="chk_nutrition_at_least_one_field",
        ),
    )
    op.create_index("ix_nutrition_user_id", "nutrition", ["user_id"])
    op.create_index("ix_nutrition_user_eaten", "nutrition", ["user_id", sa.text("eaten_on DESC")])

    # 4. daily_readiness table
    op.create_table(
        "daily_readiness",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("sleep_hours", sa.Float(), nullable=True),
        sa.Column("soreness_score", sa.Float(), nullable=True),
        sa.Column("resting_hr", sa.Integer(), nullable=True),
        sa.Column("logged_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "logged_date", name="uq_readiness_user_date"),
        sa.CheckConstraint(
            "sleep_hours IS NULL OR (sleep_hours >= 0.0 AND sleep_hours <= 24.0)", name="chk_readiness_sleep_range"
        ),
        sa.CheckConstraint(
            "soreness_score IS NULL OR (soreness_score >= 1.0 AND soreness_score <= 10.0)",
            name="chk_readiness_soreness_range",
        ),
        sa.CheckConstraint(
            "resting_hr IS NULL OR (resting_hr > 0 AND resting_hr < 250)", name="chk_readiness_rhr_range"
        ),
    )
    op.create_index("ix_daily_readiness_user_id", "daily_readiness", ["user_id"])


def downgrade() -> None:
    op.drop_table("daily_readiness")
    op.drop_table("nutrition")
    op.drop_table("workouts")
    op.drop_table("users")
