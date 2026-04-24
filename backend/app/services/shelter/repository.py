from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.base_repository import BaseRepository
from app.services.shelter.models import Shelter, ShelterStatus, ShelterType


class ShelterRepository(BaseRepository[Shelter]):
    def __init__(self, db: AsyncSession):
        super().__init__(Shelter, db)

    async def get_filtered(
        self,
        type: Optional[ShelterType] = None,
        status: Optional[ShelterStatus] = None,
        capacity_available: Optional[bool] = None,
        bounds_north: Optional[float] = None,
        bounds_south: Optional[float] = None,
        bounds_east: Optional[float] = None,
        bounds_west: Optional[float] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Shelter], int]:
        filters = []
        if type:
            filters.append(Shelter.type == type)
        if status:
            filters.append(Shelter.status == status)
        if capacity_available is True:
            filters.append(Shelter.current_occupancy < Shelter.total_capacity)
            filters.append(Shelter.status == ShelterStatus.OPERATIONAL)
        if all(b is not None for b in [bounds_north, bounds_south, bounds_east, bounds_west]):
            filters.extend([
                Shelter.latitude <= bounds_north,
                Shelter.latitude >= bounds_south,
                Shelter.longitude <= bounds_east,
                Shelter.longitude >= bounds_west,
            ])

        return await self.get_all(
            limit=limit,
            offset=offset,
            filters=filters if filters else None,
            order_by=Shelter.name,
        )

    async def increment_occupancy(self, shelter_id: UUID, delta: int) -> Optional[Shelter]:
        """
        Atomically increment current_occupancy by delta.
        Caps at total_capacity and auto-sets status to 'full' when capacity is reached.
        Returns the updated shelter, or None if not found.
        """
        await self.db.execute(
            text("""
                UPDATE shelters
                SET current_occupancy = LEAST(current_occupancy + :delta, total_capacity),
                    status = CASE
                        WHEN current_occupancy + :delta >= total_capacity THEN 'full'
                        ELSE status::text
                    END::shelter_status,
                    updated_at = NOW()
                WHERE id = :shelter_id
            """),
            {"delta": delta, "shelter_id": str(shelter_id)},
        )
        return await self.get_by_id(shelter_id)
