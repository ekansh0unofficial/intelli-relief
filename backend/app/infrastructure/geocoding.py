import hashlib
import json
from typing import Optional

import httpx
from loguru import logger

from app.core.config import settings
from app.infrastructure.cache import cache

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


async def geocode_address(address: str) -> Optional[tuple[float, float]]:
    """
    Convert an address string to (latitude, longitude) via Nominatim OSM.
    Returns None if geocoding fails — callers decide whether to reject the request.
    Results are cached for 24 hours per address hash to respect rate limits.
    """
    cache_key = "geocode:" + hashlib.md5(address.lower().strip().encode()).hexdigest()
    cached = await cache.get(cache_key)
    if cached:
        if isinstance(cached, dict):
            return (cached["lat"], cached["lng"])

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                NOMINATIM_URL,
                params={"q": address, "format": "json", "limit": 1},
                headers={"User-Agent": settings.NOMINATIM_USER_AGENT},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.warning("Geocoding failed for '{}': {}", address, exc)
        return None

    if not data:
        logger.warning("Geocoding returned no results for '{}'", address)
        return None

    lat = float(data[0]["lat"])
    lng = float(data[0]["lon"])
    await cache.set(cache_key, {"lat": lat, "lng": lng}, ttl_seconds=86400)
    return (lat, lng)
