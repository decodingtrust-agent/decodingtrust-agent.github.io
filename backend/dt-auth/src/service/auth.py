from datetime import datetime, timezone
from sqlalchemy.orm import Session
from src.model.user import User
from src.model.refresh_token import RefreshToken
from src.utils.crypto import verify_password, hash_token
from src.utils.jwt import create_access_token, create_refresh_token, verify_token
from .user import UserService


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)

    def register(self, email: str, username: str, password: str) -> tuple[User | None, str | None]:
        """Register a new user. Returns (user, error_message)."""
        if self.user_service.email_exists(email):
            return None, "Email already registered"
        if self.user_service.username_exists(username):
            return None, "Username already taken"

        user = self.user_service.create(email, username, password)
        return user, None

    def login(self, email: str, password: str) -> tuple[dict | None, str | None]:
        """Login a user. Returns (tokens_dict, error_message)."""
        user = self.user_service.get_by_email(email)
        if not user:
            return None, "Invalid email or password"

        if not verify_password(password, user.hashed_password):
            return None, "Invalid email or password"

        access_token = create_access_token(user.id, user.username, user.email)
        refresh_token, expires_at = create_refresh_token(user.id)

        # Store refresh token hash in database
        token_record = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            expires_at=expires_at,
        )
        self.db.add(token_record)
        self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
            }
        }, None

    def refresh(self, refresh_token: str) -> tuple[dict | None, str | None]:
        """Refresh access token. Returns (tokens_dict, error_message)."""
        payload = verify_token(refresh_token, token_type="refresh")
        if not payload:
            return None, "Invalid refresh token"

        user_id = int(payload["sub"])
        token_hash = hash_token(refresh_token)

        # Check if token exists and is valid
        token_record = self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        ).first()

        if not token_record:
            return None, "Invalid or expired refresh token"

        user = self.user_service.get_by_id(user_id)
        if not user:
            return None, "User not found"

        access_token = create_access_token(user.id, user.username, user.email)

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }, None

    def logout(self, refresh_token: str) -> tuple[bool, str | None]:
        """Logout by revoking refresh token. Returns (success, error_message)."""
        payload = verify_token(refresh_token, token_type="refresh")
        if not payload:
            return False, "Invalid refresh token"

        user_id = int(payload["sub"])
        token_hash = hash_token(refresh_token)

        token_record = self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.token_hash == token_hash,
        ).first()

        if token_record:
            token_record.is_revoked = True
            self.db.commit()

        return True, None

    def get_current_user(self, access_token: str) -> tuple[User | None, str | None]:
        """Get current user from access token. Returns (user, error_message)."""
        payload = verify_token(access_token, token_type="access")
        if not payload:
            return None, "Invalid access token"

        user_id = int(payload["sub"])
        user = self.user_service.get_by_id(user_id)
        if not user:
            return None, "User not found"

        return user, None
