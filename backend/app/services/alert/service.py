from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.event_bus import DomainEvent, Events, event_bus
from app.core.exceptions import NotFoundException
from app.services.alert.models import Alert, AlertStatus, AlertUpdate
from app.services.alert.repository import AlertRepository, AlertUpdateRepository
from app.services.alert.schemas import (
    AlertCreate,
    AlertFilters,
    AlertInferRequest,
    AlertInferResponse,
    AlertListResponse,
    AlertResponse,
    AlertUpdateCreate,
    AlertUpdateRequest,
    AlertUpdateResponse,
)
from app.services.auth.models import User
from app.services.auth.repository import UserRepository


class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.alert_repo = AlertRepository(db)
        self.update_repo = AlertUpdateRepository(db)
        self.user_repo = UserRepository(db)

    # ──────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────

    async def _get_user_map(self, *user_ids: Optional[UUID]) -> Dict[UUID, User]:
        """Bulk-fetch users by id list; returns {user_id: User}."""
        ids = [uid for uid in user_ids if uid is not None]
        users: Dict[UUID, User] = {}
        for uid in set(ids):
            user = await self.user_repo.get_by_id(uid)
            if user:
                users[uid] = user
        return users

    def _build_update_response(
        self, update: AlertUpdate, user_map: Dict[UUID, User]
    ) -> AlertUpdateResponse:
        user = user_map.get(update.user_id)
        return AlertUpdateResponse(
            id=update.id,
            alert_id=update.alert_id,
            user_id=update.user_id,
            user_name=user.full_name if user else "Unknown",
            user_role=user.role.value if user else "unknown",
            update_text=update.update_text,
            status_before=update.status_before,
            status_after=update.status_after,
            created_at=update.created_at,
        )

    async def _build_alert_response(self, alert: Alert) -> AlertResponse:
        """Enrich a raw Alert ORM object into a full AlertResponse."""
        # Collect all user ids that need name resolution
        update_user_ids = [u.user_id for u in alert.updates]
        user_map = await self._get_user_map(
            alert.created_by, alert.assigned_to, *update_user_ids
        )
        creator = user_map.get(alert.created_by)
        assignee = user_map.get(alert.assigned_to) if alert.assigned_to else None

        return AlertResponse(
            id=alert.id,
            title=alert.title,
            description=alert.description,
            incident_type=alert.incident_type,
            severity=alert.severity,
            status=alert.status,
            latitude=alert.latitude,
            longitude=alert.longitude,
            address=alert.address,
            caller_name=alert.caller_name,
            caller_phone=alert.caller_phone,
            created_by=alert.created_by,
            created_by_name=creator.full_name if creator else "Unknown",
            assigned_to=alert.assigned_to,
            assigned_to_name=assignee.full_name if assignee else None,
            created_at=alert.created_at,
            updated_at=alert.updated_at,
            resolved_at=alert.resolved_at,
            updates=[self._build_update_response(u, user_map) for u in alert.updates],
        )

    # ──────────────────────────────────────────
    # Core operations
    # ──────────────────────────────────────────

    async def create_alert(self, data: AlertCreate, current_user: User) -> AlertResponse:
        from app.core.exceptions import ValidationException
        from app.infrastructure.geocoding import geocode_address
        from app.infrastructure.inference import infer_from_description

        # Auto-geocode when coordinates are missing
        if data.latitude is None or data.longitude is None:
            coords = await geocode_address(data.address)  # type: ignore[arg-type]
            if coords is None:
                raise ValidationException(
                    f"Could not geocode address: '{data.address}'. "
                    "Provide latitude and longitude manually."
                )
            data = data.model_copy(update={"latitude": coords[0], "longitude": coords[1]})

        # Auto-infer missing fields from description
        patch: dict = {}
        if not data.title or data.incident_type is None or data.severity is None:
            inferred = infer_from_description(data.description, data.address)
            if not data.title:
                patch["title"] = inferred.title
            if data.incident_type is None:
                patch["incident_type"] = inferred.incident_type
            if data.severity is None:
                patch["severity"] = inferred.severity
        if patch:
            data = data.model_copy(update=patch)

        alert = await self.alert_repo.create(
            title=data.title,
            description=data.description,
            incident_type=data.incident_type,
            severity=data.severity,
            status=AlertStatus.PENDING,
            latitude=data.latitude,
            longitude=data.longitude,
            address=data.address,
            caller_name=data.caller_name,
            caller_phone=data.caller_phone,
            created_by=current_user.id,
        )
        await self.db.commit()
        await self.db.refresh(alert)

        await event_bus.publish(DomainEvent(
            event_type=Events.ALERT_CREATED,
            payload={
                "alert_id": str(alert.id),
                "severity": alert.severity.value,
                "incident_type": alert.incident_type.value,
                "latitude": alert.latitude,
                "longitude": alert.longitude,
                "created_by": str(alert.created_by),
            },
        ))
        logger.info("Alert created: {} by {}", alert.id, current_user.username)

        alert = await self.alert_repo.get_with_updates(alert.id)
        return await self._build_alert_response(alert)

    async def list_alerts(self, filters: AlertFilters) -> AlertListResponse:
        alerts, total = await self.alert_repo.get_filtered(
            status=filters.status,
            severity=filters.severity,
            incident_type=filters.incident_type,
            assigned_to=filters.assigned_to,
            created_by=filters.created_by,
            bounds_north=filters.bounds_north,
            bounds_south=filters.bounds_south,
            bounds_east=filters.bounds_east,
            bounds_west=filters.bounds_west,
            limit=filters.limit,
            offset=filters.offset,
        )
        # Fetch updates for all alerts in one pass
        responses = []
        for alert in alerts:
            alert_with_updates = await self.alert_repo.get_with_updates(alert.id)
            responses.append(await self._build_alert_response(alert_with_updates))

        return AlertListResponse(
            alerts=responses,
            total=total,
            limit=filters.limit,
            offset=filters.offset,
        )

    async def get_alert(self, alert_id: UUID) -> AlertResponse:
        alert = await self.alert_repo.get_with_updates(alert_id)
        if not alert:
            raise NotFoundException("Alert", str(alert_id))
        return await self._build_alert_response(alert)

    async def update_alert(
        self, alert_id: UUID, data: AlertUpdateRequest, current_user: User
    ) -> AlertResponse:
        alert = await self.alert_repo.get_with_updates(alert_id)
        if not alert:
            raise NotFoundException("Alert", str(alert_id))

        old_status = alert.status
        updates: dict = {}

        if data.status is not None:
            updates["status"] = data.status
            if data.status == AlertStatus.RESOLVED:
                updates["resolved_at"] = datetime.now(timezone.utc)
        if data.severity is not None:
            updates["severity"] = data.severity
        if data.description is not None:
            updates["description"] = data.description
        if data.assigned_to is not None:
            # Verify assignee exists
            assignee = await self.user_repo.get_by_id(data.assigned_to)
            if not assignee:
                raise NotFoundException("User", str(data.assigned_to))
            updates["assigned_to"] = data.assigned_to
        if data.address is not None:
            updates["address"] = data.address
        if data.latitude is not None:
            updates["latitude"] = data.latitude
        if data.longitude is not None:
            updates["longitude"] = data.longitude

        if updates:
            alert = await self.alert_repo.update(alert_id, updates)
            await self.db.commit()

            await event_bus.publish(DomainEvent(
                event_type=Events.ALERT_UPDATED,
                payload={
                    "alert_id": str(alert_id),
                    "changes": {k: str(v) for k, v in updates.items()},
                    "updated_by": str(current_user.id),
                },
            ))

            if data.status and data.status != old_status:
                await event_bus.publish(DomainEvent(
                    event_type=Events.ALERT_STATUS_CHANGED,
                    payload={
                        "alert_id": str(alert_id),
                        "old_status": old_status.value,
                        "new_status": data.status.value,
                        "changed_by": str(current_user.id),
                    },
                ))

        alert = await self.alert_repo.get_with_updates(alert_id)
        return await self._build_alert_response(alert)

    async def add_update(
        self, alert_id: UUID, data: AlertUpdateCreate, current_user: User
    ) -> AlertUpdateResponse:
        alert = await self.alert_repo.get_by_id(alert_id)
        if not alert:
            raise NotFoundException("Alert", str(alert_id))

        old_status = alert.status
        new_status = data.status_change

        # If a status change is included, apply it
        if new_status and new_status != old_status:
            status_updates: dict = {"status": new_status}
            if new_status == AlertStatus.RESOLVED:
                status_updates["resolved_at"] = datetime.now(timezone.utc)
            await self.alert_repo.update(alert_id, status_updates)

            await event_bus.publish(DomainEvent(
                event_type=Events.ALERT_STATUS_CHANGED,
                payload={
                    "alert_id": str(alert_id),
                    "old_status": old_status.value,
                    "new_status": new_status.value,
                    "changed_by": str(current_user.id),
                },
            ))

        update = await self.update_repo.create(
            alert_id=alert_id,
            user_id=current_user.id,
            update_text=data.update_text,
            status_before=old_status.value if new_status else None,
            status_after=new_status.value if new_status else None,
        )
        await self.db.commit()

        user_map = await self._get_user_map(current_user.id)
        return self._build_update_response(update, user_map)

    async def infer_alert(self, req: AlertInferRequest) -> AlertInferResponse:
        """Preview inferred fields without creating the alert. No DB writes."""
        from app.infrastructure.geocoding import geocode_address
        from app.infrastructure.inference import infer_from_description

        inferred = infer_from_description(req.description, req.address)
        lat, lng = None, None
        geocoding_succeeded = False

        if req.address:
            coords = await geocode_address(req.address)
            if coords:
                lat, lng = coords
                geocoding_succeeded = True

        return AlertInferResponse(
            title=inferred.title,
            incident_type=inferred.incident_type,
            severity=inferred.severity,
            latitude=lat,
            longitude=lng,
            geocoding_succeeded=geocoding_succeeded,
        )
