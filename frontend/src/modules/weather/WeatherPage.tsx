import { useEffect } from "react";
import type { ReactNode, ReactElement } from "react";
import {
  Alert as MuiAlert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AirIcon from "@mui/icons-material/Air";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  fetchCurrentWeatherThunk,
  fetchForecastThunk,
  fetchWeatherAlertsThunk,
} from "@store/slices/weatherSlice";

// Default coords — will become a user preference in a later sprint
const DEFAULT_LAT = 28.6139;
const DEFAULT_LON = 77.209;

function WeatherStatRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }): ReactElement {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.75 }}>
      <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ width: 90 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value}</Typography>
    </Stack>
  );
}

export default function WeatherPage() {
  const dispatch = useAppDispatch();
  const { current, forecast, alerts, loading, error } = useAppSelector((s) => s.weather);

  useEffect(() => {
    const params = { latitude: DEFAULT_LAT, longitude: DEFAULT_LON };
    dispatch(fetchCurrentWeatherThunk(params));
    dispatch(fetchForecastThunk(params));
    dispatch(fetchWeatherAlertsThunk(params));
  }, [dispatch]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Weather
      </Typography>

      {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}

      {/* Severe weather alerts */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {alerts.map((a, i) => (
            <MuiAlert key={i} severity="warning" sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>{a.event}</Typography>
              <Typography variant="caption">{a.description.slice(0, 200)}…</Typography>
            </MuiAlert>
          ))}
        </Box>
      )}

      {loading && !current ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : current ? (
        <Grid container spacing={2}>
          {/* Current conditions */}
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Current — {current.city}, {current.country}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Typography variant="h2" fontWeight={700}>
                    {Math.round(current.temperature)}°C
                  </Typography>
                  <Box>
                    <Typography variant="body1" color="text.secondary">
                      {current.conditions[0]?.description ?? ""}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Feels like {Math.round(current.feels_like)}°C
                    </Typography>
                  </Box>
                </Stack>
                <Divider sx={{ mb: 1.5 }} />
                <WeatherStatRow icon={<WaterDropIcon fontSize="small" />} label="Humidity" value={`${current.humidity}%`} />
                <WeatherStatRow icon={<AirIcon fontSize="small" />} label="Wind" value={`${current.wind_speed} m/s`} />
                <WeatherStatRow icon={<ThermostatIcon fontSize="small" />} label="Pressure" value={`${current.pressure} hPa`} />
                <WeatherStatRow icon={<VisibilityIcon fontSize="small" />} label="Visibility" value={`${(current.visibility / 1000).toFixed(1)} km`} />
              </CardContent>
            </Card>
          </Grid>

          {/* 5-day forecast */}
          {forecast && (
            <Grid item xs={12} md={7}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    5-Day Forecast
                  </Typography>
                  <Stack spacing={1}>
                    {forecast.daily.slice(0, 5).map((day) => (
                      <Box
                        key={day.date}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          py: 1,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <Typography variant="body2" fontWeight={500} sx={{ width: 80 }}>
                          {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, px: 1 }}>
                          {day.conditions[0]?.description ?? ""}
                        </Typography>
                        {day.precipitation_probability > 30 && (
                          <Chip
                            icon={<WaterDropIcon sx={{ fontSize: "14px !important" }} />}
                            label={`${Math.round(day.precipitation_probability)}%`}
                            size="small"
                            color="info"
                            sx={{ mr: 1, fontSize: 11 }}
                          />
                        )}
                        <Typography variant="body2">
                          <span style={{ color: "#f44336", fontWeight: 600 }}>{Math.round(day.temp_max)}°</span>
                          {" / "}
                          <span style={{ color: "#2196f3" }}>{Math.round(day.temp_min)}°</span>
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      ) : null}
    </Box>
  );
}
