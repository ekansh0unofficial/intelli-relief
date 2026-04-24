import json
from typing import Any, Optional

import redis.asyncio as aioredis
from loguru import logger

from app.core.config import settings


class RedisCache:
    """
    Async Redis cache wrapper.
    Provides get/set/delete with optional TTL and JSON serialization.
    """

    def __init__(self) -> None:
        self._client: Optional[aioredis.Redis] = None

    async def _get_client(self) -> aioredis.Redis:
        if self._client is None:
            self._client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._client

    async def get(self, key: str) -> Optional[Any]:
        """Fetch a cached value; returns None on miss or connection error."""
        try:
            client = await self._get_client()
            raw = await client.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as exc:
            logger.warning("Redis GET failed for key '{}': {}", key, exc)
            return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        """Store a value with a TTL. Returns True on success."""
        try:
            client = await self._get_client()
            await client.setex(key, ttl_seconds, json.dumps(value, default=str))
            return True
        except Exception as exc:
            logger.warning("Redis SET failed for key '{}': {}", key, exc)
            return False

    async def delete(self, key: str) -> bool:
        try:
            client = await self._get_client()
            await client.delete(key)
            return True
        except Exception as exc:
            logger.warning("Redis DELETE failed for key '{}': {}", key, exc)
            return False

    async def exists(self, key: str) -> bool:
        try:
            client = await self._get_client()
            return bool(await client.exists(key))
        except Exception as exc:
            logger.warning("Redis EXISTS failed for key '{}': {}", key, exc)
            return False

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None


# Application-level singleton
cache = RedisCache()
