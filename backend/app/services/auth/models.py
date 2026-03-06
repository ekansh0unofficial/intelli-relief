from sqlalchemy import String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """
    Immutable - do NOT rename these values.
    Must match init.sql enum and MIS.md
    """
    ADMIN = "admin"
    OPERATOR = "operator"
    RESPONDER = "responder"
    VOLUNTEER = "volunteer"
    NGO_OFFICIAL = "ngo_official"


class User(Base):
    """
    User model - authentication and authorization.

    Table: users  (must match init.sql exactly — lowercase)

    Immutable fields (MIS.md §Database Schema):
        id, created_at, updated_at  — inherited from Base
        username, password_hash, full_name, email, phone, role, is_active
    """

    __tablename__ = "users"  # FIX: was "Users" — PostgreSQL is case-sensitive; init.sql defines "users"

    __table_args__ = {'extend_existing': True}

    # =============
    # Credentials
    # =============
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # ==============
    # Profile
    # ==============
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(100),
        nullable=True
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=True
    )

    # ================
    # Access Control
    # ================
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, native_enum=False, create_type=False),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role.value})>"