from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import Roles, get_current_user, require_roles
from app.core.database import get_db
from app.services.assignment.models import AssignmentStatus
from app.services.assignment.schemas import (
    AssignmentCreate,
    AssignmentFilters,
    AssignmentListResponse,
    AssignmentResponse,
    AssignmentStatusUpdate,
    AssignmentUpdateRequest,
)
from app.services.assignment.service import AssignmentService
from app.services.auth.models import User

router = APIRouter()


@router.get("", response_model=AssignmentListResponse)
async def list_assignments(
    status: Optional[AssignmentStatus] = Query(None),
    responder_id: Optional[UUID] = Query(None),
    alert_id: Optional[UUID] = Query(None),
    assigned_by: Optional[UUID] = Query(None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.FIELD_ROLES)),
):
    """List assignments with optional filters."""
    service = AssignmentService(db)
    filters = AssignmentFilters(
        status=status,
        responder_id=responder_id,
        alert_id=alert_id,
        assigned_by=assigned_by,
        limit=limit,
        offset=offset,
    )
    return await service.list_assignments(filters)


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    data: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_OPERATOR)),
):
    """Assign a responder to an alert. Admin and Operator only."""
    service = AssignmentService(db)
    return await service.create_assignment(data, current_user)


@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.FIELD_ROLES)),
):
    """Get assignment by ID."""
    service = AssignmentService(db)
    return await service.get_assignment(assignment_id)


@router.patch("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: UUID,
    data: AssignmentUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_OPERATOR)),
):
    """Update assignment notes or ETA. Admin and Operator only."""
    service = AssignmentService(db)
    return await service.update_assignment(assignment_id, data, current_user)


@router.post("/{assignment_id}/status", response_model=AssignmentResponse)
async def update_assignment_status(
    assignment_id: UUID,
    data: AssignmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.FIELD_ROLES)),
):
    """Update assignment status (en_route, on_scene, completed, etc.)."""
    service = AssignmentService(db)
    return await service.update_status(assignment_id, data, current_user)
