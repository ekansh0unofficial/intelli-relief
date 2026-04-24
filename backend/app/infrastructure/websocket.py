"""
WebSocket broadcaster — wires the internal EventBus to connected Socket.io clients.

At startup, this module subscribes to key domain events and broadcasts them to
all connected frontend clients. Clients receive real-time updates without polling.

Usage in main.py:
    from app.infrastructure.websocket import sio, register_event_handlers
    app.mount("/ws", socketio.ASGIApp(sio))
    register_event_handlers()
"""

from typing import Any, Dict

import socketio
from loguru import logger

from app.core.event_bus import DomainEvent, Events, event_bus

# Socket.io async server with CORS enabled for frontend origins
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",   # tighten to settings.cors_origins_list in production
    logger=False,
    engineio_logger=False,
)


# ──────────────────────────────────────────
# Socket.io connection events
# ──────────────────────────────────────────

@sio.event
async def connect(sid: str, environ: dict, auth: dict) -> None:
    logger.info("WebSocket client connected: {}", sid)


@sio.event
async def disconnect(sid: str) -> None:
    logger.info("WebSocket client disconnected: {}", sid)


# ──────────────────────────────────────────
# Internal EventBus → Socket.io bridge
# ──────────────────────────────────────────

async def _broadcast(event_name: str, payload: Dict[str, Any]) -> None:
    """Emit a named event to ALL connected clients."""
    await sio.emit(event_name, payload)


def register_event_handlers() -> None:
    """
    Subscribe to domain events and forward them as Socket.io broadcasts.
    Call once during app startup.
    """

    async def on_alert_created(event: DomainEvent) -> None:
        await _broadcast("alert.created", event.payload)

    async def on_alert_updated(event: DomainEvent) -> None:
        await _broadcast("alert.updated", event.payload)

    async def on_alert_status_changed(event: DomainEvent) -> None:
        await _broadcast("alert.status_changed", event.payload)

    async def on_assignment_created(event: DomainEvent) -> None:
        await _broadcast("assignment.created", event.payload)

    async def on_assignment_status_changed(event: DomainEvent) -> None:
        await _broadcast("assignment.status_changed", event.payload)

    async def on_shelter_updated(event: DomainEvent) -> None:
        await _broadcast("shelter.updated", event.payload)

    async def on_shelter_capacity_changed(event: DomainEvent) -> None:
        await _broadcast("shelter.capacity_changed", event.payload)

    async def on_weather_updated(event: DomainEvent) -> None:
        await _broadcast("weather.updated", event.payload)

    async def on_weather_alert(event: DomainEvent) -> None:
        await _broadcast("weather.alert_received", event.payload)

    async def on_seismic_detected(event: DomainEvent) -> None:
        await _broadcast("seismic.detected", event.payload)

    async def on_shelter_occupancy_updated(event: DomainEvent) -> None:
        await _broadcast("shelter.occupancy_updated", event.payload)

    async def on_shelter_near_full(event: DomainEvent) -> None:
        await _broadcast("shelter.near_full", event.payload)

    async def on_alert_escalated(event: DomainEvent) -> None:
        await _broadcast("alert.escalated", event.payload)

    async def on_responder_availability_changed(event: DomainEvent) -> None:
        await _broadcast("responder.availability_changed", event.payload)

    event_bus.subscribe(Events.ALERT_CREATED, on_alert_created)
    event_bus.subscribe(Events.ALERT_UPDATED, on_alert_updated)
    event_bus.subscribe(Events.ALERT_STATUS_CHANGED, on_alert_status_changed)
    event_bus.subscribe(Events.ASSIGNMENT_CREATED, on_assignment_created)
    event_bus.subscribe(Events.ASSIGNMENT_STATUS_CHANGED, on_assignment_status_changed)
    event_bus.subscribe(Events.SHELTER_UPDATED, on_shelter_updated)
    event_bus.subscribe(Events.SHELTER_CAPACITY_CHANGED, on_shelter_capacity_changed)
    event_bus.subscribe(Events.WEATHER_UPDATED, on_weather_updated)
    event_bus.subscribe(Events.WEATHER_ALERT_RECEIVED, on_weather_alert)
    event_bus.subscribe(Events.SEISMIC_DETECTED, on_seismic_detected)
    event_bus.subscribe(Events.SHELTER_OCCUPANCY_UPDATED, on_shelter_occupancy_updated)
    event_bus.subscribe(Events.SHELTER_NEAR_FULL, on_shelter_near_full)
    event_bus.subscribe(Events.ALERT_ESCALATED, on_alert_escalated)
    event_bus.subscribe(Events.RESPONDER_AVAILABILITY_CHANGED, on_responder_availability_changed)

    logger.info("WebSocket: registered {} EventBus → Socket.io bridges", 14)
