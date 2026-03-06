from datetime import datetime, timedelta, timezone
from typing import Optional, Literal
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

# ========================
# Password hashing
# ========================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme — tokenUrl must match the mounted router prefix exactly
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


# ========================
# Internal token models
# ========================
class TokenData(BaseModel):
    """Claims extracted from a validated JWT."""
    user_id: str
    username: str
    role: str
    type: str   # FIX: "type" claim was missing from TokenData — service.py calls
                # getattr(token_data, "type", None) to distinguish access vs refresh tokens;
                # without this field that guard can never work correctly.


class TokenResponse(BaseModel):
    """Immutable shape of login/refresh response (internal use in auth.py only)."""
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"]
    expires_in: int


# ========================
# Password helpers
# ========================
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ========================
# JWT helpers
# ========================
def create_access_token(
    user_id: str,
    username: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: str, username: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> TokenData:
    """
    Decode and validate a JWT.
    Returns TokenData on success; raises HTTP 401 on any failure.

    NOTE: does NOT enforce token type here — callers (service.py) are
    responsible for checking token_data.type == "refresh" where required.
    This keeps decode_token single-purpose and independently testable.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: Optional[str] = payload.get("sub")
        username: Optional[str] = payload.get("username")
        role: Optional[str] = payload.get("role")
        token_type: Optional[str] = payload.get("type")   # FIX: extract "type" claim

        if not user_id or not username or not role or not token_type:
            raise credentials_exception

        return TokenData(
            user_id=user_id,
            username=username,
            role=role,
            type=token_type,   # FIX: populate the new field
        )
    except JWTError:
        raise credentials_exception


# ========================
# FastAPI dependencies
# ========================
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Dependency: validates the Bearer token and returns the active User.
    Enforces that the token is an access token — refresh tokens are
    rejected here so they cannot be used to authenticate requests.

    Usage:
        async def my_route(user: User = Depends(get_current_user)): ...
    """
    # Import here to avoid circular import at module load time
    from app.services.auth.models import User

    token_data = decode_token(token)

    # FIX: reject refresh tokens from being used as access tokens on protected routes.
    # Without this check any valid refresh token would grant full API access.
    if token_data.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type: access token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(
        select(User).where(
            User.id == UUID(token_data.user_id),
            User.is_active == True,  # noqa: E712
        )
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or is inactive",   # FIX: was " User not found..." (leading space)
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(*allowed_roles: str):
    """
    RBAC dependency factory.

    Usage:
        current_user: User = Depends(require_roles(Roles.ADMIN, Roles.OPERATOR))
    """
    async def role_checker(user=Depends(get_current_user)):
        if user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {list(allowed_roles)}",
            )
        return user
    return role_checker


# ========================
# Role constants
# ========================
class Roles:
    """
    IMMUTABLE — do not rename any constant.
    Values must match UserRole enum in models.py exactly.
    Used in require_roles() calls across all route files.
    """
    # Individual roles
    ADMIN        = "admin"
    OPERATOR     = "operator"
    RESPONDER    = "responder"
    VOLUNTEER    = "volunteer"
    NGO_OFFICIAL = "ngo_official"

    # Common groupings — pass these with * unpacking:
    #   Depends(require_roles(*Roles.ADMIN_OPERATOR))
    ADMIN_ONLY        = ("admin",)
    ADMIN_OPERATOR    = ("admin", "operator")
    FIELD_ROLES       = ("admin", "operator", "responder")
    ALL_AUTHENTICATED = ("admin", "operator", "responder", "volunteer", "ngo_official")