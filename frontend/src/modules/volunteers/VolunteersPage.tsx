import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  fetchVolunteersThunk,
  createVolunteerThunk,
  approveVolunteerThunk,
  setFilters,
} from "@store/slices/volunteerSlice";
import type { VolunteerCreateRequest, VolunteerStatus } from "@types/volunteer.types";

const STATUS_COLOR: Record<VolunteerStatus, "default" | "warning" | "success" | "primary" | "error"> = {
  pending: "warning",
  approved: "success",
  active: "primary",
  inactive: "default",
  rejected: "error",
};

function RegisterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<VolunteerCreateRequest>();

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  const onSubmit = async (data: VolunteerCreateRequest) => {
    try {
      await dispatch(createVolunteerThunk(data)).unwrap();
      toast.success("Volunteer registered — pending approval");
      onClose();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Registration failed");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Register Volunteer</DialogTitle>
      <DialogContent>
        <Box component="form" id="register-volunteer-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField label="Full Name" fullWidth error={!!errors.full_name} helperText={errors.full_name?.message}
                {...register("full_name", { required: "Required" })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Email" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message}
                {...register("email", { required: "Required" })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Phone" fullWidth error={!!errors.phone} helperText={errors.phone?.message}
                {...register("phone", { required: "Required" })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" fullWidth multiline rows={2} {...register("notes")} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="register-volunteer-form" variant="contained" disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}>
          Register
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function VolunteersPage() {
  const dispatch = useAppDispatch();
  const { volunteers, total, loading, error, filters } = useAppSelector((s) => s.volunteers);
  const user = useAppSelector((s) => s.auth.user);
  const [registerOpen, setRegisterOpen] = useState(false);

  const canApprove = user?.role === "admin" || user?.role === "operator";
  const load = () => dispatch(fetchVolunteersThunk(filters));
  useEffect(() => { load(); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async (id: string, name: string) => {
    try {
      await dispatch(approveVolunteerThunk(id)).unwrap();
      toast.success(`${name} approved`);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to approve");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>Volunteers</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={load} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Button variant="outlined" onClick={() => setRegisterOpen(true)}>Register Volunteer</Button>
        </Stack>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField select size="small" label="Status"
          value={filters.status ?? ""}
          onChange={(e) => dispatch(setFilters({ status: (e.target.value as VolunteerStatus) || undefined, offset: 0 }))}
          sx={{ minWidth: 150 }}>
          <MenuItem value="">All statuses</MenuItem>
          {(["pending","approved","active","inactive","rejected"] as VolunteerStatus[]).map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Skills</TableCell>
                {canApprove && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && volunteers.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : volunteers.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No volunteers found</Typography></TableCell></TableRow>
              ) : (
                volunteers.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={500}>{v.full_name}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{v.email}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{v.phone}</Typography></TableCell>
                    <TableCell>
                      <Chip label={v.status} size="small" color={STATUS_COLOR[v.status]} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {v.skills.slice(0, 3).map((s) => (
                          <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                        ))}
                        {v.skills.length > 3 && (
                          <Chip label={`+${v.skills.length - 3}`} size="small" sx={{ fontSize: 11 }} />
                        )}
                      </Stack>
                    </TableCell>
                    {canApprove && (
                      <TableCell>
                        {v.status === "pending" && (
                          <Tooltip title="Approve volunteer">
                            <IconButton size="small" color="success" onClick={() => handleApprove(v.id, v.full_name)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={total}
          page={Math.floor((filters.offset ?? 0) / (filters.limit ?? 20))}
          rowsPerPage={filters.limit ?? 20}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={(_, p) => dispatch(setFilters({ offset: p * (filters.limit ?? 20) }))}
          onRowsPerPageChange={(e) => dispatch(setFilters({ limit: parseInt(e.target.value, 10), offset: 0 }))}
        />
      </Paper>

      <RegisterDialog open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </Box>
  );
}
