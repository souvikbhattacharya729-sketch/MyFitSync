from typing import Dict, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import limiter
from app.core.security import get_current_user_id
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

# In-memory idempotency cache: key -> ChatResponse
IDEMPOTENCY_STORE: Dict[str, ChatResponse] = {}

@router.post("", response_model=ChatResponse)
@limiter.limit("30/minute")
def chat_endpoint(
    request: Request,
    chat_req: ChatRequest,
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if x_idempotency_key:
        cache_key = f"{user_id}:{x_idempotency_key}"
        if cache_key in IDEMPOTENCY_STORE:
            return IDEMPOTENCY_STORE[cache_key]

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    response = chat_service.process_chat_message(
        db=db,
        user=user,
        message=chat_req.message,
        timezone=chat_req.timezone
    )

    if x_idempotency_key:
        cache_key = f"{user_id}:{x_idempotency_key}"
        IDEMPOTENCY_STORE[cache_key] = response

    return response
