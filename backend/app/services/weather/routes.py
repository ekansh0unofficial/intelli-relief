from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import Roles, require_roles
from app.core.database import get_db
from app.services.auth.models import User
from app.services.weather.schemas import (
    CurrentWeatherResponse,
    ForecastResponse,
    WeatherAlertsResponse,
)
from app.services.weather.service import WeatherService

router = APIRouter()


@router.get("/current", response_model=CurrentWeatherResponse)
async def get_current_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ALL_AUTHENTICATED)),
):
    """Current weather at given coordinates. Cached 10 minutes."""
    service = WeatherService()
    return await service.get_current_weather(latitude, longitude)


@router.get("/forecast", response_model=ForecastResponse)
async def get_forecast(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    days: int = Query(default=5, ge=1, le=7),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ALL_AUTHENTICATED)),
):
    """5-day forecast at given coordinates. Cached 1 hour."""
    service = WeatherService()
    return await service.get_forecast(latitude, longitude, days)


@router.get("/alerts", response_model=WeatherAlertsResponse)
async def get_weather_alerts(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ALL_AUTHENTICATED)),
):
    """Active weather alerts for given coordinates. Cached 5 minutes."""
    service = WeatherService()
    return await service.get_weather_alerts(latitude, longitude)
