import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DispatchDialog from "./DispatchDialog";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";
import { geocodeAddress, isNullIsland } from "@utils/geocode";
import { useAppDispatch } from "@store/hooks";
import {
  addAlertUpdateThunk,
  updateAlertThunk,
  clearSelectedAlert,
} from "@store/slices/alertSlice";
import { SeverityChip, StatusChip } from "./AlertChips";
import type { Alert, AlertStatus, Severity } from "@types/alert.types";

const STATUSES: AlertStatus[] = ["pending", "in_progress", "resolved", "cancelled"];
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

interface AlertDetailDrawerProps {
  alert: Alert | null;
  canEdit: boolean;
}

export default function AlertDetailDrawer({ alert, canEdit }: AlertDetailDrawerProps) {
  const dispatch = useAppDispatch();
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [fixingCoords, setFixingCoords] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState("");
  const [addrGeoStatus, setAddrGeoStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [addrCoords, setAddrCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const { register, handleSubmit, reset, control, formState: { isSubmitting } } =
    useForm<{ update_text: string; status_change?: AlertStatus }>({ defaultValues: { update_text: "" } });

  const handleClose = () => {
    dispatch(clearSelectedAlert());
    reset();
    setAddingUpdate(false);
    setEditingAddress(false);
    setAddrGeoStatus("idle");
    setAddrCoords(null);
  };

  const handleStatusChange = async (status: AlertStatus) => {
    if (!alert) return;
    try {
      await dispatch(updateAlertThunk({ id: alert.id, payload: { status } })).unwrap();
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update status");
    }
  };

  const handleSeverityChange = async (severity: Severity) => {
    if (!alert) return;
    try {
      await dispatch(updateAlertThunk({ id: alert.id, payload: { severity } })).unwrap();
      toast.success("Severity updated");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update severity");
    }
  };

  const startEditAddress = () => {
    setAddressDraft(alert?.address ?? "");
    setAddrGeoStatus("idle");
    setAddrCoords(null);
    setEditingAddress(true);
  };

  const cancelEditAddress = () => {
    setEditingAddress(false);
    setAddrGeoStatus("idle");
    setAddrCoords(null);
  };

  const handleLocateAddress = async () => {
    if (!addressDraft.trim()) { toast.warning("Enter an address first"); return; }
    setAddrGeoStatus("loading");
    setAddrCoords(null);
    const result = await geocodeAddress(addressDraft);
    if (result) {
      setAddrCoords({ lat: result.lat, lon: result.lon });
      setAddrGeoStatus("ok");
    } else {
      setAddrGeoStatus("error");
    }
  };

  const handleSaveAddress = async () => {
    if (!alert) return;
    setSavingAddress(true);
    try {
      const payload: { address: string; latitude?: number; longitude?: number } = { address: addressDraft };
      if (addrCoords) { payload.latitude = addrCoords.lat; payload.longitude = addrCoords.lon; }
      await dispatch(updateAlertThunk({ id: alert.id, payload })).unwrap();
      toast.success("Address updated");
      setEditingAddress(false);
      setAddrGeoStatus("idle");
      setAddrCoords(null);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleFixCoords = async () => {
    if (!alert?.address) return;
    setFixingCoords(true);
    try {
      const result = await geocodeAddress(alert.address);
      if (result) {
        await dispatch(updateAlertThunk({ id: alert.id, payload: { latitude: result.lat, longitude: result.lon } })).unwrap();
        toast.success(`Coordinates fixed: ${result.lat.toFixed(4)}, ${result.lon.toFixed(4)}`);
      } else {
        toast.error("Could not geocode this address");
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to fix coordinates");
    } finally {
      setFixingCoords(false);
    }
  };

  const onSubmitUpdate = async (data: { update_text: string; status_change?: AlertStatus }) => {
    if (!alert) return;
    try {
      await dispatch(
        addAlertUpdateThunk({ id: alert.id, payload: data })
      ).unwrap();
      toast.success("Update added");
      reset();
      setAddingUpdate(false);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to add update");
    }
  };

  return (
    <Drawer anchor="right" open={!!alert} onClose={handleClose} PaperProps={{ sx: { width: 420 } }}>
      {alert && (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header */}
          <Box sx={{ p: 2, display: "flex", alignItems: "flex-start", gap: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {alert.title}
              </Typography>
              <Stack direction="row" spacing={1}>
                <SeverityChip severity={alert.severity} />
                <StatusChip status={alert.status} />
              </Stack>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />

          {/* Body */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {/* Details */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {alert.description}
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2 }}>
              <InfoRow label="Type" value={alert.incident_type} />
              <InfoRow label="Created by" value={alert.created_by_name} />
              <InfoRow label="Assigned to" value={alert.assigned_to_name ?? "Unassigned"} />
              <InfoRow
                label="Reported"
                value={formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
              />
              {alert.caller_name && <InfoRow label="Caller" value={alert.caller_name} />}
              {alert.caller_phone && <InfoRow label="Phone" value={alert.caller_phone} />}
              <InfoRow
                label="Coordinates"
                value={isNullIsland(alert.latitude, alert.longitude) ? "Not geocoded" : `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`}
              />
            </Box>

            {/* Address — editable when canEdit */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Address</Typography>
                {canEdit && !editingAddress && (
                  <Tooltip title="Edit address">
                    <IconButton size="small" onClick={startEditAddress} sx={{ p: 0.25 }}>
                      <EditIcon sx={{ fontSize: 14, color: "#a3a3a3" }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {!editingAddress ? (
                <Typography variant="body2" fontWeight={500}>
                  {alert.address ?? "—"}
                </Typography>
              ) : (
                <Box>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    maxRows={3}
                    value={addressDraft}
                    onChange={(e) => { setAddressDraft(e.target.value); setAddrGeoStatus("idle"); setAddrCoords(null); }}
                    placeholder="Enter address"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={handleLocateAddress}
                            disabled={addrGeoStatus === "loading"}
                            startIcon={addrGeoStatus === "loading" ? <CircularProgress size={12} /> : <MyLocationIcon sx={{ fontSize: 14 }} />}
                            sx={{
                              fontSize: "0.65rem", px: 1, py: 0.25, whiteSpace: "nowrap",
                              borderColor: "#404040", color: "#a3a3a3",
                              "&:hover": { borderColor: "#dc2626", color: "#dc2626" },
                            }}
                          >
                            Locate
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 0.75 }}
                  />
                  {addrGeoStatus === "ok" && addrCoords && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                      <CheckCircleIcon sx={{ fontSize: 14, color: "#10b981" }} />
                      <Typography sx={{ fontSize: "0.75rem", color: "#10b981" }}>
                        {addrCoords.lat.toFixed(4)}, {addrCoords.lon.toFixed(4)}
                      </Typography>
                    </Box>
                  )}
                  {addrGeoStatus === "error" && (
                    <Typography sx={{ fontSize: "0.75rem", color: "#dc2626", mb: 0.75 }}>
                      Could not locate — coordinates won't be updated
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={cancelEditAddress} disabled={savingAddress}
                      sx={{ fontSize: "0.7rem" }}>
                      Cancel
                    </Button>
                    <Button size="small" variant="contained" onClick={handleSaveAddress}
                      disabled={savingAddress || !addressDraft.trim()}
                      startIcon={savingAddress ? <CircularProgress size={12} color="inherit" /> : null}
                      sx={{ fontSize: "0.7rem", background: "#dc2626", "&:hover": { background: "#991b1b" } }}>
                      Save
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Fix coordinates — shown when alert has null-island coords and a valid address */}
            {canEdit && isNullIsland(alert.latitude, alert.longitude) && alert.address && (
              <Button
                size="small"
                variant="outlined"
                startIcon={fixingCoords ? <CircularProgress size={14} /> : <MyLocationIcon sx={{ fontSize: 16 }} />}
                disabled={fixingCoords}
                onClick={handleFixCoords}
                sx={{
                  mb: 2,
                  fontSize: "0.75rem",
                  borderColor: "#404040",
                  color: "#a3a3a3",
                  "&:hover": { borderColor: "#dc2626", color: "#dc2626" },
                }}
              >
                {fixingCoords ? "Locating…" : "Fix Coordinates"}
              </Button>
            )}

            {/* Quick-change controls */}
            {canEdit && alert.status === "pending" && (
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                fullWidth
                onClick={() => setDispatchOpen(true)}
                sx={{
                  mb: 2,
                  background: "#dc2626",
                  "&:hover": { background: "#991b1b" },
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                Dispatch Responder
              </Button>
            )}
            {canEdit && (
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={alert.status}
                  onChange={(e) => handleStatusChange(e.target.value as AlertStatus)}
                  sx={{ flex: 1 }}
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Severity"
                  value={alert.severity}
                  onChange={(e) => handleSeverityChange(e.target.value as Severity)}
                  sx={{ flex: 1 }}
                >
                  {SEVERITIES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* Updates timeline */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Updates ({alert.updates.length})
            </Typography>
            {alert.updates.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No updates yet
              </Typography>
            ) : (
              [...alert.updates]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((u) => (
                  <Box
                    key={u.id}
                    sx={{ mb: 1.5, pl: 1.5, borderLeft: "3px solid", borderColor: "primary.light" }}
                  >
                    <Typography variant="body2">{u.update_text}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {u.user_name} · {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                      {u.status_after && ` · → ${u.status_after}`}
                    </Typography>
                  </Box>
                ))
            )}

            {/* Add update form */}
            {canEdit && (
              <Box sx={{ mt: 2 }}>
                {addingUpdate ? (
                  <Box component="form" onSubmit={handleSubmit(onSubmitUpdate)}>
                    <TextField
                      label="Update text"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      sx={{ mb: 1 }}
                      {...register("update_text", { required: true })}
                    />
                    <Controller
                      name="status_change"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          select
                          size="small"
                          label="Change status (optional)"
                          fullWidth
                          sx={{ mb: 1 }}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        >
                          <MenuItem value="">No change</MenuItem>
                          {STATUSES.map((s) => (
                            <MenuItem key={s} value={s}>
                              {s.replace("_", " ")}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => { setAddingUpdate(false); reset(); }}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="small"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={14} /> : null}
                      >
                        Post
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Tooltip title="Add a status update or note">
                    <Button size="small" variant="outlined" onClick={() => setAddingUpdate(true)}>
                      + Add Update
                    </Button>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}
      <DispatchDialog
        alert={alert}
        open={dispatchOpen}
        onClose={() => setDispatchOpen(false)}
      />
    </Drawer>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}
