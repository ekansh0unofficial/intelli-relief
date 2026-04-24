from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.services.shelter.models import ShelterStatus, ShelterType


# ──────────────────────────────────────────
# Request schemas
# ──────────────────────────────────────────

class ShelterCreate(BaseModel):
    name: str = Field(..., min_length=5, max_length=100)
    type: ShelterType
    address: str = Field(..., min_length=5, max_length=500)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    total_capacity: int = Field(..., gt=0)
    current_occupancy: int = Field(default=0, ge=0)
    facilities: Optional[List[str]] = Field(default_factory=list)
    contact_person: Optional[str] = Field(None, max_length=100)
    contact_phone: Optional[str] = Field(None, max_length=20)
    status: ShelterStatus = ShelterStatus.OPERATIONAL
    notes: Optional[str] = None


class ShelterUpdate(BaseModel):
    """PATCH /api/shelters/{id} — all fields optional."""
    current_occupancy: Optional[int] = Field(None, ge=0)
    status: Optional[ShelterStatus] = None
    notes: Optional[str] = None
    facilities: Optional[List[str]] = None
    contact_person: Optional[str] = Field(None, max_length=100)
    contact_phone: Optional[str] = Field(None, max_length=20)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class ShelterFilters(BaseModel):
    type: Optional[ShelterType] = None
    status: Optional[ShelterStatus] = None
    capacity_available: Optional[bool] = None
    bounds_north: Optional[float] = None
    bounds_south: Optional[float] = None
    bounds_east: Optional[float] = None
    bounds_west: Optional[float] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# ──────────────────────────────────────────
# Response schemas
# ──────────────────────────────────────────

class ShelterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: ShelterType
    address: str
    latitude: float
    longitude: float
    total_capacity: int
    current_occupancy: int
    available_capacity: int   # computed: total - current
    facilities: Optional[List[str]]
    contact_person: Optional[str]
    contact_phone: Optional[str]
    status: ShelterStatus
    notes: Optional[str]
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class ShelterListResponse(BaseModel):
    shelters: List[ShelterResponse]
    total: int
    limit: int
    offset: int
