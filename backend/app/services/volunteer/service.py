from uuid import UUID

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.services.auth.models import User
from app.services.auth.repository import UserRepository
from app.services.volunteer.models import Volunteer, VolunteerStatus
from app.services.volunteer.repository import VolunteerRepository
from app.services.volunteer.schemas import (
    VolunteerCreate,
    VolunteerFilters,
    VolunteerListResponse,
    VolunteerResponse,
    VolunteerUpdate,
)


class VolunteerService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = VolunteerRepository(db)
        self.user_repo = UserRepository(db)

    async def _build_response(self, v: Volunteer) -> VolunteerResponse:
        user = await self.user_repo.get_by_id(v.user_id)
        return VolunteerResponse(
            id=v.id,
            user_id=v.user_id,
            full_name=user.full_name if user else "Unknown",
            email=user.email if user else None,
            phone=user.phone if user else None,
            skills=v.skills or [],
            availability=v.availability,
            status=v.status,
            verified=v.verified,
            ngo_affiliation=v.ngo_affiliation,
            latitude=v.latitude,
            longitude=v.longitude,
            created_at=v.created_at,
            updated_at=v.updated_at,
        )

    async def register_volunteer(
        self, data: VolunteerCreate, current_user: User
    ) -> VolunteerResponse:
        # Verify target user exists
        target_user = await self.user_repo.get_by_id(data.user_id)
        if not target_user:
            raise NotFoundException("User", str(data.user_id))

        # Prevent duplicate registration
        if await self.repo.user_is_volunteer(data.user_id):
            raise ConflictException(
                f"User '{target_user.username}' is already registered as a volunteer"
            )

        volunteer = await self.repo.create(
            user_id=data.user_id,
            skills=data.skills or [],
            availability=True,
            status=VolunteerStatus.PENDING_APPROVAL,
            verified=False,
            ngo_affiliation=data.ngo_affiliation,
        )
        await self.db.commit()
        logger.info("Volunteer registered for user: {}", target_user.username)
        return await self._build_response(volunteer)

    async def list_volunteers(self, filters: VolunteerFilters) -> VolunteerListResponse:
        volunteers, total = await self.repo.get_filtered(
            status=filters.status,
            availability=filters.availability,
            skills=filters.skills,
            limit=filters.limit,
            offset=filters.offset,
        )
        responses = [await self._build_response(v) for v in volunteers]
        return VolunteerListResponse(
            volunteers=responses,
            total=total,
            limit=filters.limit,
            offset=filters.offset,
        )

    async def get_volunteer(self, volunteer_id: UUID) -> VolunteerResponse:
        v = await self.repo.get_by_id(volunteer_id)
        if not v:
            raise NotFoundException("Volunteer", str(volunteer_id))
        return await self._build_response(v)

    async def update_volunteer(
        self, volunteer_id: UUID, data: VolunteerUpdate, current_user: User
    ) -> VolunteerResponse:
        v = await self.repo.get_by_id(volunteer_id)
        if not v:
            raise NotFoundException("Volunteer", str(volunteer_id))

        updates: dict = {}
        if data.availability is not None:
            updates["availability"] = data.availability
        if data.skills is not None:
            updates["skills"] = data.skills
        if data.status is not None:
            updates["status"] = data.status
        if data.ngo_affiliation is not None:
            updates["ngo_affiliation"] = data.ngo_affiliation
        if data.latitude is not None:
            updates["latitude"] = data.latitude
        if data.longitude is not None:
            updates["longitude"] = data.longitude

        if updates:
            v = await self.repo.update(volunteer_id, updates)
            await self.db.commit()

        return await self._build_response(v)

    async def approve_volunteer(
        self, volunteer_id: UUID, current_user: User
    ) -> VolunteerResponse:
        v = await self.repo.get_by_id(volunteer_id)
        if not v:
            raise NotFoundException("Volunteer", str(volunteer_id))

        v = await self.repo.update(volunteer_id, {
            "status": VolunteerStatus.ACTIVE,
            "verified": True,
        })
        await self.db.commit()
        logger.info("Volunteer {} approved by {}", volunteer_id, current_user.username)
        return await self._build_response(v)
