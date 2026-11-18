from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.sports_science import (
    TARGETS_ESTIMATE_DISCLAIMER,
    calculate_user_targets,
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

    targets_dict = calculate_user_targets(user)
    if not targets_dict["profile_complete"]:
        return TargetsOut(
            profile_complete=False,
            missing_fields=targets_dict["missing_fields"],
            disclaimer=TARGETS_ESTIMATE_DISCLAIMER,
            hide_calorie_targets=user.hide_calorie_targets,
        )

    macros_dict = targets_dict["macros"]
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
        bmr=targets_dict["bmr"],
        tdee=targets_dict["tdee"],
        calorie_target=targets_dict["calorie_target"],
        raw_target_calories=targets_dict["raw_target_calories"],
        safe_floor_applied=targets_dict["safe_floor_applied"],
        safe_floor_kcal=targets_dict["safe_floor_kcal"],
        floor_warning=targets_dict["floor_warning"],
        macros=macro_obj,
        disclaimer=TARGETS_ESTIMATE_DISCLAIMER,
        hide_calorie_targets=user.hide_calorie_targets,
    )
