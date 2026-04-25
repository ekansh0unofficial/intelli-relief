from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import Roles, require_roles
from app.core.database import get_db
from app.services.auth.models import User, UserRole
from app.services.users.schemas import UserDetailResponse, UserListResponse, UserUpdate
from app.services.users.service import UserManagementService

router = APIRouter()


@router.get("", response_model=UserListResponse)
async def list_users(
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_ONLY)),
):
    """List all users. Admin only."""
    service = UserManagementService(db)
    return await service.list_users(role=role, is_active=is_active, limit=limit, offset=offset)


@router.get("/responders", response_model=UserListResponse)
async def list_responders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_OPERATOR)),
):
    """List all active responders. Accessible to Admin and Operator."""
    service = UserManagementService(db)
    return await service.list_users(role=UserRole.RESPONDER, is_active=True, limit=100, offset=0)


@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_ONLY)),
):
    """Get user by ID. Admin only."""
    service = UserManagementService(db)
    return await service.get_user(user_id)


@router.patch("/{user_id}", response_model=UserDetailResponse)
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_ONLY)),
):
    """Update user profile or role. Admin only."""
    service = UserManagementService(db)
    return await service.update_user(user_id, data, current_user)


@router.delete("/{user_id}", response_model=UserDetailResponse)
async def deactivate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_ONLY)),
):
    """Deactivate a user account (soft delete). Admin only."""
    service = UserManagementService(db)
    return await service.deactivate_user(user_id, current_user)
