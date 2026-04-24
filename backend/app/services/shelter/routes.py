from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import Roles, require_roles
from app.core.database import get_db
from app.services.auth.models import User
from app.services.shelter.models import ShelterStatus, ShelterType
from app.services.shelter.schemas import (
    ShelterCreate,
    ShelterFilters,
    ShelterListResponse,
    ShelterResponse,
    ShelterUpdate,
)
from app.services.shelter.service import ShelterService

router = APIRouter()


@router.get("", response_model=ShelterListResponse)
async def list_shelters(
    type: Optional[ShelterType] = Query(None),
    status: Optional[ShelterStatus] = Query(None),
    capacity_available: Optional[bool] = Query(None),
    bounds_north: Optional[float] = Query(None),
    bounds_south: Optional[float] = Query(None),
    bounds_east: Optional[float] = Query(None),
    bounds_west: Optional[float] = Query(None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ALL_AUTHENTICATED)),
):
    """List shelters with optional filters. All authenticated roles."""
    service = ShelterService(db)
    filters = ShelterFilters(
        type=type,
        status=status,
        capacity_available=capacity_available,
        bounds_north=bounds_north,
        bounds_south=bounds_south,
        bounds_east=bounds_east,
        bounds_west=bounds_west,
        limit=limit,
        offset=offset,
    )
    return await service.list_shelters(filters)


@router.post("", response_model=ShelterResponse, status_code=status.HTTP_201_CREATED)
async def create_shelter(
    data: ShelterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_ONLY)),
):
    """Create a new shelter. Admin only."""
    service = ShelterService(db)
    return await service.create_shelter(data, current_user)


@router.get("/{shelter_id}", response_model=ShelterResponse)
async def get_shelter(
    shelter_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ALL_AUTHENTICATED)),
):
    """Get shelter by ID."""
    service = ShelterService(db)
    return await service.get_shelter(shelter_id)


@router.patch("/{shelter_id}", response_model=ShelterResponse)
async def update_shelter(
    shelter_id: UUID,
    data: ShelterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_OPERATOR)),
):
    """Update shelter occupancy, status, or details. Admin and Operator only."""
    service = ShelterService(db)
    return await service.update_shelter(shelter_id, data, current_user)
