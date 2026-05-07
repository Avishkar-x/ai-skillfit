"""
SkillSetu — JWT Authentication Service

Provides login endpoint and dependency for protecting dashboard routes.
Uses a simple admin credential check with JWT tokens.

Set ADMIN_USERNAME, ADMIN_PASSWORD, and JWT_SECRET in .env
"""
import os
import logging
from datetime import datetime, timedelta
from functools import wraps

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Try to import JWT library
try:
    import jwt
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False
    logger.warning("[AUTH] PyJWT not installed. Auth will be disabled.")

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "skillsetu-dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 8

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "skillsetu2026")

security = HTTPBearer(auto_error=False)


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = JWT_EXPIRY_HOURS * 3600


# ─────────────────────────────────────────────────────────────────────────────
# Token helpers
# ─────────────────────────────────────────────────────────────────────────────
def create_token(username: str) -> str:
    """Create a JWT token for the given username."""
    if not JWT_AVAILABLE:
        return "dev-token-jwt-not-available"

    payload = {
        "sub": username,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    """Verify and decode a JWT token. Raises HTTPException on failure."""
    if not JWT_AVAILABLE:
        return {"sub": "dev-user"}

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired. Please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
        )


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI Dependencies
# ─────────────────────────────────────────────────────────────────────────────
async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """FastAPI dependency — protects dashboard routes with JWT auth."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return verify_token(credentials.credentials)


# ─────────────────────────────────────────────────────────────────────────────
# Login handler
# ─────────────────────────────────────────────────────────────────────────────
def authenticate(data: LoginRequest) -> LoginResponse:
    """Validate credentials and return a JWT token."""
    if data.username == ADMIN_USERNAME and data.password == ADMIN_PASSWORD:
        token = create_token(data.username)
        logger.info(f"[AUTH] Login successful for: {data.username}")
        return LoginResponse(access_token=token)

    logger.warning(f"[AUTH] Login failed for: {data.username}")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password.",
    )
