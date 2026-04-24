from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.event_bus import DomainEvent, Events, event_bus
from app.core.exceptions import NotFoundException
from app.services.alert.repository import AlertRepository
from app.services.assignment.models import Assignment, AssignmentStatus
from app.services.assignment.repository import AssignmentRepository
from app.services.assignment.schemas import (
    AssignmentCreate,
    AssignmentFilters,
    AssignmentListResponse,
    AssignmentResponse,
    AssignmentStatusUpdate,
    AssignmentUpdateRequest,
)
from app.services.auth.models import User
from app.services.auth.repository import UserRepository


class AssignmentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AssignmentRepository(db)
        self.user_repo = UserRepository(db)
        self.alert_repo = AlertRepository(db)

    async def _build_response(self, a: Assignment) -> AssignmentResponse:
        responder = await self.user_repo.get_by_id(a.responder_id)
        assigner = await self.user_repo.get_by_id(a.assigned_by)
        alert = await self.alert_repo.get_by_id(a.alert_id)

        return AssignmentResponse(
            id=a.id,
            alert_id=a.alert_id,
            alert_title=alert.title if alert else "Unknown",
            alert_location={
                "latitude": alert.latitude if alert else 0,
                "longitude": alert.longitude if alert else 0,
            },
            responder_id=a.responder_id,
            responder_name=responder.full_name if responder else "Unknown",
            responder_unit=None,  # Responder unit info not in current schema
            priority=a.priority,
            status=a.status,
            notes=a.notes,
            assigned_by=a.assigned_by,
            assigned_by_name=assigner.full_name if assigner else "Unknown",
            assigned_at=a.assigned_at,
            acknowledged_at=a.acknowledged_at,
            started_at=a.started_at,
            completed_at=a.completed_at,
            estimated_arrival=a.estimated_arrival,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )

    async def create_assignment(
        self, data: AssignmentCreate, current_user: User
    ) -> AssignmentResponse:
        # Verify alert exists
        alert = await self.alert_repo.get_by_id(data.alert_id)
        if not alert:
            raise NotFoundException("Alert", str(data.alert_id))

        # Verify responder exists
        responder = await self.user_repo.get_by_id(data.responder_id)
        if not responder:
            raise NotFoundException("User", str(data.responder_id))

        assignment = await self.repo.create(
            alert_id=data.alert_id,
            responder_id=data.responder_id,
            priority=data.priority,
            status=AssignmentStatus.PENDING,
            notes=data.notes,
            assigned_by=current_user.id,
            assigned_at=datetime.now(timezone.utc),
            estimated_arrival=data.estimated_arrival,
        )
        await self.db.commit()

        # Auto-advance alert PENDING → IN_PROGRESS when a responder is assigned
        from app.services.alert.models import AlertStatus as AStatus
        alert = await self.alert_repo.get_by_id(data.alert_id)
        if alert and alert.status == AStatus.PENDING:
            await self.alert_repo.update(alert.id, {"status": AStatus.IN_PROGRESS})
            await self.db.commit()
            await event_bus.publish(DomainEvent(
                event_type=Events.ALERT_STATUS_CHANGED,
                payload={
                    "alert_id": str(data.alert_id),
                    "old_status": AStatus.PENDING.value,
                    "new_status": AStatus.IN_PROGRESS.value,
                    "changed_by": str(current_user.id),
                },
            ))
            logger.info("Alert {} auto-transitioned PENDING → IN_PROGRESS on assignment", data.alert_id)

        await event_bus.publish(DomainEvent(
            event_type=Events.ASSIGNMENT_CREATED,
            payload={
                "assignment_id": str(assignment.id),
                "alert_id": str(data.alert_id),
                "responder_id": str(data.responder_id),
                "assigned_by": str(current_user.id),
            },
        ))
        logger.info(
            "Assignment created: {} → alert={} responder={}",
            assignment.id, data.alert_id, data.responder_id,
        )
        return await self._build_response(assignment)

    async def list_assignments(self, filters: AssignmentFilters) -> AssignmentListResponse:
        assignments, total = await self.repo.get_filtered(
            status=filters.status,
            responder_id=filters.responder_id,
            alert_id=filters.alert_id,
            assigned_by=filters.assigned_by,
            limit=filters.limit,
            offset=filters.offset,
        )
        responses = [await self._build_response(a) for a in assignments]
        return AssignmentListResponse(
            assignments=responses,
            total=total,
            limit=filters.limit,
            offset=filters.offset,
        )

    async def get_assignment(self, assignment_id: UUID) -> AssignmentResponse:
        a = await self.repo.get_by_id(assignment_id)
        if not a:
            raise NotFoundException("Assignment", str(assignment_id))
        return await self._build_response(a)

    async def update_assignment(
        self, assignment_id: UUID, data: AssignmentUpdateRequest, current_user: User
    ) -> AssignmentResponse:
        a = await self.repo.get_by_id(assignment_id)
        if not a:
            raise NotFoundException("Assignment", str(assignment_id))

        updates = {}
        if data.status is not None:
            updates["status"] = data.status
        if data.notes is not None:
            updates["notes"] = data.notes
        if data.estimated_arrival is not None:
            updates["estimated_arrival"] = data.estimated_arrival

        if updates:
            a = await self.repo.update(assignment_id, updates)
            await self.db.commit()

        return await self._build_response(a)

    async def update_status(
        self, assignment_id: UUID, data: AssignmentStatusUpdate, current_user: User
    ) -> AssignmentResponse:
        a = await self.repo.get_by_id(assignment_id)
        if not a:
            raise NotFoundException("Assignment", str(assignment_id))

        old_status = a.status
        now = datetime.now(timezone.utc)

        updates: dict = {"status": data.status}
        if data.notes:
            updates["notes"] = data.notes

        # Set business timestamps based on status transition
        if data.status == AssignmentStatus.ACKNOWLEDGED:
            updates["acknowledged_at"] = now
        elif data.status == AssignmentStatus.EN_ROUTE:
            updates["started_at"] = now
        elif data.status in (AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED):
            updates["completed_at"] = now

        a = await self.repo.update(assignment_id, updates)
        await self.db.commit()

        # Auto-sync alert status based on assignment progression
        from app.services.alert.models import AlertStatus as AStatus
        alert = await self.alert_repo.get_by_id(a.alert_id)
        if alert:
            if data.status in (
                AssignmentStatus.ACKNOWLEDGED,
                AssignmentStatus.EN_ROUTE,
                AssignmentStatus.ON_SCENE,
            ) and alert.status not in (AStatus.RESOLVED, AStatus.CANCELLED):
                await self.alert_repo.update(alert.id, {"status": AStatus.IN_PROGRESS})
                await self.db.commit()
            elif data.status == AssignmentStatus.COMPLETED:
                await self.alert_repo.update(alert.id, {"status": AStatus.RESOLVED})
                await self.db.commit()

        await event_bus.publish(DomainEvent(
            event_type=Events.ASSIGNMENT_STATUS_CHANGED,
            payload={
                "assignment_id": str(assignment_id),
                "old_status": old_status.value,
                "new_status": data.status.value,
                "responder_id": str(a.responder_id),
            },
        ))

        if data.status == AssignmentStatus.COMPLETED:
            duration = None
            if a.assigned_at and a.completed_at:
                duration = int((a.completed_at - a.assigned_at).total_seconds() / 60)
            await event_bus.publish(DomainEvent(
                event_type=Events.ASSIGNMENT_COMPLETED,
                payload={
                    "assignment_id": str(assignment_id),
                    "alert_id": str(a.alert_id),
                    "responder_id": str(a.responder_id),
                    "duration_minutes": duration,
                },
            ))

            # Auto-increment shelter occupancy when responder drops off victims
            if data.shelter_id is not None:
                from app.services.shelter.repository import ShelterRepository
                shelter_repo = ShelterRepository(self.db)
                updated_shelter = await shelter_repo.increment_occupancy(
                    data.shelter_id, data.victim_count
                )
                await self.db.commit()
                if updated_shelter:
                    await event_bus.publish(DomainEvent(
                        event_type=Events.SHELTER_OCCUPANCY_UPDATED,
                        payload={
                            "shelter_id": str(data.shelter_id),
                            "assignment_id": str(assignment_id),
                            "victim_count": data.victim_count,
                            "new_occupancy": updated_shelter.current_occupancy,
                            "total_capacity": updated_shelter.total_capacity,
                            "shelter_status": updated_shelter.status.value,
                        },
                    ))
                    logger.info(
                        "Shelter {} occupancy +{} (now {}/{})",
                        data.shelter_id,
                        data.victim_count,
                        updated_shelter.current_occupancy,
                        updated_shelter.total_capacity,
                    )

        logger.info(
            "Assignment {} status: {} → {}",
            assignment_id, old_status.value, data.status.value,
        )
        return await self._build_response(a)
