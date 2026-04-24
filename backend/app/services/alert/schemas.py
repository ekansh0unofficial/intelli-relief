from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.services.alert.models import AlertStatus, IncidentType, Severity


# ──────────────────────────────────────────
# Request schemas
# ──────────────────────────────────────────

class AlertCreate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=100)
    description: str = Field(..., min_length=20, max_length=1000)
    incident_type: Optional[IncidentType] = None
    severity: Optional[Severity] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    address: Optional[str] = None
    caller_name: Optional[str] = Field(None, max_length=100)
    caller_phone: Optional[str] = Field(None, max_length=20)

    @model_validator(mode="after")
    def coords_or_address_required(self) -> "AlertCreate":
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Both 'latitude' and 'longitude' must be provided together.")
        if self.latitude is None and not self.address:
            raise ValueError(
                "Either 'address' or both 'latitude' and 'longitude' must be provided."
            )
        return self


class AlertUpdateRequest(BaseModel):
    """PATCH /api/alerts/{id} — all fields optional."""
    status: Optional[AlertStatus] = None
    severity: Optional[Severity] = None
    description: Optional[str] = Field(None, max_length=1000)
    assigned_to: Optional[UUID] = None
    notes: Optional[str] = None
    address: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class AlertUpdateCreate(BaseModel):
    """POST /api/alerts/{id}/updates — add a timeline entry."""
    update_text: str = Field(..., min_length=10, max_length=2000)
    status_change: Optional[AlertStatus] = None


class AlertFilters(BaseModel):
    status: Optional[AlertStatus] = None
    severity: Optional[Severity] = None
    incident_type: Optional[IncidentType] = None
    assigned_to: Optional[UUID] = None
    created_by: Optional[UUID] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    bounds_north: Optional[float] = None
    bounds_south: Optional[float] = None
    bounds_east: Optional[float] = None
    bounds_west: Optional[float] = None


class AlertInferRequest(BaseModel):
    description: str = Field(..., min_length=20, max_length=1000)
    address: Optional[str] = None


class AlertInferResponse(BaseModel):
    title: str
    incident_type: IncidentType
    severity: Severity
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geocoding_succeeded: bool = False


# ──────────────────────────────────────────
# Response schemas
# ──────────────────────────────────────────

class AlertUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    alert_id: UUID
    user_id: UUID
    user_name: str
    user_role: str
    update_text: str
    status_before: Optional[str]
    status_after: Optional[str]
    created_at: datetime


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    incident_type: IncidentType
    severity: Severity
    status: AlertStatus
    latitude: float
    longitude: float
    address: Optional[str]
    caller_name: Optional[str]
    caller_phone: Optional[str]

    created_by: UUID
    created_by_name: str
    assigned_to: Optional[UUID]
    assigned_to_name: Optional[str]

    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]

    updates: List[AlertUpdateResponse] = []


class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    total: int
    limit: int
    offset: int
