from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings
from app.core.event_bus import event_bus, DomainEvent, Events
from app.core.exceptions import (
    UnauthorizedException,
    ConflictException,
    # FIX: removed unused NotFoundException import
)
from app.services.auth.models import User, UserRole
from app.services.auth.repository import UserRepository
from app.services.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    LoginResponse,
    TokenResponse,
    UserResponse,
)


class AuthService:
    """
    Authentication business logic.

    Responsibilities:
        - User login with password verification
        - User registration (admin only)
        - JWT token generation and refresh
        - Publishing auth domain events to EventBus
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserRepository(db)

    async def login(self, credentials: LoginRequest) -> LoginResponse:
        """
        Authenticate user and return JWT tokens.

        MIS.md events published:
            auth.login_success  →  { user_id, username, role }
        """
        user = await self.repo.get_by_username(credentials.username)

        if not user:
            logger.warning("Login attempt with non-existent username: {}", credentials.username)
            raise UnauthorizedException("Incorrect username or password")

        if not user.is_active:
            logger.warning("Login attempt for inactive user: {}", credentials.username)
            raise UnauthorizedException("Account is inactive")

        if not verify_password(credentials.password, user.password_hash):
            logger.warning("Login attempt with wrong password: {}", credentials.username)
            raise UnauthorizedException("Incorrect username or password")

        # MIS.md LoginRequest carries role — validate it matches the stored role.
        # This prevents a lower-privilege user from claiming a higher role at login.
        if credentials.role != user.role:
            logger.warning(
                "Login role mismatch for {}: claimed {}, actual {}",
                credentials.username,
                credentials.role.value,
                user.role.value,
            )
            raise UnauthorizedException("Incorrect username or password")

        access_token = create_access_token(
            user_id=str(user.id),
            username=user.username,
            role=user.role.value,
        )
        refresh_token = create_refresh_token(
            user_id=str(user.id),
            username=user.username,
            role=user.role.value,
        )

        await event_bus.publish(
            DomainEvent(
                event_type=Events.AUTH_LOGIN_SUCCESS,
                payload={
                    "user_id": str(user.id),
                    "username": user.username,
                    "role": user.role.value,
                },
            )
        )

        logger.info("User logged in: {} ({})", user.username, user.role.value)

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    async def register(self, data: RegisterRequest) -> UserResponse:
        """
        Create a new user account. Only callable by admins (enforced in routes).

        MIS.md events published:
            auth.user_created  →  { user_id, username, role }
        """
        if await self.repo.username_exists(data.username):
            raise ConflictException(f"Username '{data.username}' is already taken")

        if data.email and await self.repo.email_exists(data.email):
            raise ConflictException(f"Email '{data.email}' is already registered")

        user = await self.repo.create(
            username=data.username,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            role=UserRole(data.role),
            is_active=True,
        )

        # FIX: was missing — system design defines UserCreated event; publish it so
        # future subscribers (NotificationService, etc.) work without code changes here.
        await event_bus.publish(
            DomainEvent(
                event_type=Events.AUTH_USER_CREATED,
                payload={
                    "user_id": str(user.id),
                    "username": user.username,
                    "role": user.role.value,
                },
            )
        )

        logger.info("New user created: {} ({})", user.username, user.role.value)
        return UserResponse.model_validate(user)

    async def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """
        Issue a new access token from a valid refresh token.

        FIX: now validates the decoded token carries type == "refresh" so an
        access token cannot be passed here to silently obtain a new access token.
        """
        try:
            token_data = decode_token(refresh_token)
        except Exception:
            raise UnauthorizedException("Invalid or expired refresh token")

        # FIX: guard against an access token being passed as a refresh token.
        # decode_token must embed a 'type' claim; create_refresh_token sets type="refresh".
        if getattr(token_data, "type", None) != "refresh":
            raise UnauthorizedException("Invalid token type: refresh token required")

        user = await self.repo.get_by_id(UUID(token_data.user_id))
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        access_token = create_access_token(
            user_id=str(user.id),
            username=user.username,
            role=user.role.value,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Fetch user by ID. Used by get_current_user dependency."""
        return await self.repo.get_by_id(user_id)