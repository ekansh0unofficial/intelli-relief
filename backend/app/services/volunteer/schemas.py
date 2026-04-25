from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.services.volunteer.models import VolunteerStatus


# ──────────────────────────────────────────
# Request schemas
# ──────────────────────────────────────────

class VolunteerCreate(BaseModel):
    user_id: UUID
    skills: Optional[List[str]] = Field(default_factory=list)
    ngo_affiliation: Optional[str] = Field(None, max_length=100)


class VolunteerUpdate(BaseModel):
    """PATCH /api/volunteers/{id}"""
    availability: Optional[bool] = None
    skills: Optional[List[str]] = None
    status: Optional[VolunteerStatus] = None
    ngo_affiliation: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class VolunteerFilters(BaseModel):
    status: Optional[VolunteerStatus] = None
    availability: Optional[bool] = None
    skills: Optional[List[str]] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# ──────────────────────────────────────────
# Response schemas
# ──────────────────────────────────────────

class VolunteerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    full_name: str      # enriched by service layer from users table
    email: Optional[str]
    phone: Optional[str]
    skills: Optional[List[str]]
    availability: bool
    status: VolunteerStatus
    verified: bool
    ngo_affiliation: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    created_at: datetime
    updated_at: datetime


class VolunteerListResponse(BaseModel):
    volunteers: List[VolunteerResponse]
    total: int
    limit: int
    offset: int
