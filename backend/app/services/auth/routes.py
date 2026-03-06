from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles, Roles
from app.services.auth.models import User
from app.services.auth.schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth.service import AuthService

router = APIRouter()


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    credentials: LoginRequest,       # FIX: was "credentails" (typo)
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user with username, password, and role.
    Returns JWT access and refresh tokens.

    MIS.md: POST /api/auth/login
    """
    service = AuthService(db)        # FIX: was "services" (inconsistent plural)
    return await service.login(credentials)


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
# FIX: was HTTP_201_CREATED — a token refresh returns existing data, not a new resource.
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a new access token using a valid refresh token.

    MIS.md: POST /api/auth/refresh
    """
    service = AuthService(db)
    return await service.refresh_access_token(request.refresh_token)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Roles.ADMIN)),
):
    """
    Create a new user account.
    Admin access required.

    MIS.md: (admin operation — part of UserAccessService)
    """
    service = AuthService(db)
    return await service.register(data)


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """
    Return the currently authenticated user's profile.
    Requires a valid JWT access token.

    MIS.md: (uses AuthState.user shape)
    """
    return UserResponse.model_validate(current_user)