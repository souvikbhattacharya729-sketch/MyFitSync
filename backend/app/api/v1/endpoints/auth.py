from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import (
    check_failed_login_lockout,
    limiter,
    record_failed_login,
    record_successful_login,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user_id,
    get_password_hash,
    validate_password_strength,
    verify_password,
)
from app.models.user import User
from app.schemas.token import (
    RefreshTokenRequest,
    Token,
    UserLogin,
    UserOut,
    UserProfileUpdate,
    UserRegister,
)

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Validate password strength
    validate_password_strength(user_in.password)

    # Check email duplicate (stored lowercase)
    norm_email = user_in.email.lower().strip()
    existing_user = db.query(User).filter(User.email == norm_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists."
        )

    user = User(
        email=norm_email,
        hashed_password=get_password_hash(user_in.password),
        name=user_in.name.strip(),
        bodyweight_kg=user_in.bodyweight_kg,
        target_calories=user_in.target_calories,
        target_protein_g=user_in.target_protein_g,
        target_carbs_g=user_in.target_carbs_g,
        target_fat_g=user_in.target_fat_g,
        timezone=user_in.timezone or "UTC"
    )
    db.add(user)
    db.flush()
    return user

@router.post("/login", response_model=Token)
@limiter.limit("15/minute")
def login(request: Request, user_in: UserLogin, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_failed_login_lockout(client_ip)

    norm_email = user_in.email.lower().strip()
    user = db.query(User).filter(User.email == norm_email).first()

    # Constant-time failure response to not reveal email existence
    if not user or not verify_password(user_in.password, user.hashed_password):
        record_failed_login(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    record_successful_login(client_ip)
    access_token = create_access_token(user.user_id)
    refresh_token = create_refresh_token(user.user_id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/refresh", response_model=Token)
def refresh_token(token_req: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(token_req.refresh_token)
    user_id: str = payload.get("sub", "")
    token_type: str = payload.get("type", "")

    if token_type != "refresh" or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token."
        )

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    new_access_token = create_access_token(user.user_id)
    new_refresh_token = create_refresh_token(user.user_id)

    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user

@router.patch("/me", response_model=UserOut)
def update_current_user_profile(
    profile_update: UserProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if profile_update.name is not None:
        user.name = profile_update.name.strip()
    if profile_update.bodyweight_kg is not None:
        user.bodyweight_kg = profile_update.bodyweight_kg
    if profile_update.target_calories is not None:
        user.target_calories = profile_update.target_calories
    if profile_update.target_protein_g is not None:
        user.target_protein_g = profile_update.target_protein_g
    if profile_update.target_carbs_g is not None:
        user.target_carbs_g = profile_update.target_carbs_g
    if profile_update.target_fat_g is not None:
        user.target_fat_g = profile_update.target_fat_g
    if profile_update.timezone is not None:
        user.timezone = profile_update.timezone

    db.flush()
    return user
