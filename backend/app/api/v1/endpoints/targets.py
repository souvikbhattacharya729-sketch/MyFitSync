from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.sports_science import (
    TARGETS_ESTIMATE_DISCLAIMER,
    bmr,
    daily_target,
    macro_targets,
    tdee,
)
from app.models.user import User
from app.schemas.targets import MacroTargets, TargetsOut

router = APIRouter()


@router.get("", response_model=TargetsOut)
def get_user_targets(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Returns estimated BMR, TDEE, daily calorie target, and macro targets for the authenticated user.
    Enforces strict UUID user isolation.
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Check for required profile parameters
    missing_fields = []
    if not user.bodyweight_kg or user.bodyweight_kg <= 0:
        missing_fields.append("bodyweight_kg")
    if not user.height_cm:
        missing_fields.append("height_cm")
    if not user.age:
        missing_fields.append("age")
    if not user.sex:
        missing_fields.append("sex")
    if not user.activity_level:
        missing_fields.append("activity_level")
    if not user.goal:
        missing_fields.append("goal")

    if missing_fields:
        return TargetsOut(
            profile_complete=False,
            missing_fields=missing_fields,
            disclaimer=TARGETS_ESTIMATE_DISCLAIMER,
            hide_calorie_targets=user.hide_calorie_targets,
        )

    # All fields validated and present
    user_bmr = bmr(
        weight_kg=float(user.bodyweight_kg),
        height_cm=float(user.height_cm),
        age=int(user.age),
        sex=str(user.sex),
    )
    user_tdee = tdee(user_bmr, str(user.activity_level))
    target_res = daily_target(user_tdee, str(user.goal), str(user.sex))
    cal_target = int(target_res["target_calories"])

    macros_dict = macro_targets(
        calories=float(cal_target),
        weight_kg=float(user.bodyweight_kg),
        goal=str(user.goal),
    )

    macro_obj = MacroTargets(
        protein_g=macros_dict["protein_g"],
        protein_kcal=macros_dict["protein_kcal"],
        protein_pct=macros_dict["protein_pct"],
        fat_g=macros_dict["fat_g"],
        fat_kcal=macros_dict["fat_kcal"],
        fat_pct=macros_dict["fat_pct"],
        carbs_g=macros_dict["carbs_g"],
        carbs_kcal=macros_dict["carbs_kcal"],
        carbs_pct=macros_dict["carbs_pct"],
    )

    return TargetsOut(
        profile_complete=True,
        missing_fields=[],
        bmr=user_bmr,
        tdee=user_tdee,
        calorie_target=cal_target,
        raw_target_calories=float(target_res["raw_target"]),
        safe_floor_applied=bool(target_res["below_floor_flag"]),
        safe_floor_kcal=int(target_res["safe_floor"]),
        floor_warning=str(target_res["warning"]) if target_res["warning"] else None,
        macros=macro_obj,
        disclaimer=TARGETS_ESTIMATE_DISCLAIMER,
        hide_calorie_targets=user.hide_calorie_targets,
    )
