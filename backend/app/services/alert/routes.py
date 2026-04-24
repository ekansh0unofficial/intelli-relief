from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import Roles, get_current_user, require_roles
from app.core.database import get_db
from app.services.alert.models import AlertStatus, IncidentType, Severity
from app.services.alert.schemas import (
    AlertCreate,
    AlertFilters,
    AlertInferRequest,
    AlertInferResponse,
    AlertListResponse,
    AlertResponse,
    AlertUpdateCreate,
    AlertUpdateRequest,
    AlertUpdateResponse,
)
from app.services.alert.service import AlertService
from app.services.auth.models import User

router = APIRouter()


@router.get("", response_model=AlertListResponse)
async def list_alerts(
    status: Optional[AlertStatus] = Query(None),
    severity: Optional[Severity] = Query(None),
    incident_type: Optional[IncidentType] = Query(None),
    assigned_to: Optional[UUID] = Query(None),
    created_by: Optional[UUID] = Query(None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    bounds_north: Optional[float] = Query(None),
    bounds_south: Optional[float] = Query(None),
    bounds_east: Optional[float] = Query(None),
    bounds_west: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ALL_AUTHENTICATED)),
):
    """List alerts with optional filters. All authenticated roles."""
    service = AlertService(db)
    filters = AlertFilters(
        status=status,
        severity=severity,
        incident_type=incident_type,
        assigned_to=assigned_to,
        created_by=created_by,
        limit=limit,
        offset=offset,
        bounds_north=bounds_north,
        bounds_south=bounds_south,
        bounds_east=bounds_east,
        bounds_west=bounds_west,
    )
    return await service.list_alerts(filters)


@router.post("/infer", response_model=AlertInferResponse)
async def infer_alert_fields(
    data: AlertInferRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_OPERATOR)),
):
    """
    Preview inferred alert fields (title, type, severity, coordinates) from a
    description + address. No database writes. Use before POST /api/alerts.
    """
    service = AlertService(db)
    return await service.infer_alert(data)


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    data: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ADMIN_OPERATOR)),
):
    """Create a new alert. Admin and Operator only."""
    service = AlertService(db)
    return await service.create_alert(data, current_user)


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ALL_AUTHENTICATED)),
):
    """Get alert by ID with full update timeline."""
    service = AlertService(db)
    return await service.get_alert(alert_id)


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: UUID,
    data: AlertUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.FIELD_ROLES)),
):
    """Update alert status, severity, or assignment. Admin, Operator, Responder."""
    service = AlertService(db)
    return await service.update_alert(alert_id, data, current_user)


@router.post(
    "/{alert_id}/updates",
    response_model=AlertUpdateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_alert_update(
    alert_id: UUID,
    data: AlertUpdateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.FIELD_ROLES)),
):
    """Add a timeline update (status change or comment). Admin, Operator, Responder."""
    service = AlertService(db)
    return await service.add_update(alert_id, data, current_user)
