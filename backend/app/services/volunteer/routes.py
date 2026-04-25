from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import Roles, require_roles
from app.core.database import get_db
from app.services.auth.models import User
from app.services.volunteer.models import VolunteerStatus
from app.services.volunteer.schemas import (
    VolunteerCreate,
    VolunteerFilters,
    VolunteerListResponse,
    VolunteerResponse,
    VolunteerUpdate,
)
from app.services.volunteer.service import VolunteerService

router = APIRouter()


@router.get("", response_model=VolunteerListResponse)
async def list_volunteers(
    status: Optional[VolunteerStatus] = Query(None),
    availability: Optional[bool] = Query(None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.FIELD_ROLES)),
):
    """List volunteers with optional filters."""
    service = VolunteerService(db)
    filters = VolunteerFilters(
        status=status,
        availability=availability,
        limit=limit,
        offset=offset,
    )
    return await service.list_volunteers(filters)


@router.post("", response_model=VolunteerResponse, status_code=status.HTTP_201_CREATED)
async def register_volunteer(
    data: VolunteerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_OPERATOR)),
):
    """Register a user as a volunteer. Admin and Operator only."""
    service = VolunteerService(db)
    return await service.register_volunteer(data, current_user)


@router.get("/{volunteer_id}", response_model=VolunteerResponse)
async def get_volunteer(
    volunteer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.FIELD_ROLES)),
):
    """Get volunteer by ID."""
    service = VolunteerService(db)
    return await service.get_volunteer(volunteer_id)


@router.patch("/{volunteer_id}", response_model=VolunteerResponse)
async def update_volunteer(
    volunteer_id: UUID,
    data: VolunteerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_OPERATOR)),
):
    """Update volunteer availability, skills, or status."""
    service = VolunteerService(db)
    return await service.update_volunteer(volunteer_id, data, current_user)


@router.post("/{volunteer_id}/approve", response_model=VolunteerResponse)
async def approve_volunteer(
    volunteer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_ONLY)),
):
    """Approve a pending volunteer registration. Admin only."""
    service = VolunteerService(db)
    return await service.approve_volunteer(volunteer_id, current_user)
