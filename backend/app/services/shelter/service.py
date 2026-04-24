from uuid import UUID

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.event_bus import DomainEvent, Events, event_bus
from app.core.exceptions import NotFoundException, ValidationException
from app.services.auth.models import User
from app.services.shelter.models import Shelter, ShelterStatus
from app.services.shelter.repository import ShelterRepository
from app.services.shelter.schemas import (
    ShelterCreate,
    ShelterFilters,
    ShelterListResponse,
    ShelterResponse,
    ShelterUpdate,
)


class ShelterService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ShelterRepository(db)

    def _build_response(self, s: Shelter) -> ShelterResponse:
        return ShelterResponse(
            id=s.id,
            name=s.name,
            type=s.type,
            address=s.address,
            latitude=s.latitude,
            longitude=s.longitude,
            total_capacity=s.total_capacity,
            current_occupancy=s.current_occupancy,
            available_capacity=s.available_capacity,
            facilities=s.facilities or [],
            contact_person=s.contact_person,
            contact_phone=s.contact_phone,
            status=s.status,
            notes=s.notes,
            created_by=s.created_by,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )

    async def create_shelter(
        self, data: ShelterCreate, current_user: User
    ) -> ShelterResponse:
        if data.current_occupancy > data.total_capacity:
            raise ValidationException(
                "current_occupancy cannot exceed total_capacity"
            )
        shelter = await self.repo.create(
            name=data.name,
            type=data.type,
            address=data.address,
            latitude=data.latitude,
            longitude=data.longitude,
            total_capacity=data.total_capacity,
            current_occupancy=data.current_occupancy,
            facilities=data.facilities or [],
            contact_person=data.contact_person,
            contact_phone=data.contact_phone,
            status=data.status,
            notes=data.notes,
            created_by=current_user.id,
        )
        await self.db.commit()

        await event_bus.publish(DomainEvent(
            event_type=Events.SHELTER_CREATED,
            payload={"shelter_id": str(shelter.id), "name": shelter.name},
        ))
        logger.info("Shelter created: {} by {}", shelter.name, current_user.username)
        return self._build_response(shelter)

    async def list_shelters(self, filters: ShelterFilters) -> ShelterListResponse:
        shelters, total = await self.repo.get_filtered(
            type=filters.type,
            status=filters.status,
            capacity_available=filters.capacity_available,
            bounds_north=filters.bounds_north,
            bounds_south=filters.bounds_south,
            bounds_east=filters.bounds_east,
            bounds_west=filters.bounds_west,
            limit=filters.limit,
            offset=filters.offset,
        )
        return ShelterListResponse(
            shelters=[self._build_response(s) for s in shelters],
            total=total,
            limit=filters.limit,
            offset=filters.offset,
        )

    async def get_shelter(self, shelter_id: UUID) -> ShelterResponse:
        s = await self.repo.get_by_id(shelter_id)
        if not s:
            raise NotFoundException("Shelter", str(shelter_id))
        return self._build_response(s)

    async def update_shelter(
        self, shelter_id: UUID, data: ShelterUpdate, current_user: User
    ) -> ShelterResponse:
        s = await self.repo.get_by_id(shelter_id)
        if not s:
            raise NotFoundException("Shelter", str(shelter_id))

        updates: dict = {}
        old_occupancy = s.current_occupancy

        if data.current_occupancy is not None:
            if data.current_occupancy > s.total_capacity:
                raise ValidationException(
                    f"current_occupancy ({data.current_occupancy}) exceeds "
                    f"total_capacity ({s.total_capacity})"
                )
            updates["current_occupancy"] = data.current_occupancy
            # Auto-set status to FULL when at capacity
            if data.current_occupancy >= s.total_capacity:
                updates["status"] = ShelterStatus.FULL
        if data.status is not None:
            updates["status"] = data.status
        if data.notes is not None:
            updates["notes"] = data.notes
        if data.facilities is not None:
            updates["facilities"] = data.facilities
        if data.contact_person is not None:
            updates["contact_person"] = data.contact_person
        if data.contact_phone is not None:
            updates["contact_phone"] = data.contact_phone
        if data.latitude is not None:
            updates["latitude"] = data.latitude
        if data.longitude is not None:
            updates["longitude"] = data.longitude

        if updates:
            s = await self.repo.update(shelter_id, updates)
            await self.db.commit()

            await event_bus.publish(DomainEvent(
                event_type=Events.SHELTER_UPDATED,
                payload={
                    "shelter_id": str(shelter_id),
                    "changes": {k: str(v) for k, v in updates.items()},
                },
            ))

            if "current_occupancy" in updates:
                await event_bus.publish(DomainEvent(
                    event_type=Events.SHELTER_CAPACITY_CHANGED,
                    payload={
                        "shelter_id": str(shelter_id),
                        "old_occupancy": old_occupancy,
                        "new_occupancy": updates["current_occupancy"],
                        "available_capacity": s.available_capacity,
                    },
                ))

        return self._build_response(s)
