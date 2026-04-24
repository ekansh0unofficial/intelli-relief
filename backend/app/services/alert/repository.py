from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.base_repository import BaseRepository
from app.services.alert.models import Alert, AlertStatus, AlertUpdate, IncidentType, Severity


class AlertRepository(BaseRepository[Alert]):
    def __init__(self, db: AsyncSession):
        super().__init__(Alert, db)

    async def get_with_updates(self, alert_id: UUID) -> Optional[Alert]:
        """Fetch one alert with its updates eagerly loaded."""
        result = await self.db.execute(
            select(Alert)
            .where(Alert.id == alert_id)
            .options(selectinload(Alert.updates))
        )
        return result.scalar_one_or_none()

    async def get_filtered(
        self,
        status: Optional[AlertStatus] = None,
        severity: Optional[Severity] = None,
        incident_type: Optional[IncidentType] = None,
        assigned_to: Optional[UUID] = None,
        created_by: Optional[UUID] = None,
        bounds_north: Optional[float] = None,
        bounds_south: Optional[float] = None,
        bounds_east: Optional[float] = None,
        bounds_west: Optional[float] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Alert], int]:
        filters = []
        if status:
            filters.append(Alert.status == status)
        if severity:
            filters.append(Alert.severity == severity)
        if incident_type:
            filters.append(Alert.incident_type == incident_type)
        if assigned_to:
            filters.append(Alert.assigned_to == assigned_to)
        if created_by:
            filters.append(Alert.created_by == created_by)
        if all(b is not None for b in [bounds_north, bounds_south, bounds_east, bounds_west]):
            filters.extend([
                Alert.latitude <= bounds_north,
                Alert.latitude >= bounds_south,
                Alert.longitude <= bounds_east,
                Alert.longitude >= bounds_west,
            ])

        return await self.get_all(
            limit=limit,
            offset=offset,
            filters=filters if filters else None,
            order_by=Alert.created_at.desc(),
        )


class AlertUpdateRepository(BaseRepository[AlertUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(AlertUpdate, db)

    async def get_by_alert(self, alert_id: UUID) -> List[AlertUpdate]:
        result = await self.db.execute(
            select(AlertUpdate)
            .where(AlertUpdate.alert_id == alert_id)
            .order_by(AlertUpdate.created_at)
        )
        return list(result.scalars().all())
