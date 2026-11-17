import math
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.nutrition import Nutrition
from app.models.user import User
from app.schemas.nutrition import (
    DailyNutritionTotals,
    NutritionCreate,
    NutritionEstimateRequest,
    NutritionEstimateResponse,
    NutritionOut,
    NutritionUpdate,
    PaginatedNutrition,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.post("", response_model=NutritionOut, status_code=status.HTTP_201_CREATED)
def create_nutrition(
    nutr_in: NutritionCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    entry = Nutrition(
        user_id=user_id,
        meal_title=nutr_in.meal_title,
        calories=nutr_in.calories,
        protein_g=nutr_in.protein_g,
        carbs_g=nutr_in.carbs_g,
        fat_g=nutr_in.fat_g,
        eaten_on=nutr_in.eaten_on,
    )
    db.add(entry)
    db.flush()
    return entry


@router.get("", response_model=PaginatedNutrition)
def list_nutrition(
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    query = db.query(Nutrition).filter(Nutrition.user_id == user_id)
    if from_date:
        query = query.filter(Nutrition.eaten_on >= from_date)
    if to_date:
        query = query.filter(Nutrition.eaten_on <= to_date)

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(Nutrition.eaten_on.desc(), Nutrition.id.desc()).offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedNutrition(
        items=[NutritionOut.model_validate(n) for n in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/daily-totals", response_model=DailyNutritionTotals)
def get_daily_totals(
    target_date: date | None = Query(None, alias="date"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    res = AnalyticsService.get_today_nutrition(db, user, target_date=target_date)
    return DailyNutritionTotals(**res)


@router.get("/{id}", response_model=NutritionOut)
def get_nutrition(id: int, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    entry = db.query(Nutrition).filter(Nutrition.id == id, Nutrition.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Nutrition entry {id} not found.")
    return entry


@router.put("/{id}", response_model=NutritionOut)
def update_nutrition(
    id: int, nutr_update: NutritionUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    entry = db.query(Nutrition).filter(Nutrition.id == id, Nutrition.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Nutrition entry {id} not found.")

    if nutr_update.meal_title is not None:
        entry.meal_title = nutr_update.meal_title
    if nutr_update.calories is not None:
        entry.calories = nutr_update.calories
    if nutr_update.protein_g is not None:
        entry.protein_g = nutr_update.protein_g
    if nutr_update.carbs_g is not None:
        entry.carbs_g = nutr_update.carbs_g
    if nutr_update.fat_g is not None:
        entry.fat_g = nutr_update.fat_g
    if nutr_update.eaten_on is not None:
        entry.eaten_on = nutr_update.eaten_on

    db.flush()
    return entry


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nutrition(id: int, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    entry = db.query(Nutrition).filter(Nutrition.id == id, Nutrition.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Nutrition entry {id} not found.")
    db.delete(entry)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/estimate", response_model=NutritionEstimateResponse)
def estimate_nutrition(
    req: NutritionEstimateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    AI & Food Database Nutrition Estimator.
    Automatically calculates calories, protein, carbs, and fat based on food name, quantity, and unit.
    """
    query = req.food_name.lower().strip()
    qty = req.quantity
    unit = req.unit.lower().strip()

    # Food dictionary with macro profiles
    food_db: dict[str, dict[str, tuple[float, float, float, float]]] = {
        "boiled egg": {"pcs": (78.0, 6.3, 0.6, 5.3), "grms": (1.55, 0.126, 0.012, 0.106)},
        "egg": {"pcs": (78.0, 6.3, 0.6, 5.3), "grms": (1.55, 0.126, 0.012, 0.106)},
        "egg white": {"pcs": (17.0, 3.6, 0.2, 0.1), "grms": (0.52, 0.11, 0.007, 0.002)},
        "chicken breast": {
            "grms": (1.65, 0.31, 0.0, 0.036),
            "oz": (46.8, 8.8, 0.0, 1.02),
            "pcs": (280.0, 53.0, 0.0, 6.1),
        },
        "white rice": {"grms": (1.30, 0.027, 0.28, 0.003), "cups": (205.0, 4.2, 44.5, 0.4)},
        "brown rice": {"grms": (1.23, 0.027, 0.26, 0.01), "cups": (218.0, 4.5, 45.8, 1.6)},
        "oats": {"grms": (3.89, 0.169, 0.663, 0.069), "cups": (307.0, 13.3, 52.4, 5.5)},
        "oatmeal": {"grms": (3.89, 0.169, 0.663, 0.069), "cups": (307.0, 13.3, 52.4, 5.5)},
        "whey protein": {"scoops": (120.0, 24.0, 3.0, 1.5), "grms": (4.0, 0.80, 0.10, 0.05)},
        "protein powder": {"scoops": (120.0, 24.0, 3.0, 1.5), "grms": (4.0, 0.80, 0.10, 0.05)},
        "banana": {"pcs": (105.0, 1.3, 27.0, 0.3), "grms": (0.89, 0.011, 0.228, 0.003)},
        "peanut butter": {"tbsp": (95.0, 4.0, 3.5, 8.0), "grms": (5.88, 0.25, 0.20, 0.50)},
        "paneer": {"grms": (2.96, 0.183, 0.045, 0.225), "oz": (84.0, 5.2, 1.3, 6.4)},
        "salmon": {"grms": (2.06, 0.22, 0.0, 0.12), "oz": (58.4, 6.2, 0.0, 3.4), "pcs": (350.0, 37.4, 0.0, 20.4)},
        "greek yogurt": {"cups": (130.0, 22.0, 7.0, 0.0), "grms": (0.59, 0.10, 0.036, 0.004)},
        "roti": {"pcs": (104.0, 3.1, 20.2, 1.2), "grms": (2.60, 0.078, 0.505, 0.03)},
        "chapati": {"pcs": (104.0, 3.1, 20.2, 1.2), "grms": (2.60, 0.078, 0.505, 0.03)},
        "apple": {"pcs": (95.0, 0.5, 25.0, 0.3), "grms": (0.52, 0.003, 0.138, 0.002)},
        "bread": {"pcs": (80.0, 4.0, 14.0, 1.0), "slices": (80.0, 4.0, 14.0, 1.0)},
        "milk": {"cups": (149.0, 7.7, 11.7, 8.0), "ml": (0.61, 0.032, 0.048, 0.033)},
        "almonds": {"grms": (5.79, 0.21, 0.22, 0.50), "pcs": (7.0, 0.26, 0.27, 0.61)},
    }

    # Match exact or substring
    matched_item: dict[str, tuple[float, float, float, float]] | None = None
    for k, v in food_db.items():
        if k in query or query in k:
            matched_item = v
            break

    if matched_item:
        # Check if unit in matched item
        if unit in matched_item:
            rate = matched_item[unit]
        else:
            # Fallback to first available unit
            first_unit = list(matched_item.keys())[0]
            rate = matched_item[first_unit]

        cals = round(rate[0] * qty, 1)
        p = round(rate[1] * qty, 1)
        c = round(rate[2] * qty, 1)
        f = round(rate[3] * qty, 1)
        confidence = "verified_database"
    else:
        # Intelligent baseline heuristic estimation (standard healthy meal 25% P, 50% C, 25% F)
        base_kcal = 150.0 * qty if unit in ["pcs", "cups", "scoops"] else 1.5 * qty
        cals = round(base_kcal, 1)
        p = round((base_kcal * 0.25) / 4.0, 1)
        c = round((base_kcal * 0.50) / 4.0, 1)
        f = round((base_kcal * 0.25) / 9.0, 1)
        confidence = "ai_heuristic"

    return NutritionEstimateResponse(
        food_name=req.food_name,
        quantity=qty,
        unit=unit,
        calories=cals,
        protein_g=p,
        carbs_g=c,
        fat_g=f,
        confidence=confidence,
        source="MyFitSync AI Nutrition Intelligence",
    )
