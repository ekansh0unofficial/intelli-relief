import { useEffect, type ReactElement } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Stack, Typography } from "@mui/material";
import { SeverityChip, StatusChip } from "@modules/alerts/AlertChips";
import type { Alert } from "@types/alert.types";
import type { Shelter } from "@types/shelter.types";

// Fix Leaflet default marker icons broken by Vite asset hashing
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ALERT_ICON = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const SHELTER_ICON = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function FitBounds({ positions }: { positions: [number, number][] }): ReactElement | null {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 12);
    } else if (positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40], maxZoom: 13 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(positions)]);
  return null;
}

interface AlertMapProps {
  alerts: Alert[];
  shelters: Shelter[];
  height?: string | number;
}

/** Coordinates that were never geocoded default to (0,0) — skip them. */
function isValidCoord(lat: number, lon: number) {
  return !(Math.abs(lat) < 0.001 && Math.abs(lon) < 0.001);
}

export default function AlertMap({ alerts, shelters, height = "100%" }: AlertMapProps) {
  const activeAlerts = alerts.filter(
    (a) => a.status !== "resolved" && a.status !== "cancelled" && isValidCoord(a.latitude, a.longitude)
  );
  const activeShelters = shelters.filter(
    (s) => (s.status === "operational" || s.status === "full") && isValidCoord(s.latitude, s.longitude)
  );

  const allPositions: [number, number][] = [
    ...activeAlerts.map((a): [number, number] => [a.latitude, a.longitude]),
    ...activeShelters.map((s): [number, number] => [s.latitude, s.longitude]),
  ];

  const defaultCenter: [number, number] = [22.5937, 80.9629]; // India centre

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      style={{ height: typeof height === "number" ? `${height}px` : height, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {allPositions.length > 0 && <FitBounds positions={allPositions} />}

      {activeAlerts.map((alert) => (
        <Marker key={alert.id} position={[alert.latitude, alert.longitude]} icon={ALERT_ICON}>
          <Popup>
            <Box sx={{ minWidth: 180 }}>
              <Typography variant="body2" fontWeight={700} gutterBottom>
                {alert.title}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
                <SeverityChip severity={alert.severity} />
                <StatusChip status={alert.status} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {alert.incident_type} · {alert.address ?? `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`}
              </Typography>
            </Box>
          </Popup>
        </Marker>
      ))}

      {activeShelters.map((shelter) => (
        <Marker key={shelter.id} position={[shelter.latitude, shelter.longitude]} icon={SHELTER_ICON}>
          <Popup>
            <Box sx={{ minWidth: 180 }}>
              <Typography variant="body2" fontWeight={700} gutterBottom>
                {shelter.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {shelter.current_occupancy}/{shelter.total_capacity} occupied · {shelter.status}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                {shelter.address}
              </Typography>
            </Box>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
