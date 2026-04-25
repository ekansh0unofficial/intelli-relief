import { useEffect } from "react";
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
import RefreshIcon from "@mui/icons-material/Refresh";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  fetchAssignmentsThunk,
  updateAssignmentStatusThunk,
  setFilters,
} from "@store/slices/assignmentSlice";
import type {
  AssignmentPriority,
  AssignmentStatus,
} from "@types/assignment.types";

const STATUS_COLOR: Record<AssignmentStatus, "default" | "warning" | "primary" | "info" | "success" | "error"> = {
  pending: "warning",
  acknowledged: "info",
  en_route: "primary",
  on_scene: "info",
  completed: "success",
  cancelled: "error",
};

const PRIORITY_COLOR: Record<AssignmentPriority, "default" | "success" | "warning" | "error"> = {
  low: "success",
  medium: "default",
  high: "warning",
  critical: "error",
};

const NEXT_STATUSES: Partial<Record<AssignmentStatus, AssignmentStatus[]>> = {
  pending: ["acknowledged", "cancelled"],
  acknowledged: ["en_route", "cancelled"],
  en_route: ["on_scene", "cancelled"],
  on_scene: ["completed", "cancelled"],
};

export default function AssignmentsPage() {
  const dispatch = useAppDispatch();
  const { assignments, total, loading, error, filters } = useAppSelector((s) => s.assignments);

  const load = () => dispatch(fetchAssignmentsThunk(filters));
  useEffect(() => { load(); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusAdvance = async (id: string, status: AssignmentStatus) => {
    try {
      await dispatch(updateAssignmentStatusThunk({ id, payload: { status } })).unwrap();
      toast.success(`Status → ${status.replace("_", " ")}`);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>Assignments</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={load} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Status filter */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          select size="small" label="Status"
          value={filters.status ?? ""}
          onChange={(e) =>
            dispatch(setFilters({ status: (e.target.value as AssignmentStatus) || undefined, offset: 0 }))
          }
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {(["pending","acknowledged","en_route","on_scene","completed","cancelled"] as AssignmentStatus[]).map((s) => (
            <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Alert</TableCell>
                <TableCell>Responder</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No assignments found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{a.alert_title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{a.responder_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={a.priority} size="small" color={PRIORITY_COLOR[a.priority]} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.status.replace("_", " ")}
                        size="small"
                        color={STATUS_COLOR[a.status]}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(a.assigned_at), { addSuffix: true })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {(NEXT_STATUSES[a.status] ?? []).map((next) => (
                          <Button
                            key={next}
                            size="small"
                            variant="outlined"
                            color={next === "cancelled" ? "error" : "primary"}
                            onClick={() => handleStatusAdvance(a.id, next)}
                            sx={{ fontSize: 11, py: 0.3, px: 1 }}
                          >
                            {next.replace("_", " ")}
                          </Button>
                        ))}
                      </Stack>
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
          onPageChange={(_, p) => dispatch(setFilters({ offset: p * (filters.limit ?? 20) }))}
          onRowsPerPageChange={(e) => dispatch(setFilters({ limit: parseInt(e.target.value, 10), offset: 0 }))}
        />
      </Paper>
    </Box>
  );
}
