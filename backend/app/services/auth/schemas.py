from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.services.auth.models import UserRole


# ===========================================
# Request Schemas (Immutable — MIS.md API inputs)
# ===========================================

class LoginRequest(BaseModel):
    """
    MIS.md LoginRequest contract:
        username: string
        password: string
        role:     UserRole   ← required per MIS; used to validate the caller's claimed role
    """
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    role: UserRole = Field(..., description="Caller's role: admin | operator | responder | volunteer | ngo_official")


class RegisterRequest(BaseModel):
    """Admin-only user creation payload."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    # FIX: was a plain str with a hand-rolled validator that duplicated UserRole.
    # Using the enum directly ensures a single source of truth — adding a role
    # to UserRole automatically makes it valid here without touching this file.
    role: UserRole = Field(..., description="Role to assign: admin | operator | responder | volunteer | ngo_official")


class RefreshTokenRequest(BaseModel):
    """MIS.md RefreshRequest contract: refresh_token string."""
    refresh_token: str


# ===========================================
# Response Schemas (Immutable — MIS.md API outputs)
# ===========================================

class TokenResponse(BaseModel):
    """
    MIS.md RefreshResponse contract:
        access_token: string
        expires_in:   number
    The refresh_token is echoed back so callers don't need to re-store it.
    token_type is always "bearer".
    """
    model_config = ConfigDict(from_attributes=True)  # FIX: Pydantic v2 style; class Config is deprecated

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """
    MIS.md LoginResponse.user contract:
        id, username, full_name, role, email?, phone?
    created_at / updated_at added for completeness (present on all Base models).
    """
    model_config = ConfigDict(from_attributes=True)  # FIX: Pydantic v2 style

    id: UUID
    username: str
    full_name: str
    email: Optional[str]
    phone: Optional[str]
    role: UserRole          # FIX: was plain str — should match the model's UserRole type
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LoginResponse(BaseModel):
    """
    MIS.md LoginResponse contract:
        access_token, token_type, expires_in, user
    refresh_token included as per system design token pair pattern.
    """
    model_config = ConfigDict(from_attributes=True)  # FIX: Pydantic v2 style

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse