import enum
from typing import List, Optional
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class VolunteerStatus(str, enum.Enum):
    """Matches init.sql volunteer_status enum exactly."""
    ACTIVE           = "active"
    INACTIVE         = "inactive"
    PENDING_APPROVAL = "pending_approval"


class Volunteer(Base):
    """
    Volunteer registration record linked to a User account.
    Table: volunteers  (must match init.sql exactly)
    """
    __tablename__ = "volunteers"
    __table_args__ = {"extend_existing": True}

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # TEXT[] in PostgreSQL
    skills: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String), nullable=True, default=list
    )

    availability: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    status: Mapped[VolunteerStatus] = mapped_column(
        SQLEnum(VolunteerStatus, native_enum=False, create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=VolunteerStatus.PENDING_APPROVAL,
    )
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ngo_affiliation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Optional current location
    latitude: Mapped[Optional[float]] = mapped_column(nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        return f"<Volunteer user={self.user_id} status={self.status.value}>"
