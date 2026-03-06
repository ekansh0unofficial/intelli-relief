import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine, Dict, List
from uuid import UUID, uuid4

logger = logging.getLogger(__name__)


# ========================
# Domain event base
# ========================
@dataclass
class DomainEvent:
    """
    Base class for all domain events in the system.
    Every service publishes events that inherit from this.

    Immutable fields (do NOT change these):
        event_id    : unique id for this event instance
        event_type  : string identifier e.g. "alert.created"
        occurred_at : UTC timestamp
        payload     : event-specific data dict
    """
    event_type: str = ""
    payload: Dict[str, Any] = field(default_factory=dict)
    event_id: UUID = field(default_factory=uuid4)
    occurred_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "event_id": str(self.event_id),
            "event_type": self.event_type,
            "occurred_at": self.occurred_at.isoformat(),
            "payload": self.payload,
        }


# Typed handler alias
EventHandler = Callable[[DomainEvent], Coroutine[Any, Any, None]]


# ========================
# Event bus
# ========================
class EventBus:
    """
    Async in-process pub/sub event bus.

    Services PUBLISH events here.
    Other services SUBSCRIBE to handle those events.

    Usage:
        # Subscribe (at startup)
        event_bus.subscribe("alert.created", my_handler)

        # Publish (inside a service)
        await event_bus.publish(DomainEvent(event_type=Events.ALERT_CREATED, payload={...}))

    Handlers run concurrently via asyncio.gather.
    A failing handler logs the error but does NOT crash other handlers
    or the publisher (fail-safe by design).
    """

    def __init__(self) -> None:
        self._subscribers: Dict[str, List[EventHandler]] = {}

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        """
        Register an async handler for an event type.
        Multiple handlers per event type are supported.
        """
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)
        logger.debug(
            "EventBus: subscribed %s → %s",
            event_type,
            handler.__qualname__,
        )

    def unsubscribe(self, event_type: str, handler: EventHandler) -> None:
        """Remove a specific handler for an event type."""
        if event_type in self._subscribers:
            self._subscribers[event_type] = [
                h for h in self._subscribers[event_type] if h != handler
            ]

    async def publish(self, event: DomainEvent) -> None:
        """
        Publish an event to all registered subscribers.
        Runs all handlers concurrently; a failing handler is logged
        but never allowed to propagate or block the others.
        """
        handlers = self._subscribers.get(event.event_type, [])

        if not handlers:
            logger.debug("EventBus: no subscribers for '%s'", event.event_type)
            return

        logger.info(
            "EventBus: publishing '%s' to %d handler(s)",
            event.event_type,
            len(handlers),
        )

        async def safe_call(handler: EventHandler) -> None:
            try:
                await handler(event)
            except Exception as exc:
                logger.error(
                    "EventBus: handler %s failed for '%s': %s",
                    handler.__qualname__,
                    event.event_type,
                    exc,
                    exc_info=True,
                )

        await asyncio.gather(*[safe_call(h) for h in handlers])

    def list_subscriptions(self) -> Dict[str, List[str]]:
        """Returns a readable map of event_type → [handler names]."""
        return {
            event_type: [h.__qualname__ for h in handlers]
            for event_type, handlers in self._subscribers.items()
        }


# ========================
# Event type catalog
# ========================
class Events:
    """
    Central catalog of all event type strings used in the system.
    Import this class instead of using raw strings to avoid typos.

    IMMUTABLE — do NOT rename existing constants.
    Add new constants below the relevant section; never remove or rename.
    """
    # Alert
    ALERT_CREATED          = "alert.created"
    ALERT_UPDATED          = "alert.updated"
    ALERT_RESOLVED         = "alert.resolved"
    ALERT_SEVERITY_CHANGED = "alert.severity_changed"
    ALERT_ASSIGNED         = "alert.assigned"
    ALERT_STATUS_CHANGED   = "alert.status_changed"   # MIS.md: alert.status_changed event

    # Assignment / Responder
    ASSIGNMENT_CREATED             = "assignment.created"          # MIS.md: assignment.created
    ASSIGNMENT_STATUS_CHANGED      = "assignment.status_changed"   # MIS.md: assignment.status_changed
    ASSIGNMENT_COMPLETED           = "assignment.completed"        # MIS.md: assignment.completed
    RESPONDER_ASSIGNED             = "responder.assigned"
    RESPONDER_AVAILABILITY_CHANGED = "responder.availability_changed"

    # Shelter
    SHELTER_CREATED          = "shelter.created"           # MIS.md: shelter.created
    SHELTER_UPDATED          = "shelter.updated"           # MIS.md: shelter.updated
    SHELTER_CAPACITY_CHANGED = "shelter.capacity_changed"  # MIS.md: shelter.capacity_changed
    SHELTER_FULL             = "shelter.full"

    # Weather
    WEATHER_UPDATED         = "weather.updated"           # MIS.md: weather.updated
    WEATHER_ALERT_RECEIVED  = "weather.alert_received"    # MIS.md: weather.alert_received
    WEATHER_SEVERE_DETECTED = "weather.severe_detected"

    # Seismic
    SEISMIC_DETECTED = "seismic.detected"

    # Auth  (MIS.md: auth events)
    AUTH_LOGIN_SUCCESS   = "auth.login_success"    # MIS.md: auth.login_success
    AUTH_LOGOUT          = "auth.logout"           # MIS.md: auth.logout
    AUTH_SESSION_EXPIRED = "auth.session_expired"  # MIS.md: auth.session_expired
    # FIX: AUTH_USER_CREATED was missing — service.py publishes this event in
    # register(); without the constant here callers would use a raw string
    # which defeats the purpose of this catalog and risks silent typo bugs.
    AUTH_USER_CREATED    = "auth.user_created"


# Application-level singleton
event_bus = EventBus()