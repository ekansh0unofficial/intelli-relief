import enum
from typing import List, Optional
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ShelterType(str, enum.Enum):
    """Matches init.sql shelter_type enum exactly."""
    SCHOOL           = "school"
    COMMUNITY_CENTER = "community_center"
    STADIUM          = "stadium"
    TEMPORARY        = "temporary"
    OTHER            = "other"


class ShelterStatus(str, enum.Enum):
    """Matches init.sql shelter_status enum exactly."""
    OPERATIONAL = "operational"
    FULL        = "full"
    CLOSED      = "closed"
    DAMAGED     = "damaged"


class Shelter(Base):
    """
    Evacuation shelter / safe zone.
    Table: shelters  (must match init.sql exactly)
    """
    __tablename__ = "shelters"
    __table_args__ = {"extend_existing": True}

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[ShelterType] = mapped_column(
        SQLEnum(ShelterType, native_enum=False, create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    address: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[float] = mapped_column(nullable=False)
    longitude: Mapped[float] = mapped_column(nullable=False)

    total_capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    current_occupancy: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # TEXT[] in PostgreSQL
    facilities: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String), nullable=True, default=list
    )

    contact_person: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    status: Mapped[ShelterStatus] = mapped_column(
        SQLEnum(ShelterStatus, native_enum=False, create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=ShelterStatus.OPERATIONAL,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_by: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    @property
    def available_capacity(self) -> int:
        return max(0, self.total_capacity - self.current_occupancy)

    def __repr__(self) -> str:
        return f"<Shelter {self.name} [{self.status.value}] {self.current_occupancy}/{self.total_capacity}>"
