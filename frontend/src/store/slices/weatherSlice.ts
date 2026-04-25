import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@services/apiClient";
import type {
  CurrentWeather,
  WeatherAlert,
  WeatherAlertsResponse,
  WeatherForecast,
  WeatherState,
} from "@types/weather.types";

const initialState: WeatherState = {
  current: null,
  forecast: null,
  alerts: [],
  loading: false,
  error: null,
};

export const fetchCurrentWeatherThunk = createAsyncThunk(
  "weather/fetchCurrent",
  async (
    params: { latitude: number; longitude: number },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await apiClient.get<CurrentWeather>("/weather/current", { params });
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch weather");
    }
  }
);

export const fetchForecastThunk = createAsyncThunk(
  "weather/fetchForecast",
  async (params: { latitude: number; longitude: number }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<WeatherForecast>("/weather/forecast", { params });
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch forecast");
    }
  }
);

export const fetchWeatherAlertsThunk = createAsyncThunk(
  "weather/fetchAlerts",
  async (params: { latitude: number; longitude: number }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<WeatherAlertsResponse>("/weather/alerts", { params });
      return data.alerts;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch weather alerts");
    }
  }
);

const weatherSlice = createSlice({
  name: "weather",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentWeatherThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentWeatherThunk.fulfilled, (state, action: PayloadAction<CurrentWeather>) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchCurrentWeatherThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchForecastThunk.fulfilled, (state, action: PayloadAction<WeatherForecast>) => {
        state.forecast = action.payload;
      })
      .addCase(fetchWeatherAlertsThunk.fulfilled, (state, action: PayloadAction<WeatherAlert[]>) => {
        state.alerts = action.payload;
      });
  },
});

export default weatherSlice.reducer;
