from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from datetime import datetime
from typing import AsyncGenerator
from uuid import UUID, uuid4

from app.core.config import settings

# FIX: the original code called .replace("postgresql://", "postgresql+asyncpg://")
# on a URL that already contains "postgresql+asyncpg://" (as set in .env and config.py).
# The replace() was a no-op at best; on a plain "postgresql://" URL it would have
# produced "postgresql+asyncpg+asyncpg://" — a malformed URL that crashes on startup.
# Use the URL from settings directly; the driver prefix is already correct.
DATABASE_URL = settings.DATABASE_URL


# ========================
# Engine
# ========================
engine = create_async_engine(
    DATABASE_URL,
    # FIX: was `echo=settings.DEBUG` — DEBUG controls app verbosity, not SQL logging.
    # SQL_ECHO is the dedicated setting for SQLAlchemy query logging and defaults
    # to False in config.py so production is always quiet regardless of DEBUG.
    echo=settings.SQL_ECHO,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # test connections before use
)


# ========================
# Session factory
# ========================
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # keep objects usable after commit
    autocommit=False,
    autoflush=False,
)


# ========================
# Base model
# ========================
class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    Automatically provides id, created_at, updated_at on every table.
    """
    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ========================
# FastAPI dependency
# ========================
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yields one database session per request.
    Commits on success, rolls back on any exception, always closes.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()