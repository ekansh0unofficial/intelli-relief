"""
WeatherService — fetches data from Open-Meteo (free, no API key, no account).
API docs: https://open-meteo.com/en/docs

Cache TTLs:
    Current weather : 10 minutes
    Forecast        : 60 minutes
    Alerts          : 5 minutes (derived from forecast thresholds)
"""

from datetime import datetime, timezone
from typing import List, Optional

import httpx
from loguru import logger

from app.core.event_bus import DomainEvent, Events, event_bus
from app.core.exceptions import ServiceUnavailableException
from app.infrastructure.cache import cache
from app.services.weather.schemas import (
    CurrentWeatherResponse,
    ForecastDay,
    ForecastResponse,
    WeatherAlert,
    WeatherAlertsResponse,
    WeatherLocation,
)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather code → (human label, icon slug)
_WMO: dict[int, tuple[str, str]] = {
    0:  ("Clear Sky",               "clear-sky"),
    1:  ("Mainly Clear",            "few-clouds"),
    2:  ("Partly Cloudy",           "partly-cloudy"),
    3:  ("Overcast",                "overcast"),
    45: ("Fog",                     "fog"),
    48: ("Rime Fog",                "fog"),
    51: ("Light Drizzle",           "drizzle"),
    53: ("Moderate Drizzle",        "drizzle"),
    55: ("Dense Drizzle",           "drizzle"),
    61: ("Slight Rain",             "rain"),
    63: ("Moderate Rain",           "rain"),
    65: ("Heavy Rain",              "rain"),
    71: ("Slight Snow",             "snow"),
    73: ("Moderate Snow",           "snow"),
    75: ("Heavy Snow",              "snow"),
    77: ("Snow Grains",             "snow"),
    80: ("Rain Showers",            "rain-showers"),
    81: ("Moderate Rain Showers",   "rain-showers"),
    82: ("Violent Rain Showers",    "rain-showers"),
    85: ("Snow Showers",            "snow-showers"),
    86: ("Heavy Snow Showers",      "snow-showers"),
    95: ("Thunderstorm",            "thunderstorm"),
    96: ("Thunderstorm with Hail",  "thunderstorm"),
    99: ("Thunderstorm, Heavy Hail","thunderstorm"),
}


def _wmo_label(code: int) -> str:
    return _WMO.get(code, ("Unknown", "unknown"))[0]


def _wmo_icon(code: int) -> str:
    return _WMO.get(code, ("Unknown", "unknown"))[1]


def _derive_alerts(
    max_wind: float,       # km/h
    max_precip: float,     # mm/day
    max_temp: float,       # °C
    min_temp: float,       # °C
    wmo_code: int,
    location_name: str,
) -> List[WeatherAlert]:
    alerts: List[WeatherAlert] = []
    now = datetime.now(timezone.utc).isoformat()

    if max_wind >= 90:
        alerts.append(WeatherAlert(
            id=f"wind-{now}",
            event="Cyclonic Wind Warning",
            severity="extreme",
            urgency="immediate",
            areas_affected=[location_name],
            description=f"Wind speeds up to {max_wind:.0f} km/h forecast. Seek shelter.",
            start_time=now, end_time=now, source="Open-Meteo threshold",
        ))
    elif max_wind >= 55:
        alerts.append(WeatherAlert(
            id=f"wind-{now}",
            event="Strong Wind Advisory",
            severity="severe",
            urgency="expected",
            areas_affected=[location_name],
            description=f"Wind speeds up to {max_wind:.0f} km/h forecast.",
            start_time=now, end_time=now, source="Open-Meteo threshold",
        ))

    if max_precip >= 100:
        alerts.append(WeatherAlert(
            id=f"rain-{now}",
            event="Extreme Rainfall Warning",
            severity="extreme",
            urgency="immediate",
            areas_affected=[location_name],
            description=f"Up to {max_precip:.0f} mm of rain forecast. Flash flood risk.",
            start_time=now, end_time=now, source="Open-Meteo threshold",
        ))
    elif max_precip >= 50:
        alerts.append(WeatherAlert(
            id=f"rain-{now}",
            event="Heavy Rain Warning",
            severity="moderate",
            urgency="expected",
            areas_affected=[location_name],
            description=f"Up to {max_precip:.0f} mm of rain forecast.",
            start_time=now, end_time=now, source="Open-Meteo threshold",
        ))

    if max_temp >= 42:
        alerts.append(WeatherAlert(
            id=f"heat-{now}",
            event="Extreme Heat Warning",
            severity="extreme",
            urgency="immediate",
            areas_affected=[location_name],
            description=f"Temperature forecast to reach {max_temp:.0f}°C. Heat stroke risk.",
            start_time=now, end_time=now, source="Open-Meteo threshold",
        ))

    if wmo_code in (95, 96, 99):
        alerts.append(WeatherAlert(
            id=f"thunder-{now}",
            event="Thunderstorm Warning",
            severity="moderate",
            urgency="immediate",
            areas_affected=[location_name],
            description="Thunderstorm conditions present. Risk of lightning and flash flooding.",
            start_time=now, end_time=now, source="Open-Meteo WMO code",
        ))

    return alerts


class WeatherService:

    async def get_current_weather(
        self, latitude: float, longitude: float
    ) -> CurrentWeatherResponse:
        cache_key = f"weather:current:{latitude:.4f}:{longitude:.4f}"
        cached = await cache.get(cache_key)
        if cached:
            return CurrentWeatherResponse(**cached)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    OPEN_METEO_URL,
                    params={
                        "latitude": latitude,
                        "longitude": longitude,
                        "current": ",".join([
                            "temperature_2m",
                            "relative_humidity_2m",
                            "apparent_temperature",
                            "weather_code",
                            "wind_speed_10m",
                            "wind_direction_10m",
                            "surface_pressure",
                            "cloud_cover",
                            "visibility",
                            "precipitation",
                        ]),
                        "daily": "sunrise,sunset",
                        "timezone": "auto",
                        "forecast_days": 1,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            logger.error("Open-Meteo current weather error: {}", exc)
            raise ServiceUnavailableException("Open-Meteo weather API")

        cur = data["current"]
        daily = data.get("daily", {})
        code = cur.get("weather_code", 0)
        # km/h → m/s for wind
        wind_ms = cur.get("wind_speed_10m", 0) / 3.6

        result = CurrentWeatherResponse(
            location=WeatherLocation(
                latitude=latitude,
                longitude=longitude,
                name=data.get("timezone", f"{latitude:.2f},{longitude:.2f}"),
            ),
            timestamp=cur.get("time", datetime.now(timezone.utc).isoformat()),
            temperature=cur.get("temperature_2m", 0.0),
            feels_like=cur.get("apparent_temperature", 0.0),
            humidity=int(cur.get("relative_humidity_2m", 0)),
            pressure=cur.get("surface_pressure", 0.0),
            wind_speed=round(wind_ms, 2),
            wind_direction=int(cur.get("wind_direction_10m", 0)),
            visibility=int(cur.get("visibility", 0)),
            cloud_cover=int(cur.get("cloud_cover", 0)),
            weather_main=_wmo_label(code).split()[0],
            weather_description=_wmo_label(code),
            weather_icon=_wmo_icon(code),
            sunrise=(daily.get("sunrise") or [""])[0],
            sunset=(daily.get("sunset") or [""])[0],
        )

        await cache.set(cache_key, result.model_dump(), ttl_seconds=600)
        await event_bus.publish(DomainEvent(
            event_type=Events.WEATHER_UPDATED,
            payload={
                "location": {"lat": latitude, "lng": longitude},
                "temperature": result.temperature,
                "weather_main": result.weather_main,
            },
        ))
        return result

    async def get_forecast(
        self, latitude: float, longitude: float, days: int = 5
    ) -> ForecastResponse:
        cache_key = f"weather:forecast:{latitude:.4f}:{longitude:.4f}:{days}"
        cached = await cache.get(cache_key)
        if cached:
            return ForecastResponse(**cached)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    OPEN_METEO_URL,
                    params={
                        "latitude": latitude,
                        "longitude": longitude,
                        "daily": ",".join([
                            "temperature_2m_max",
                            "temperature_2m_min",
                            "precipitation_probability_max",
                            "precipitation_sum",
                            "weather_code",
                        ]),
                        "timezone": "auto",
                        "forecast_days": days,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            logger.error("Open-Meteo forecast error: {}", exc)
            raise ServiceUnavailableException("Open-Meteo weather API")

        daily = data["daily"]
        forecasts = [
            ForecastDay(
                date=daily["time"][i],
                temperature_max=daily["temperature_2m_max"][i],
                temperature_min=daily["temperature_2m_min"][i],
                precipitation_chance=daily["precipitation_probability_max"][i] or 0,
                weather_main=_wmo_label(daily["weather_code"][i]).split()[0],
                weather_description=_wmo_label(daily["weather_code"][i]),
                weather_icon=_wmo_icon(daily["weather_code"][i]),
            )
            for i in range(len(daily["time"]))
        ]

        result = ForecastResponse(
            location=WeatherLocation(
                latitude=latitude,
                longitude=longitude,
                name=data.get("timezone", f"{latitude:.2f},{longitude:.2f}"),
            ),
            forecasts=forecasts,
        )
        await cache.set(cache_key, result.model_dump(), ttl_seconds=3600)
        return result

    async def get_weather_alerts(
        self, latitude: float, longitude: float
    ) -> WeatherAlertsResponse:
        cache_key = f"weather:alerts:{latitude:.4f}:{longitude:.4f}"
        cached = await cache.get(cache_key)
        if cached:
            return WeatherAlertsResponse(**cached)

        # Fetch 3-day forecast to derive threshold-based alerts
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    OPEN_METEO_URL,
                    params={
                        "latitude": latitude,
                        "longitude": longitude,
                        "daily": ",".join([
                            "temperature_2m_max",
                            "temperature_2m_min",
                            "precipitation_sum",
                            "wind_speed_10m_max",
                            "weather_code",
                        ]),
                        "timezone": "auto",
                        "forecast_days": 3,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            logger.warning("Open-Meteo alerts fetch error (non-critical): {}", exc)
            return WeatherAlertsResponse(alerts=[], total=0)

        daily = data["daily"]
        location_name = data.get("timezone", f"{latitude:.2f},{longitude:.2f}")

        max_wind = max((v or 0) for v in daily.get("wind_speed_10m_max", [0]))
        max_precip = max((v or 0) for v in daily.get("precipitation_sum", [0]))
        max_temp = max((v or 0) for v in daily.get("temperature_2m_max", [0]))
        min_temp = min((v or 0) for v in daily.get("temperature_2m_min", [0]))
        wmo_code = (daily.get("weather_code") or [0])[0]

        alerts = _derive_alerts(max_wind, max_precip, max_temp, min_temp, wmo_code, location_name)

        for alert in alerts:
            await event_bus.publish(DomainEvent(
                event_type=Events.WEATHER_ALERT_RECEIVED,
                payload={"event": alert.event, "severity": alert.severity},
            ))

        result = WeatherAlertsResponse(alerts=alerts, total=len(alerts))
        await cache.set(cache_key, result.model_dump(), ttl_seconds=300)
        return result
