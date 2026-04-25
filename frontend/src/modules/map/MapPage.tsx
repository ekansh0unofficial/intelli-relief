import { useEffect } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { fetchAlertsThunk } from "@store/slices/alertSlice";
import { fetchSheltersThunk } from "@store/slices/shelterSlice";
import AlertMap from "@components/AlertMap";

export default function MapPage() {
  const dispatch = useAppDispatch();
  const alerts   = useAppSelector((s) => s.alerts.alerts);
  const shelters = useAppSelector((s) => s.shelters.shelters);

  useEffect(() => {
    dispatch(fetchAlertsThunk({ limit: 100 }));
    dispatch(fetchSheltersThunk({ limit: 100 }));
  }, [dispatch]);

  const activeAlerts   = alerts.filter((a) => a.status !== "resolved" && a.status !== "cancelled");
  const activeShelters = shelters.filter((s) => s.status === "operational" || s.status === "full");

  return (
    <Box sx={{ height: "calc(100vh - 140px)", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Typography variant="h4" fontWeight={700}>Live Map</Typography>
        <Stack direction="row" spacing={1}>
          <Chip
            size="small"
            sx={{ bgcolor: "#dc262618", color: "#dc2626", fontWeight: 600 }}
            label={`${activeAlerts.length} active alerts`}
          />
          <Chip
            size="small"
            sx={{ bgcolor: "#10b98118", color: "#10b981", fontWeight: 600 }}
            label={`${activeShelters.length} shelters`}
          />
        </Stack>
      </Box>

      <Box sx={{ flex: 1, borderRadius: 1, overflow: "hidden", border: "1px solid #404040" }}>
        <AlertMap alerts={alerts} shelters={shelters} height="100%" />
      </Box>
    </Box>
  );
}
