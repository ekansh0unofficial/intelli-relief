export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  visibility: number;
  conditions: WeatherCondition[];
  sunrise: string;
  sunset: string;
  timestamp: string;
}

export interface DailyForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  temp_avg: number;
  humidity: number;
  wind_speed: number;
  conditions: WeatherCondition[];
  precipitation_probability: number;
}

export interface WeatherForecast {
  city: string;
  country: string;
  daily: DailyForecast[];
}

export interface WeatherAlert {
  sender_name: string;
  event: string;
  start: string;
  end: string;
  description: string;
  tags: string[];
}

export interface WeatherAlertsResponse {
  city: string;
  alerts: WeatherAlert[];
}

export interface WeatherState {
  current: CurrentWeather | null;
  forecast: WeatherForecast | null;
  alerts: WeatherAlert[];
  loading: boolean;
  error: string | null;
}
