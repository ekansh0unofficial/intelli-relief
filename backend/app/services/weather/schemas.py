from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class WeatherLocation(BaseModel):
    latitude: float
    longitude: float
    name: str


class CurrentWeatherResponse(BaseModel):
    location: WeatherLocation
    timestamp: str
    temperature: float          # Celsius
    feels_like: float
    humidity: int               # Percentage
    pressure: float             # hPa
    wind_speed: float           # m/s
    wind_direction: int         # Degrees
    visibility: int             # Metres
    cloud_cover: int            # Percentage
    weather_main: str           # e.g. "Clear", "Rain"
    weather_description: str
    weather_icon: str
    sunrise: str                # ISO 8601
    sunset: str


class ForecastDay(BaseModel):
    date: str
    temperature_max: float
    temperature_min: float
    precipitation_chance: float
    weather_main: str
    weather_description: str
    weather_icon: str


class ForecastResponse(BaseModel):
    location: WeatherLocation
    forecasts: List[ForecastDay]


class WeatherAlert(BaseModel):
    id: str
    event: str
    severity: str
    urgency: str
    areas_affected: List[str]
    description: str
    start_time: str
    end_time: str
    source: str


class WeatherAlertsResponse(BaseModel):
    alerts: List[WeatherAlert]
    total: int
