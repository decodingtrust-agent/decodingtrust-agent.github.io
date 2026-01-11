from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from src.config import get_settings

settings = get_settings()


def create_access_token(user_id: int, username: str, email: str) -> str:
    """Create a JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "username": username,
        "email": email,
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(user_id: int) -> tuple[str, datetime]:
    """Create a JWT refresh token. Returns (token, expires_at)."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "iat": datetime.now(timezone.utc),
        "exp": expire,
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    return token, expire


def verify_token(token: str, token_type: str = "access") -> dict | None:
    """Verify a JWT token and return the payload if valid."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None
