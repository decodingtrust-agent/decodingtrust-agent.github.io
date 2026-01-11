import bcrypt
import hashlib


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def hash_token(token: str) -> str:
    """Hash a token using SHA-256 for storage."""
    return hashlib.sha256(token.encode()).hexdigest()
