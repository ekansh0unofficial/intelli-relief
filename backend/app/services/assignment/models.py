import enum
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AssignmentStatus(str, enum.Enum):
    """Matches init.sql assignment_status enum exactly."""
    PENDING      = "pending"
    ACKNOWLEDGED = "acknowledged"
    EN_ROUTE     = "en_route"
    ON_SCENE     = "on_scene"
    COMPLETED    = "completed"
    CANCELLED    = "cancelled"


class Priority(str, enum.Enum):
    """Matches init.sql priority enum exactly."""
    LOW    = "low"
    MEDIUM = "medium"
    HIGH   = "high"
    URGENT = "urgent"


class Assignment(Base):
    """
    Responder assignment to an alert.
    Table: assignments  (must match init.sql exactly)
    """
    __tablename__ = "assignments"
    __table_args__ = {"extend_existing": True}

    alert_id: Mapped[UUID] = mapped_column(
        ForeignKey("alerts.id", ondelete="CASCADE"),
        nullable=False,
    )
    responder_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    priority: Mapped[Priority] = mapped_column(
        SQLEnum(Priority, native_enum=False, create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    status: Mapped[AssignmentStatus] = mapped_column(
        SQLEnum(AssignmentStatus, native_enum=False, create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=AssignmentStatus.PENDING,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    assigned_by: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Business timestamps (separate from Base created_at/updated_at)
    assigned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    estimated_arrival: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<Assignment {self.id} alert={self.alert_id} responder={self.responder_id}>"
