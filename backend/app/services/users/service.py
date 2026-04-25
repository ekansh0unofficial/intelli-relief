from typing import Optional
from uuid import UUID

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.event_bus import DomainEvent, Events, event_bus
from app.core.exceptions import NotFoundException
from app.services.auth.models import User, UserRole
from app.services.auth.repository import UserRepository
from app.services.users.repository import UserManagementRepository
from app.services.users.schemas import UserDetailResponse, UserListResponse, UserUpdate


class UserManagementService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserManagementRepository(db)

    def _build_response(self, user: User) -> UserDetailResponse:
        return UserDetailResponse(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    async def list_users(
        self,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> UserListResponse:
        users, total = await self.repo.get_filtered(
            role=role,
            is_active=is_active,
            limit=limit,
            offset=offset,
        )
        return UserListResponse(
            users=[self._build_response(u) for u in users],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_user(self, user_id: UUID) -> UserDetailResponse:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User", str(user_id))
        return self._build_response(user)

    async def update_user(
        self, user_id: UUID, data: UserUpdate, current_user: User
    ) -> UserDetailResponse:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User", str(user_id))

        updates = {}
        if data.full_name is not None:
            updates["full_name"] = data.full_name
        if data.email is not None:
            updates["email"] = data.email
        if data.phone is not None:
            updates["phone"] = data.phone
        if data.role is not None:
            updates["role"] = data.role
        if data.is_active is not None:
            updates["is_active"] = data.is_active

        if updates:
            user = await self.repo.update(user_id, updates)
            await self.db.commit()

            await event_bus.publish(DomainEvent(
                event_type=Events.AUTH_USER_CREATED,  # Reuse closest event; extend catalog later
                payload={
                    "user_id": str(user_id),
                    "updated_by": str(current_user.id),
                    "changes": list(updates.keys()),
                },
            ))
            logger.info("User {} updated by {}", user_id, current_user.username)

        return self._build_response(user)

    async def deactivate_user(
        self, user_id: UUID, current_user: User
    ) -> UserDetailResponse:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User", str(user_id))

        user = await self.repo.update(user_id, {"is_active": False})
        await self.db.commit()
        logger.info("User {} deactivated by {}", user_id, current_user.username)
        return self._build_response(user)
