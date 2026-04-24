"""
USGS Earthquake Feed poller.

Polls the USGS GeoJSON feed for recent earthquakes and publishes
SeismicActivityDetected events for significant events (magnitude >= 4.0).

Usage (in lifespan startup):
    from app.infrastructure.seismic import start_seismic_poller
    asyncio.create_task(start_seismic_poller())
"""

import asyncio
from typing import Any, Dict, List

import httpx
from loguru import logger

from app.core.event_bus import DomainEvent, Events, event_bus

# USGS public GeoJSON feed — no API key required
USGS_FEED_URL = (
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/"
    "4.5_day.geojson"  # magnitude >= 4.5, past day
)
POLL_INTERVAL_SECONDS = 300  # 5 minutes
MIN_SIGNIFICANT_MAGNITUDE = 5.0

# Track which event IDs we've already published so we don't duplicate
_seen_event_ids: set = set()


async def _fetch_earthquakes() -> List[Dict[str, Any]]:
    """Fetch and parse the USGS feed. Returns a list of feature dicts."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(USGS_FEED_URL)
            response.raise_for_status()
            data = response.json()
            return data.get("features", [])
    except Exception as exc:
        logger.warning("USGS feed fetch failed: {}", exc)
        return []


async def _process_earthquakes(features: List[Dict[str, Any]]) -> None:
    for feature in features:
        usgs_id = feature.get("id", "")
        if usgs_id in _seen_event_ids:
            continue

        props = feature.get("properties", {})
        geometry = feature.get("geometry", {})
        coords = geometry.get("coordinates", [None, None, None])

        magnitude = props.get("mag")
        place = props.get("place", "Unknown")

        if magnitude is None:
            continue

        _seen_event_ids.add(usgs_id)

        payload = {
            "usgs_id": usgs_id,
            "magnitude": magnitude,
            "place": place,
            "longitude": coords[0],
            "latitude": coords[1],
            "depth_km": coords[2],
            "time_utc": props.get("time"),
            "url": props.get("url"),
            "significant": magnitude >= MIN_SIGNIFICANT_MAGNITUDE,
        }

        await event_bus.publish(DomainEvent(
            event_type=Events.SEISMIC_DETECTED,
            payload=payload,
        ))

        if magnitude >= MIN_SIGNIFICANT_MAGNITUDE:
            logger.warning(
                "Significant earthquake: M{} near {} (depth {}km)",
                magnitude, place, coords[2],
            )
        else:
            logger.info("Earthquake: M{} near {}", magnitude, place)


async def start_seismic_poller() -> None:
    """
    Background coroutine that polls the USGS feed every POLL_INTERVAL_SECONDS.
    Designed to run as an asyncio task; logs errors and keeps running.
    """
    logger.info("Seismic poller started (interval={}s)", POLL_INTERVAL_SECONDS)
    while True:
        try:
            features = await _fetch_earthquakes()
            if features:
                await _process_earthquakes(features)
        except Exception as exc:
            logger.error("Seismic poller loop error: {}", exc, exc_info=True)
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
