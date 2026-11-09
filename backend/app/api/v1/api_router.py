from fastapi import APIRouter
from app.api.v1.endpoints import (
    analytics,
    auth,
    chat,
    dashboard,
    health,
    nutrition,
    readiness,
    workouts,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(workouts.router, prefix="/workouts", tags=["workouts"])
api_router.include_router(nutrition.router, prefix="/nutrition", tags=["nutrition"])
api_router.include_router(readiness.router, prefix="/readiness", tags=["readiness"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(health.router, tags=["ops"])
