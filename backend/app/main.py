import time
import uuid
from typing import Any, Dict
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.api.v1.api_router import api_router
from app.core.config import settings
from app.core.logging import logger
from app.core.rate_limit import limiter

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Enforce production security constraints
    settings.validate_production_security()
    logger.info(f"Starting {settings.PROJECT_NAME} in '{settings.ENVIRONMENT}' environment.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Your Personal Fitness Intelligence API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Attach SlowAPI limiter
app.state.limiter = limiter

# Rate limit exceeded handler
@app.exception_handler(RateLimitExceeded)
def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": {
                "code": "rate_limit_exceeded",
                "message": "Rate limit exceeded. Please slow down your requests.",
                "details": [str(exc.detail)]
            }
        }
    )

# Pydantic validation error handler
@app.exception_handler(RequestValidationError)
def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "")
        details.append(f"{loc}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "validation_error",
                "message": "The submitted data failed validation.",
                "details": details
            }
        }
    )

# FastAPI HTTPException handler
@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    code_map = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        409: "conflict",
        422: "validation_error",
        429: "too_many_requests",
        500: "internal_server_error",
        503: "service_unavailable"
    }
    error_code = code_map.get(exc.status_code, "api_error")
    detail = exc.detail if isinstance(exc.detail, list) else [str(exc.detail)]
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={
            "error": {
                "code": error_code,
                "message": str(exc.detail),
                "details": detail
            }
        }
    )

# Generic unhandled exception handler (prevents leaking stack traces or SQL)
@app.exception_handler(Exception)
def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled exception during request {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "internal_server_error",
                "message": "An unexpected server error occurred. Please try again later.",
                "details": []
            }
        }
    )

# Security and Request ID Middleware
@app.middleware("http")
async def security_and_logging_middleware(request: Request, call_next):
    # Enforce request body size limit
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.MAX_REQUEST_BODY_SIZE_BYTES:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={
                "error": {
                    "code": "request_too_large",
                    "message": "Request entity exceeds the maximum allowable size (1 MB).",
                    "details": []
                }
            }
        )

    # Generate or extract Request ID
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = req_id

    start_time = time.time()
    response: Response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)

    # Security Headers
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"

    logger.info(
        f"{request.method} {request.url.path} responded {response.status_code} in {duration_ms}ms",
        extra={"request_id": req_id}
    )
    return response

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include V1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Top-level ops health check aliases
@app.get("/health", tags=["ops"])
def top_health():
    return {"status": "ok", "service": "MyFitSync Root"}
