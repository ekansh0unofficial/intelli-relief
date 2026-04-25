from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.base_repository import BaseRepository
from app.services.volunteer.models import Volunteer, VolunteerStatus


class VolunteerRepository(BaseRepository[Volunteer]):
    def __init__(self, db: AsyncSession):
        super().__init__(Volunteer, db)

    async def get_by_user_id(self, user_id: UUID) -> Optional[Volunteer]:
        result = await self.db.execute(
            select(Volunteer).where(Volunteer.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def user_is_volunteer(self, user_id: UUID) -> bool:
        vol = await self.get_by_user_id(user_id)
        return vol is not None

    async def get_filtered(
        self,
        status: Optional[VolunteerStatus] = None,
        availability: Optional[bool] = None,
        skills: Optional[List[str]] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Volunteer], int]:
        filters = []
        if status:
            filters.append(Volunteer.status == status)
        if availability is not None:
            filters.append(Volunteer.availability == availability)
        # Skill filter: volunteer must have ALL specified skills (overlap check)
        if skills:
            from sqlalchemy.dialects.postgresql import ARRAY
            from sqlalchemy import String, cast
            for skill in skills:
                # Check if skill is in the TEXT[] array
                filters.append(Volunteer.skills.contains(cast([skill], ARRAY(String))))

        return await self.get_all(
            limit=limit,
            offset=offset,
            filters=filters if filters else None,
            order_by=Volunteer.created_at.desc(),
        )
