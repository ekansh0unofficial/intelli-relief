from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.services.assignment.models import AssignmentStatus, Priority


# ──────────────────────────────────────────
# Request schemas
# ──────────────────────────────────────────

class AssignmentCreate(BaseModel):
    alert_id: UUID
    responder_id: UUID
    priority: Priority
    notes: Optional[str] = Field(None, max_length=2000)
    estimated_arrival: Optional[datetime] = None


class AssignmentStatusUpdate(BaseModel):
    """POST /api/assignments/{id}/status"""
    status: AssignmentStatus
    notes: Optional[str] = Field(None, max_length=2000)
    location: Optional[dict] = None
    shelter_id: Optional[UUID] = None          # Where victims are being taken (COMPLETED only)
    victim_count: int = Field(default=1, ge=1) # How many people are being sheltered


class AssignmentUpdateRequest(BaseModel):
    """PATCH /api/assignments/{id}"""
    status: Optional[AssignmentStatus] = None
    notes: Optional[str] = Field(None, max_length=2000)
    estimated_arrival: Optional[datetime] = None


class AssignmentFilters(BaseModel):
    status: Optional[AssignmentStatus] = None
    responder_id: Optional[UUID] = None
    alert_id: Optional[UUID] = None
    assigned_by: Optional[UUID] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# ──────────────────────────────────────────
# Response schemas
# ──────────────────────────────────────────

class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    alert_id: UUID
    alert_title: str        # enriched by service layer
    alert_location: dict    # {"latitude": float, "longitude": float}

    responder_id: UUID
    responder_name: str     # enriched by service layer
    responder_unit: Optional[str]  # enriched by service layer

    priority: Priority
    status: AssignmentStatus
    notes: Optional[str]

    assigned_by: UUID
    assigned_by_name: str   # enriched by service layer

    assigned_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    estimated_arrival: Optional[datetime]

    created_at: datetime
    updated_at: datetime


class AssignmentListResponse(BaseModel):
    assignments: List[AssignmentResponse]
    total: int
    limit: int
    offset: int
