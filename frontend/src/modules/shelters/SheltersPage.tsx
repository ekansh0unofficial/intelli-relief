import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
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
import EditIcon from "@mui/icons-material/Edit";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { geocodeAddress } from "@utils/geocode";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  fetchSheltersThunk,
  createShelterThunk,
  updateShelterThunk,
  setFilters,
} from "@store/slices/shelterSlice";
import type { Shelter, ShelterCreateRequest, ShelterStatus, ShelterType } from "@types/shelter.types";

const STATUS_COLOR: Record<ShelterStatus, "success" | "error" | "warning" | "default"> = {
  operational: "success",
  full: "warning",
  closed: "error",
  damaged: "default",
};

const SHELTER_TYPES: ShelterType[] = [
  "school", "community_center", "stadium", "temporary", "other",
];

function OccupancyBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const color = pct >= 95 ? "error" : pct >= 75 ? "warning" : "success";
  return (
    <Box sx={{ minWidth: 100 }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color}
        sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
      />
      <Typography variant="caption" color="text.secondary">
        {current}/{total}
      </Typography>
    </Box>
  );
}

type GeoStatus = "idle" | "loading" | "ok" | "error";

function CreateShelterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [geoStatus, setGeoStatus]   = useState<GeoStatus>("idle");
  const [geoLabel, setGeoLabel]     = useState("");
  const [showManual, setShowManual] = useState(false);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<ShelterCreateRequest>({
      defaultValues: { type: "other", total_capacity: 100, current_occupancy: 0, latitude: 0, longitude: 0 },
    });

  const lat = watch("latitude");
  const lon = watch("longitude");
  const hasValidCoords = Math.abs(lat ?? 0) > 0.001 || Math.abs(lon ?? 0) > 0.001;

  useEffect(() => {
    if (!open) { reset(); setGeoStatus("idle"); setGeoLabel(""); setShowManual(false); }
  }, [open, reset]);

  const handleLocate = async () => {
    const address = watch("address") ?? "";
    if (!address.trim()) { toast.warning("Enter an address first"); return; }
    setGeoStatus("loading");
    setGeoLabel("");
    const result = await geocodeAddress(address);
    if (result) {
      setValue("latitude",  result.lat, { shouldValidate: true });
      setValue("longitude", result.lon, { shouldValidate: true });
      setGeoLabel(result.displayName ?? `${result.lat.toFixed(5)}, ${result.lon.toFixed(5)}`);
      setGeoStatus("ok");
    } else {
      setGeoStatus("error");
    }
  };

  const onSubmit = async (data: ShelterCreateRequest) => {
    if (!hasValidCoords) { toast.warning("Please locate the address before submitting"); return; }
    try {
      await dispatch(createShelterThunk(data)).unwrap();
      toast.success("Shelter created");
      onClose();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to create shelter");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Shelter</DialogTitle>
      <DialogContent>
        <Box component="form" id="create-shelter-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField label="Name" fullWidth error={!!errors.name} helperText={errors.name?.message}
                {...register("name", { required: "Required" })} />
            </Grid>
            <Grid item xs={6}>
              <Controller name="type" control={control} render={({ field }) => (
                <TextField select label="Type" fullWidth {...field}>
                  {SHELTER_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t.replace(/_/g, " ")}</MenuItem>
                  ))}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Total Capacity" type="number" fullWidth
                {...register("total_capacity", { required: true, valueAsNumber: true, min: 1 })} />
            </Grid>

            {/* Address + Locate */}
            <Grid item xs={12}>
              <TextField
                label="Address / Location"
                fullWidth
                placeholder="e.g. Sector 17, Chandigarh, Punjab"
                error={!!errors.address}
                helperText={errors.address?.message ?? "Type the shelter address — coordinates will be resolved automatically"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleLocate}
                        disabled={geoStatus === "loading"}
                        startIcon={
                          geoStatus === "loading"
                            ? <CircularProgress size={14} />
                            : <MyLocationIcon sx={{ fontSize: 16 }} />
                        }
                        sx={{
                          fontSize: "0.7rem", px: 1.5, py: 0.5, whiteSpace: "nowrap",
                          borderColor: "#404040", color: "#a3a3a3",
                          "&:hover": { borderColor: "#dc2626", color: "#dc2626" },
                        }}
                      >
                        Locate
                      </Button>
                    </InputAdornment>
                  ),
                }}
                {...register("address", { required: "Required" })}
              />
            </Grid>

            {/* Geocode feedback */}
            {geoStatus === "ok" && (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: "#10b981" }} />
                  <Typography sx={{ fontSize: "0.8rem", color: "#10b981", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Located: {geoLabel}
                  </Typography>
                  <Button size="small" sx={{ fontSize: "0.7rem", color: "#a3a3a3", flexShrink: 0 }}
                    onClick={() => setShowManual((v) => !v)}>
                    {showManual ? "Hide" : "Edit"} coordinates
                  </Button>
                </Box>
              </Grid>
            )}
            {geoStatus === "error" && (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1 }}>
                  <ErrorIcon sx={{ fontSize: 16, color: "#dc2626" }} />
                  <Typography sx={{ fontSize: "0.8rem", color: "#dc2626" }}>
                    Could not locate this address. Try a more specific address, or&nbsp;
                    <Box component="span" sx={{ textDecoration: "underline", cursor: "pointer" }}
                      onClick={() => setShowManual(true)}>
                      enter coordinates manually
                    </Box>.
                  </Typography>
                </Box>
              </Grid>
            )}
            {geoStatus === "idle" && (
              <Grid item xs={12}>
                <Box sx={{ px: 1 }}>
                  <Box component="span"
                    sx={{ fontSize: "0.75rem", color: "#525252", cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => setShowManual((v) => !v)}>
                    Enter coordinates manually instead
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Collapsible lat/lon */}
            <Grid item xs={12}>
              <Collapse in={showManual || geoStatus === "ok"}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField label="Latitude" type="number" fullWidth size="small"
                      inputProps={{ step: "any" }}
                      InputProps={{ readOnly: geoStatus === "ok" && !showManual }}
                      {...register("latitude", { required: "Required", valueAsNumber: true, min: { value: -90, message: "Min -90" }, max: { value: 90, message: "Max 90" } })} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Longitude" type="number" fullWidth size="small"
                      inputProps={{ step: "any" }}
                      InputProps={{ readOnly: geoStatus === "ok" && !showManual }}
                      {...register("longitude", { required: "Required", valueAsNumber: true, min: { value: -180, message: "Min -180" }, max: { value: 180, message: "Max 180" } })} />
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>

            <Grid item xs={6}>
              <TextField label="Current Occupancy" type="number" fullWidth
                {...register("current_occupancy", { valueAsNumber: true, min: 0 })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Contact Phone" fullWidth {...register("contact_phone")} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Contact Name" fullWidth {...register("contact_person")} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="create-shelter-form" variant="contained"
          disabled={isSubmitting || (!hasValidCoords && geoStatus !== "ok")}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}>
          Create Shelter
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditOccupancyDialog({ shelter, onClose }: { shelter: Shelter | null; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { register, handleSubmit, reset, formState: { isSubmitting } } =
    useForm<{ current_occupancy: number }>({ values: { current_occupancy: shelter?.current_occupancy ?? 0 } });

  const onSubmit = async (data: { current_occupancy: number }) => {
    if (!shelter) return;
    try {
      await dispatch(updateShelterThunk({ id: shelter.id, payload: { current_occupancy: data.current_occupancy } })).unwrap();
      toast.success("Occupancy updated");
      onClose();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update");
    }
  };

  return (
    <Dialog open={!!shelter} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Update Occupancy — {shelter?.name}</DialogTitle>
      <DialogContent>
        <Box component="form" id="edit-occupancy-form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
          <TextField label="Current Occupancy" type="number" fullWidth
            inputProps={{ min: 0, max: shelter?.total_capacity }}
            {...register("current_occupancy", { valueAsNumber: true, min: 0 })} />
          <Typography variant="caption" color="text.secondary">
            Max capacity: {shelter?.total_capacity}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="edit-occupancy-form" variant="contained" disabled={isSubmitting}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function SheltersPage() {
  const dispatch = useAppDispatch();
  const { shelters, total, loading, error, filters } = useAppSelector((s) => s.shelters);
  const user = useAppSelector((s) => s.auth.user);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);

  const canEdit = user?.role === "admin" || user?.role === "operator";
  const load = () => dispatch(fetchSheltersThunk(filters));
  useEffect(() => { load(); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>Shelters</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={load} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              New Shelter
            </Button>
          )}
        </Stack>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField select size="small" label="Status"
          value={filters.status ?? ""}
          onChange={(e) => dispatch(setFilters({ status: (e.target.value as ShelterStatus) || undefined, offset: 0 }))}
          sx={{ minWidth: 150 }}>
          <MenuItem value="">All statuses</MenuItem>
          {(["operational","full","closed","damaged"] as ShelterStatus[]).map((s) => (
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
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Occupancy</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Contact</TableCell>
                {canEdit && <TableCell>Edit</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && shelters.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : shelters.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No shelters found</Typography></TableCell></TableRow>
              ) : (
                shelters.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{s.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={s.type.replace(/_/g, " ")} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={s.status} size="small" color={STATUS_COLOR[s.status]} />
                    </TableCell>
                    <TableCell>
                      <OccupancyBar current={s.current_occupancy} total={s.total_capacity} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>{s.address}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.contact_person ?? "—"}</Typography>
                      {s.contact_phone && <Typography variant="caption" color="text.secondary">{s.contact_phone}</Typography>}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Tooltip title="Update occupancy">
                          <IconButton size="small" onClick={() => setEditingShelter(s)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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

      <CreateShelterDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditOccupancyDialog shelter={editingShelter} onClose={() => setEditingShelter(null)} />
    </Box>
  );
}
