from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from src.datastore.session import get_db
from src.service.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


# Request/Response Models
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str


class RegisterResponse(BaseModel):
    id: int
    email: str
    username: str
    message: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str


class LogoutRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str


class MessageResponse(BaseModel):
    message: str


# Routes
@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    auth_service = AuthService(db)
    user, error = auth_service.register(request.email, request.username, request.password)

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    return RegisterResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        message="User registered successfully",
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login and get access/refresh tokens."""
    auth_service = AuthService(db)
    tokens, error = auth_service.login(request.email, request.password)

    if error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)

    return TokenResponse(**tokens)


@router.post("/refresh", response_model=RefreshResponse)
def refresh(request: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    auth_service = AuthService(db)
    tokens, error = auth_service.refresh(request.refresh_token)

    if error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)

    return RefreshResponse(**tokens)


@router.post("/logout", response_model=MessageResponse)
def logout(request: LogoutRequest, db: Session = Depends(get_db)):
    """Logout by revoking refresh token."""
    auth_service = AuthService(db)
    success, error = auth_service.logout(request.refresh_token)

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Get current authenticated user."""
    auth_service = AuthService(db)
    user, error = auth_service.get_current_user(credentials.credentials)

    if error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)

    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
    )
