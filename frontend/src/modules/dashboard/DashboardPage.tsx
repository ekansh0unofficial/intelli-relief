import { useEffect, useRef } from "react";
import { Alert, Box, Card, CardContent, Grid, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import PeopleIcon from "@mui/icons-material/People";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { fetchDashboardStatsThunk, fetchRecentActivityThunk } from "@store/slices/dashboardSlice";
import { fetchAlertsThunk } from "@store/slices/alertSlice";
import { fetchSheltersThunk } from "@store/slices/shelterSlice";
import StatCard from "./StatCard";
import SeverityChart from "./SeverityChart";
import IncidentTypeChart from "./IncidentTypeChart";
import RecentActivityFeed from "./RecentActivityFeed";
import AlertMap from "@components/AlertMap";

const REFRESH_INTERVAL_MS = 30_000;

export default function DashboardPage() {
  const dispatch       = useAppDispatch();
  const { stats, recentActivity, loading, error } = useAppSelector((s) => s.dashboard);
  const alerts         = useAppSelector((s) => s.alerts.alerts);
  const shelters       = useAppSelector((s) => s.shelters.shelters);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = () => {
    dispatch(fetchDashboardStatsThunk());
    dispatch(fetchRecentActivityThunk(20));
    dispatch(fetchAlertsThunk({ limit: 100 }));
    dispatch(fetchSheltersThunk({ limit: 100 }));
  };

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          System Overview
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Auto-refreshes every 30 s
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── KPI stat cards ─────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Alerts"
            value={stats?.alerts.total ?? 0}
            subtitle={`${stats?.alerts.last_24h ?? 0} in last 24h`}
            Icon={WarningAmberIcon}
            color="#dc2626"
            loading={loading && !stats}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Assignments"
            value={stats?.assignments.active ?? 0}
            subtitle={`${stats?.assignments.total ?? 0} total`}
            Icon={AssignmentIcon}
            color="#3b82f6"
            loading={loading && !stats}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Shelter Capacity"
            value={stats ? `${stats.shelters.current_occupancy}/${stats.shelters.total_capacity}` : "—"}
            subtitle={`${stats?.shelters.available_capacity ?? 0} available`}
            Icon={HomeWorkIcon}
            color="#10b981"
            loading={loading && !stats}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Responders"
            value={stats?.responders.available ?? 0}
            subtitle={`of ${stats?.responders.total ?? 0} total`}
            Icon={PeopleIcon}
            color="#8b5cf6"
            loading={loading && !stats}
          />
        </Grid>
      </Grid>

      {/* ── Alert status summary ────────────────────────────────────── */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: "Pending",     value: stats.alerts.pending,     color: "#f59e0b" },
            { label: "In Progress", value: stats.alerts.in_progress, color: "#3b82f6" },
            { label: "Resolved",    value: stats.alerts.resolved,    color: "#10b981" },
          ].map(({ label, value, color }) => (
            <Grid item xs={4} key={label}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#1c1c1c",
                  border: "1px solid #404040",
                  borderLeft: `4px solid ${color}`,
                  borderRadius: "4px",
                  textAlign: "center",
                  transition: "all 0.25s ease",
                  "&:hover": { transform: "translateY(-2px)" },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: "2rem",
                    fontWeight: 700,
                    color,
                    lineHeight: 1.1,
                  }}
                >
                  {value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    color: "#a3a3a3",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Charts row ─────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SeverityChart data={stats?.alerts.by_severity ?? {}} />
        </Grid>
        <Grid item xs={12} md={6}>
          <IncidentTypeChart data={stats?.alerts.by_incident_type ?? {}} />
        </Grid>
      </Grid>

      {/* ── Alert distribution map + recent activity ───────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: 440 }}>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", p: "16px !important" }}>
              <Typography variant="h6" gutterBottom>
                Alert Distribution
              </Typography>
              <Box sx={{ flex: 1, borderRadius: "4px", overflow: "hidden", border: "1px solid #404040" }}>
                <AlertMap alerts={alerts} shelters={shelters} height="100%" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <RecentActivityFeed
            activities={recentActivity}
            loading={loading && recentActivity.length === 0}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
