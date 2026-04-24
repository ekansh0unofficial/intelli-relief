import enum
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class IncidentType(str, enum.Enum):
    """Matches init.sql incident_type enum exactly — do NOT rename values."""
    FLOOD     = "flood"
    FIRE      = "fire"
    EARTHQUAKE = "earthquake"
    ACCIDENT  = "accident"
    MEDICAL   = "medical"
    RESCUE    = "rescue"
    LANDSLIDE = "landslide"
    CYCLONE   = "cyclone"
    OTHER     = "other"


class Severity(str, enum.Enum):
    """Matches init.sql severity enum exactly."""
    LOW      = "low"
    MEDIUM   = "medium"
    HIGH     = "high"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    """Matches init.sql alert_status enum exactly."""
    PENDING     = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED    = "resolved"
    CANCELLED   = "cancelled"


class Alert(Base):
    """
    Emergency help alert logged by an operator.
    Table: alerts  (must match init.sql exactly)
    """
    __tablename__ = "alerts"
    __table_args__ = {"extend_existing": True}

    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    incident_type: Mapped[IncidentType] = mapped_column(
        SQLEnum(IncidentType, native_enum=False, create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    severity: Mapped[Severity] = mapped_column(
        SQLEnum(Severity, native_enum=False, create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    status: Mapped[AlertStatus] = mapped_column(
        SQLEnum(AlertStatus, native_enum=False, create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=AlertStatus.PENDING,
    )

    latitude: Mapped[float] = mapped_column(nullable=False)
    longitude: Mapped[float] = mapped_column(nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    caller_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    caller_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    created_by: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    assigned_to: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    updates: Mapped[List["AlertUpdate"]] = relationship(
        "AlertUpdate",
        back_populates="alert",
        cascade="all, delete-orphan",
        order_by="AlertUpdate.created_at",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Alert {self.id} [{self.severity.value}] {self.status.value}>"


class AlertUpdate(Base):
    """
    Timeline entry on an alert — status changes, progress notes, comments.
    Table: alert_updates  (must match init.sql exactly)
    """
    __tablename__ = "alert_updates"
    __table_args__ = {"extend_existing": True}

    alert_id: Mapped[UUID] = mapped_column(
        ForeignKey("alerts.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    update_text: Mapped[str] = mapped_column(Text, nullable=False)
    status_before: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    status_after: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    alert: Mapped["Alert"] = relationship("Alert", back_populates="updates")

    def __repr__(self) -> str:
        return f"<AlertUpdate {self.id} alert={self.alert_id}>"
