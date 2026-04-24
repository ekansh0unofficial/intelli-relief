"""
Event-driven automations — all behaviors here subscribe to domain events
and react automatically, with zero operator interaction.

Registered at startup via register_automations() in main.py lifespan.
Each handler uses its own DB session (event handlers have no request context).

Automations implemented:
  1. Stale-alert escalation  — background poller, not event-driven, but started here
  2. Seismic → auto-alert    — M≥6.0 quake publishes a new EARTHQUAKE alert
  3. Responder availability  — assignment created/completed → toggle user availability
  4. Shelter near-full warn  — occupancy update crossing 80% → publish SHELTER_NEAR_FULL
  5. Weather severity boost  — severe weather detected → escalate nearby active alerts
"""

import asyncio
import math
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from loguru import logger
from sqlalchemy import select, text

from app.core.database import AsyncSessionLocal
from app.core.event_bus import DomainEvent, Events, event_bus

# ── Constants ────────────────────────────────────────────────────────────────

STALE_ALERT_MINUTES = 15          # PENDING with no assignment → escalate
NEAR_FULL_THRESHOLD = 0.80        # 80% occupancy → near_full warning
SEISMIC_AUTO_ALERT_MAG = 6.0      # magnitude threshold to auto-create an alert
WEATHER_BOOST_RADIUS_KM = 50.0    # radius within which weather escalates alert severity


# ── Haversine distance helper ─────────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


# ── Automation 2: Seismic → auto-create earthquake alert ─────────────────────

async def _on_seismic_detected(event: DomainEvent) -> None:
    """
    When USGS detects M≥6.0, auto-create a CRITICAL earthquake alert
    if one doesn't already exist for this USGS event ID.
    """
    payload = event.payload
    magnitude = payload.get("magnitude", 0)
    if magnitude < SEISMIC_AUTO_ALERT_MAG:
        return

    usgs_id = payload.get("usgs_id", "")
    lat = payload.get("latitude")
    lon = payload.get("longitude")
    place = payload.get("place", "Unknown location")

    if lat is None or lon is None:
        return

    async with AsyncSessionLocal() as session:
        try:
            # Check if an alert for this USGS event already exists (idempotent)
            existing = await session.execute(
                text("SELECT id FROM alerts WHERE title LIKE :pattern LIMIT 1"),
                {"pattern": f"%{usgs_id}%"},
            )
            if existing.scalar_one_or_none():
                return

            # Find the system admin user to act as creator
            admin_row = await session.execute(
                text("SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1")
            )
            admin_id = admin_row.scalar_one_or_none()
            if not admin_id:
                logger.warning("Seismic auto-alert: no admin user found, skipping")
                return

            alert_id = uuid4()
            await session.execute(
                text("""
                    INSERT INTO alerts
                        (id, title, description, incident_type, severity, status,
                         latitude, longitude, address, created_by, created_at, updated_at)
                    VALUES
                        (:id, :title, :description, 'earthquake', 'critical', 'pending',
                         :lat, :lon, :address, :created_by, NOW(), NOW())
                """),
                {
                    "id": str(alert_id),
                    "title": f"M{magnitude} Earthquake near {place[:60]}",
                    "description": (
                        f"USGS detected a magnitude {magnitude} earthquake near {place}. "
                        f"Depth: {payload.get('depth_km', '?')} km. "
                        f"Auto-created from USGS feed (event ID: {usgs_id}). "
                        "Assess for casualties and structural damage immediately."
                    ),
                    "lat": lat,
                    "lon": lon,
                    "address": place,
                    "created_by": str(admin_id),
                },
            )
            await session.commit()

            await event_bus.publish(DomainEvent(
                event_type=Events.ALERT_CREATED,
                payload={
                    "alert_id": str(alert_id),
                    "severity": "critical",
                    "incident_type": "earthquake",
                    "latitude": lat,
                    "longitude": lon,
                    "created_by": str(admin_id),
                    "auto_created": True,
                    "usgs_id": usgs_id,
                },
            ))
            logger.warning(
                "Auto-created CRITICAL earthquake alert for M{} near {} (USGS {})",
                magnitude, place, usgs_id,
            )

        except Exception as exc:
            await session.rollback()
            logger.error("Seismic auto-alert failed: {}", exc)


# ── Automation 3: Responder availability toggle ───────────────────────────────

async def _on_assignment_created(event: DomainEvent) -> None:
    """Mark responder as busy (is_active stays true, but a note is logged)."""
    responder_id = event.payload.get("responder_id")
    if not responder_id:
        return
    # Publish availability change event for the UI — no DB change needed
    # (responder's active status remains true; availability is tracked via assignment count)
    await event_bus.publish(DomainEvent(
        event_type=Events.RESPONDER_AVAILABILITY_CHANGED,
        payload={
            "responder_id": responder_id,
            "available": False,
            "reason": "assignment_created",
            "assignment_id": event.payload.get("assignment_id"),
        },
    ))


async def _on_assignment_completed(event: DomainEvent) -> None:
    """
    When an assignment is COMPLETED or CANCELLED, check if responder
    has any remaining active assignments; if not, broadcast available=True.
    """
    responder_id = event.payload.get("responder_id")
    if not responder_id:
        return

    async with AsyncSessionLocal() as session:
        try:
            row = await session.execute(
                text("""
                    SELECT COUNT(*) FROM assignments
                    WHERE responder_id = :rid
                      AND status IN ('pending','acknowledged','en_route','on_scene')
                """),
                {"rid": responder_id},
            )
            active_count = row.scalar() or 0
            still_busy = active_count > 0

            await event_bus.publish(DomainEvent(
                event_type=Events.RESPONDER_AVAILABILITY_CHANGED,
                payload={
                    "responder_id": responder_id,
                    "available": not still_busy,
                    "active_assignment_count": active_count,
                    "reason": "assignment_completed",
                },
            ))
        except Exception as exc:
            logger.error("Responder availability check failed: {}", exc)


# ── Automation 4: Shelter near-full warning ───────────────────────────────────

async def _on_shelter_occupancy_updated(event: DomainEvent) -> None:
    """Publish SHELTER_NEAR_FULL when occupancy crosses 80%."""
    occupancy = event.payload.get("new_occupancy", 0)
    capacity = event.payload.get("total_capacity", 1)
    if capacity <= 0:
        return

    ratio = occupancy / capacity
    if NEAR_FULL_THRESHOLD <= ratio < 1.0:
        await event_bus.publish(DomainEvent(
            event_type=Events.SHELTER_NEAR_FULL,
            payload={
                "shelter_id": event.payload.get("shelter_id"),
                "current_occupancy": occupancy,
                "total_capacity": capacity,
                "occupancy_ratio": round(ratio, 3),
                "available_spots": capacity - occupancy,
            },
        ))
        logger.info(
            "Shelter {} is {:.0f}% full ({}/{})",
            event.payload.get("shelter_id"),
            ratio * 100,
            occupancy,
            capacity,
        )


# ── Automation 5: Severe weather → escalate nearby alerts ────────────────────

_SEVERITY_ESCALATION = {
    "low": "medium",
    "medium": "high",
    "high": "critical",
    "critical": "critical",  # already at max
}


async def _on_weather_alert_received(event: DomainEvent) -> None:
    """
    When a severe/extreme weather alert fires, escalate all active (non-resolved)
    alerts within WEATHER_BOOST_RADIUS_KM of the weather location.
    Only escalates if the weather alert has severity 'severe' or 'extreme'.
    """
    weather_severity = event.payload.get("severity", "")
    if weather_severity not in ("severe", "extreme"):
        return

    # The weather alert payload may not have coordinates — skip if missing
    location = event.payload.get("location") or {}
    w_lat = location.get("lat") or event.payload.get("latitude")
    w_lon = location.get("lng") or event.payload.get("longitude")
    if w_lat is None or w_lon is None:
        return

    async with AsyncSessionLocal() as session:
        try:
            # Fetch active alerts that haven't been resolved/cancelled
            result = await session.execute(
                text("""
                    SELECT id, severity, latitude, longitude
                    FROM alerts
                    WHERE status NOT IN ('resolved', 'cancelled')
                """)
            )
            rows = result.mappings().all()

            escalated = 0
            for row in rows:
                if row["latitude"] is None or row["longitude"] is None:
                    continue
                dist = _haversine_km(w_lat, w_lon, float(row["latitude"]), float(row["longitude"]))
                if dist > WEATHER_BOOST_RADIUS_KM:
                    continue

                old_sev = row["severity"]
                new_sev = _SEVERITY_ESCALATION.get(old_sev, old_sev)
                if new_sev == old_sev:
                    continue

                await session.execute(
                    text("UPDATE alerts SET severity = :sev, updated_at = NOW() WHERE id = :id"),
                    {"sev": new_sev, "id": str(row["id"])},
                )

                await event_bus.publish(DomainEvent(
                    event_type=Events.ALERT_ESCALATED,
                    payload={
                        "alert_id": str(row["id"]),
                        "old_severity": old_sev,
                        "new_severity": new_sev,
                        "reason": f"severe_weather_{weather_severity}",
                        "weather_event": event.payload.get("event", ""),
                        "distance_km": round(dist, 1),
                    },
                ))
                escalated += 1

            if escalated:
                await session.commit()
                logger.warning(
                    "Weather boost: escalated {} alerts within {}km of ({}, {})",
                    escalated, WEATHER_BOOST_RADIUS_KM, w_lat, w_lon,
                )

        except Exception as exc:
            await session.rollback()
            logger.error("Weather-severity boost failed: {}", exc)


# ── Automation 1: Stale alert escalation poller ───────────────────────────────

async def _stale_alert_poller() -> None:
    """
    Background task: every 5 minutes, find PENDING alerts with no active assignment
    for >= STALE_ALERT_MINUTES. Escalate their severity one level and publish
    ALERT_ESCALATED.
    """
    logger.info("Stale-alert escalation poller started (check interval=5m, threshold={}m)", STALE_ALERT_MINUTES)
    while True:
        await asyncio.sleep(300)  # check every 5 minutes
        async with AsyncSessionLocal() as session:
            try:
                result = await session.execute(
                    text("""
                        SELECT a.id, a.severity
                        FROM alerts a
                        WHERE a.status = 'pending'
                          AND a.created_at <= NOW() - INTERVAL ':minutes minutes'
                          AND NOT EXISTS (
                              SELECT 1 FROM assignments ass
                              WHERE ass.alert_id = a.id
                                AND ass.status NOT IN ('cancelled')
                          )
                    """.replace(":minutes minutes", f"{STALE_ALERT_MINUTES} minutes"))
                )
                rows = result.mappings().all()

                escalated = 0
                for row in rows:
                    old_sev = row["severity"]
                    new_sev = _SEVERITY_ESCALATION.get(old_sev, old_sev)
                    if new_sev == old_sev:
                        continue

                    await session.execute(
                        text("UPDATE alerts SET severity = :sev, updated_at = NOW() WHERE id = :id"),
                        {"sev": new_sev, "id": str(row["id"])},
                    )
                    await event_bus.publish(DomainEvent(
                        event_type=Events.ALERT_ESCALATED,
                        payload={
                            "alert_id": str(row["id"]),
                            "old_severity": old_sev,
                            "new_severity": new_sev,
                            "reason": f"stale_pending_{STALE_ALERT_MINUTES}min",
                        },
                    ))
                    escalated += 1

                if escalated:
                    await session.commit()
                    logger.warning(
                        "Stale-alert poller: escalated {} alerts unattended >{}min",
                        escalated, STALE_ALERT_MINUTES,
                    )

            except Exception as exc:
                await session.rollback()
                logger.error("Stale-alert poller error: {}", exc)


# ── Registration ──────────────────────────────────────────────────────────────

def register_automations() -> asyncio.Task:
    """
    Subscribe all event-driven automation handlers and start the stale-alert
    background poller. Returns the poller task so main.py can cancel it on shutdown.
    Call once at startup after register_event_handlers() and register_audit_handlers().
    """
    event_bus.subscribe(Events.SEISMIC_DETECTED,           _on_seismic_detected)
    event_bus.subscribe(Events.ASSIGNMENT_CREATED,         _on_assignment_created)
    event_bus.subscribe(Events.ASSIGNMENT_COMPLETED,       _on_assignment_completed)
    event_bus.subscribe(Events.SHELTER_OCCUPANCY_UPDATED,  _on_shelter_occupancy_updated)
    event_bus.subscribe(Events.WEATHER_ALERT_RECEIVED,     _on_weather_alert_received)

    poller_task = asyncio.create_task(_stale_alert_poller())
    logger.info("Automations: registered 5 event-driven handlers + stale-alert poller")
    return poller_task
