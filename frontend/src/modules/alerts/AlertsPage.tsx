import { useEffect, useState, type ChangeEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { formatDistanceToNow } from "date-fns";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  fetchAlertsThunk,
  fetchAlertThunk,
  setFilters,
} from "@store/slices/alertSlice";
import type { AlertStatus, IncidentType, Severity } from "@types/alert.types";
import { SeverityChip, StatusChip } from "./AlertChips";
import AlertDetailDrawer from "./AlertDetailDrawer";
import CreateAlertDialog from "./CreateAlertDialog";

const STATUS_OPTIONS: Array<{ label: string; value: AlertStatus | "" }> = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Cancelled", value: "cancelled" },
];

const SEVERITY_OPTIONS: Array<{ label: string; value: Severity | "" }> = [
  { label: "All severities", value: "" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

const INCIDENT_OPTIONS: Array<{ label: string; value: IncidentType | "" }> = [
  { label: "All types", value: "" },
  { label: "Flood", value: "flood" },
  { label: "Fire", value: "fire" },
  { label: "Earthquake", value: "earthquake" },
  { label: "Accident", value: "accident" },
  { label: "Medical", value: "medical" },
  { label: "Rescue", value: "rescue" },
  { label: "Landslide", value: "landslide" },
  { label: "Cyclone", value: "cyclone" },
  { label: "Other", value: "other" },
];

export default function AlertsPage() {
  const dispatch = useAppDispatch();
  const { alerts, total, loading, error, filters } = useAppSelector((s) => s.alerts);
  const selectedAlert = useAppSelector((s) => s.alerts.selectedAlert);
  const user = useAppSelector((s) => s.auth.user);
  const [createOpen, setCreateOpen] = useState(false);

  const canEdit = user?.role === "admin" || user?.role === "operator";

  const load = () => dispatch(fetchAlertsThunk(filters));

  useEffect(() => { load(); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRowClick = (id: string) => dispatch(fetchAlertThunk(id));

  const handlePageChange = (_: unknown, page: number) => {
    dispatch(setFilters({ offset: page * (filters.limit ?? 20) }));
  };

  const handleRowsPerPageChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(setFilters({ limit: parseInt(e.target.value, 10), offset: 0 }));
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>
          Alerts
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={load} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
            >
              New Alert
            </Button>
          )}
        </Stack>
      </Box>

      {/* Filters */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          label="Status"
          value={filters.status ?? ""}
          onChange={(e) =>
            dispatch(setFilters({ status: (e.target.value as AlertStatus) || undefined, offset: 0 }))
          }
          sx={{ minWidth: 150 }}
        >
          {STATUS_OPTIONS.map(({ label, value }) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Severity"
          value={filters.severity ?? ""}
          onChange={(e) =>
            dispatch(setFilters({ severity: (e.target.value as Severity) || undefined, offset: 0 }))
          }
          sx={{ minWidth: 150 }}
        >
          {SEVERITY_OPTIONS.map(({ label, value }) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Incident Type"
          value={filters.incident_type ?? ""}
          onChange={(e) =>
            dispatch(setFilters({ incident_type: (e.target.value as IncidentType) || undefined, offset: 0 }))
          }
          sx={{ minWidth: 160 }}
        >
          {INCIDENT_OPTIONS.map(({ label, value }) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Reported</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No alerts found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleRowClick(alert.id)}
                    selected={selectedAlert?.id === alert.id}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {alert.title}
                      </Typography>
                      {alert.address && (
                        <Typography variant="caption" color="text.secondary">
                          {alert.address}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.incident_type}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <SeverityChip severity={alert.severity} />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={alert.status} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {alert.assigned_to_name ?? "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={Math.floor((filters.offset ?? 0) / (filters.limit ?? 20))}
          rowsPerPage={filters.limit ?? 20}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      <AlertDetailDrawer alert={selectedAlert} canEdit={canEdit} />
      <CreateAlertDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Box>
  );
}
