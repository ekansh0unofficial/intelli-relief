"""
Audit trail writer — subscribes to all domain events and persists rows to audit_log.
Creates its own DB session per event since handlers have no request context.
"""
import json
from typing import Optional

from loguru import logger
from sqlalchemy import text

from app.core.database import AsyncSessionLocal
from app.core.event_bus import DomainEvent, Events, event_bus

_ALL_EVENTS = [
    Events.ALERT_CREATED, Events.ALERT_UPDATED, Events.ALERT_RESOLVED,
    Events.ALERT_STATUS_CHANGED, Events.ALERT_ASSIGNED, Events.ALERT_ESCALATED,
    Events.ASSIGNMENT_CREATED, Events.ASSIGNMENT_STATUS_CHANGED, Events.ASSIGNMENT_COMPLETED,
    Events.SHELTER_CREATED, Events.SHELTER_UPDATED, Events.SHELTER_CAPACITY_CHANGED,
    Events.SHELTER_OCCUPANCY_UPDATED, Events.SHELTER_NEAR_FULL,
    Events.RESPONDER_AVAILABILITY_CHANGED,
    Events.AUTH_USER_CREATED, Events.AUTH_LOGIN_SUCCESS,
]

_USER_ID_KEYS = ("created_by", "changed_by", "assigned_by", "user_id", "responder_id")

_ENTITY_ID_KEYS = {
    "alert_id": "alert",
    "assignment_id": "assignment",
    "shelter_id": "shelter",
    "user_id": "user",
}


def _extract_entity(payload: dict) -> tuple[Optional[str], Optional[str]]:
    for key, etype in _ENTITY_ID_KEYS.items():
        if key in payload:
            return etype, payload[key]
    return None, None


def _extract_user_id(payload: dict) -> Optional[str]:
    for key in _USER_ID_KEYS:
        if key in payload:
            return payload[key]
    return None


async def _write_audit_log(event: DomainEvent) -> None:
    entity_type, entity_id = _extract_entity(event.payload)
    user_id_str = _extract_user_id(event.payload)

    async with AsyncSessionLocal() as session:
        try:
            await session.execute(
                text("""
                    INSERT INTO audit_log
                        (action, entity_type, entity_id, user_id, new_values, created_at)
                    VALUES
                        (:action, :entity_type, :entity_id, :user_id::uuid, :new_values::jsonb, NOW())
                """),
                {
                    "action": event.event_type,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "user_id": user_id_str,
                    "new_values": json.dumps(event.payload),
                },
            )
            await session.commit()
        except Exception as exc:
            await session.rollback()
            logger.error("audit_log write failed for '{}': {}", event.event_type, exc)


def register_audit_handlers() -> None:
    """Subscribe the audit writer to all tracked domain events. Call once at startup."""
    for event_type in _ALL_EVENTS:
        event_bus.subscribe(event_type, _write_audit_log)
    logger.info("Audit: registered handlers for {} event types", len(_ALL_EVENTS))
