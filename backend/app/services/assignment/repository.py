from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.base_repository import BaseRepository
from app.services.assignment.models import Assignment, AssignmentStatus


class AssignmentRepository(BaseRepository[Assignment]):
    def __init__(self, db: AsyncSession):
        super().__init__(Assignment, db)

    async def get_filtered(
        self,
        status: Optional[AssignmentStatus] = None,
        responder_id: Optional[UUID] = None,
        alert_id: Optional[UUID] = None,
        assigned_by: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Assignment], int]:
        filters = []
        if status:
            filters.append(Assignment.status == status)
        if responder_id:
            filters.append(Assignment.responder_id == responder_id)
        if alert_id:
            filters.append(Assignment.alert_id == alert_id)
        if assigned_by:
            filters.append(Assignment.assigned_by == assigned_by)

        return await self.get_all(
            limit=limit,
            offset=offset,
            filters=filters if filters else None,
            order_by=Assignment.created_at.desc(),
        )

    async def get_active_for_responder(self, responder_id: UUID) -> List[Assignment]:
        """Returns non-terminal assignments for a responder."""
        active_statuses = [
            AssignmentStatus.PENDING,
            AssignmentStatus.ACKNOWLEDGED,
            AssignmentStatus.EN_ROUTE,
            AssignmentStatus.ON_SCENE,
        ]
        result = await self.db.execute(
            select(Assignment)
            .where(
                Assignment.responder_id == responder_id,
                Assignment.status.in_(active_statuses),
            )
            .order_by(Assignment.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_alert(self, alert_id: UUID) -> List[Assignment]:
        result = await self.db.execute(
            select(Assignment)
            .where(Assignment.alert_id == alert_id)
            .order_by(Assignment.created_at.desc())
        )
        return list(result.scalars().all())
