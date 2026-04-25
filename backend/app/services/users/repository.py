from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.base_repository import BaseRepository
from app.services.auth.models import User, UserRole


class UserManagementRepository(BaseRepository[User]):
    """
    Admin user management data access.
    Reuses the User model from auth service — no separate model needed.
    """

    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_filtered(
        self,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[User], int]:
        filters = []
        if role:
            filters.append(User.role == role)
        if is_active is not None:
            filters.append(User.is_active == is_active)

        return await self.get_all(
            limit=limit,
            offset=offset,
            filters=filters if filters else None,
            order_by=User.created_at.desc(),
        )
