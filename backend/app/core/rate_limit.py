from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple
from fastapi import HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# In-memory tracking for failed login attempts (IP -> (count, lockout_until))
FAILED_LOGINS: Dict[str, Tuple[int, Optional[datetime]]] = defaultdict(lambda: (0, None))
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

def check_failed_login_lockout(client_ip: str) -> None:
    """Checks if the client IP is currently locked out due to excessive failed login attempts."""
    now = datetime.now(timezone.utc)
    attempts, lockout_until = FAILED_LOGINS[client_ip]
    if lockout_until and now < lockout_until:
        remaining_seconds = int((lockout_until - now).total_seconds())
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Account access temporarily locked. Try again in {remaining_seconds} seconds."
        )
    elif lockout_until and now >= lockout_until:
        # Reset after lockout period expires
        FAILED_LOGINS[client_ip] = (0, None)

def record_failed_login(client_ip: str) -> None:
    now = datetime.now(timezone.utc)
    attempts, lockout_until = FAILED_LOGINS[client_ip]
    new_attempts = attempts + 1
    if new_attempts >= MAX_FAILED_ATTEMPTS:
        lockout_until = now + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
    FAILED_LOGINS[client_ip] = (new_attempts, lockout_until)

def record_successful_login(client_ip: str) -> None:
    if client_ip in FAILED_LOGINS:
        del FAILED_LOGINS[client_ip]
