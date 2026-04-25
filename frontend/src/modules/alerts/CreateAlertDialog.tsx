import { useEffect, useRef, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Button,
  CircularProgress,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { toast } from "react-toastify";
import { useAppDispatch } from "@store/hooks";
import { createAlertThunk } from "@store/slices/alertSlice";
import { geocodeAddress } from "@utils/geocode";
import apiClient from "@services/apiClient";
import type {
  AlertCreateRequest,
  AlertInferResponse,
  IncidentType,
  Severity,
  TranscribeResponse,
} from "@types/alert.types";

const INCIDENT_TYPES: IncidentType[] = [
  "flood", "fire", "earthquake", "accident", "medical", "rescue", "landslide", "cyclone", "other",
];
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];
const SEVERITY_COLOR: Record<Severity, string> = {
  low: "#10b981", medium: "#f59e0b", high: "#f97316", critical: "#dc2626",
};

// Debounce: wait this long after user stops typing before inferring
const INFER_DEBOUNCE_MS = 900;
const GEOCODE_DEBOUNCE_MS = 800;

interface Props { open: boolean; onClose: () => void; }
type GeoStatus = "idle" | "loading" | "ok" | "error";
type MicState  = "idle" | "recording" | "transcribing";

export default function CreateAlertDialog({ open, onClose }: Props) {
  const dispatch = useAppDispatch();

  const [geoStatus, setGeoStatus]   = useState<GeoStatus>("idle");
  const [geoLabel, setGeoLabel]     = useState("");
  const [showManual, setShowManual] = useState(false);
  const [micState, setMicState]     = useState<MicState>("idle");
  const [micError, setMicError]     = useState<string | null>(null);
  const [inferChips, setInferChips] = useState<AlertInferResponse | null>(null);
  const [inferring, setInferring]   = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const inferTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geoTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register, handleSubmit, control, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<AlertCreateRequest>({
    defaultValues: { severity: "medium", incident_type: "other" },
  });

  const lat = watch("latitude");
  const lon = watch("longitude");
  const hasValidCoords = Math.abs(lat ?? 0) > 0.001 || Math.abs(lon ?? 0) > 0.001;

  // ── Reset on close ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      reset();
      setGeoStatus("idle"); setGeoLabel(""); setShowManual(false);
      setMicState("idle"); setMicError(null); setInferChips(null); setInferring(false);
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      if (inferTimerRef.current) clearTimeout(inferTimerRef.current);
      if (geoTimerRef.current)   clearTimeout(geoTimerRef.current);
    }
  }, [open, reset]);

  // ── Auto-infer on description change (debounced) ──────────────────────────
  const runInfer = useCallback(async (description: string, address?: string) => {
    if (description.trim().length < 20) return;
    setInferring(true);
    try {
      const { data } = await apiClient.post<AlertInferResponse>("/alerts/infer", {
        description: description.trim(),
        address: address?.trim() || undefined,
      });
      setInferChips(data);
      setValue("title",         data.title,         { shouldDirty: false });
      setValue("incident_type", data.incident_type, { shouldDirty: false });
      setValue("severity",      data.severity,      { shouldDirty: false });
      if (data.geocoding_succeeded && data.latitude && data.longitude) {
        setValue("latitude",  data.latitude,  { shouldValidate: true });
        setValue("longitude", data.longitude, { shouldValidate: true });
        setGeoLabel(`${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`);
        setGeoStatus("ok");
      }
    } catch {
      // silent — inference is best-effort
    } finally {
      setInferring(false);
    }
  }, [setValue]);

  const handleDescriptionChange = (value: string) => {
    if (inferTimerRef.current) clearTimeout(inferTimerRef.current);
    if (value.trim().length >= 20) {
      inferTimerRef.current = setTimeout(() => {
        runInfer(value, watch("address"));
      }, INFER_DEBOUNCE_MS);
    }
  };

  // ── Auto-geocode on address blur ──────────────────────────────────────────
  const handleAddressBlur = async (address: string) => {
    if (!address.trim() || geoStatus === "ok") return;
    setGeoStatus("loading");
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

  // Manual locate button (if user wants to re-trigger)
  const handleLocate = () => {
    const addr = watch("address") ?? "";
    if (!addr.trim()) { toast.warning("Enter an address first"); return; }
    setGeoStatus("idle");
    handleAddressBlur(addr);
  };

  // ── Voice recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        sendToTranscribe(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setMicState("recording");
    } catch {
      setMicError("Mic access denied — allow microphone permission and retry.");
      setMicState("idle");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setMicState("transcribing");
  };

  const sendToTranscribe = async (blob: Blob) => {
    const fd = new FormData();
    fd.append("file", blob, "recording.webm");
    try {
      const { data } = await apiClient.post<TranscribeResponse>("/transcribe", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Fill description; the debounced infer will fire automatically
      setValue("description", data.transcript);
      handleDescriptionChange(data.transcript);
      toast.success("Voice captured — fields auto-filling…");
    } catch {
      setMicError("Transcription failed. Type your description manually.");
    } finally {
      setMicState("idle");
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: AlertCreateRequest) => {
    try {
      await dispatch(createAlertThunk(data)).unwrap();
      toast.success("Alert created");
      onClose();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to create alert");
    }
  };

  const micBusy = micState !== "idle";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Alert</DialogTitle>
      <DialogContent>
        <Box component="form" id="create-alert-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>

            {/* Title — auto-filled */}
            <Grid item xs={12}>
              <TextField
                label="Title"
                fullWidth
                placeholder="Auto-filled from description"
                InputLabelProps={{ shrink: true }}
                {...register("title")}
                InputProps={{
                  endAdornment: inferring
                    ? <InputAdornment position="end"><CircularProgress size={14} /></InputAdornment>
                    : null,
                }}
              />
            </Grid>

            {/* Description + mic */}
            <Grid item xs={12}>
              <TextField
                label="Description *"
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the incident — or tap the mic to speak"
                error={!!errors.description}
                helperText={errors.description?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ alignSelf: "flex-start", mt: 1 }}>
                      <Tooltip title={
                        micState === "idle"      ? "Record voice description" :
                        micState === "recording" ? "Stop recording" : "Transcribing…"
                      }>
                        <span>
                          <IconButton
                            size="small"
                            onClick={micState === "recording" ? stopRecording : startRecording}
                            disabled={micState === "transcribing"}
                            sx={{
                              color: micState === "recording" ? "#dc2626" : "#6b7280",
                              animation: micState === "recording" ? "pulse 1.2s infinite" : "none",
                              "@keyframes pulse": {
                                "0%,100%": { opacity: 1 },
                                "50%":     { opacity: 0.35 },
                              },
                            }}
                          >
                            {micState === "transcribing"
                              ? <CircularProgress size={18} />
                              : micState === "recording"
                              ? <StopIcon fontSize="small" />
                              : <MicIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                {...register("description", {
                  required: "Description is required",
                  minLength: { value: 20, message: "At least 20 characters" },
                  onChange:  (e) => handleDescriptionChange(e.target.value),
                })}
              />
              {micError && (
                <Typography sx={{ fontSize: "0.75rem", color: "#dc2626", mt: 0.5, ml: 1.5 }}>
                  {micError}
                </Typography>
              )}
            </Grid>

            {/* Auto-inferred chips */}
            {inferChips && (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", ml: 0.5 }}>
                  <Chip size="small" label={`Auto: ${inferChips.incident_type}`}
                    sx={{ fontSize: "0.7rem", bgcolor: "#1e1e2e", color: "#a3a3a3" }} />
                  <Chip size="small" label={inferChips.severity}
                    sx={{ fontSize: "0.7rem", bgcolor: "#1e1e2e", color: SEVERITY_COLOR[inferChips.severity] }} />
                  {inferChips.geocoding_succeeded && (
                    <Chip size="small"
                      icon={<CheckCircleIcon sx={{ fontSize: "12px !important", color: "#10b981 !important" }} />}
                      label="Coords resolved"
                      sx={{ fontSize: "0.7rem", bgcolor: "#1e1e2e", color: "#10b981" }} />
                  )}
                </Box>
              </Grid>
            )}

            {/* Incident Type + Severity */}
            <Grid item xs={6}>
              <Controller name="incident_type" control={control}
                render={({ field }) => (
                  <TextField select label="Incident Type" fullWidth {...field} value={field.value ?? "other"}>
                    {INCIDENT_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller name="severity" control={control}
                render={({ field }) => (
                  <TextField select label="Severity" fullWidth {...field} value={field.value ?? "medium"}>
                    {SEVERITIES.map((s) => (
                      <MenuItem key={s} value={s} sx={{ color: SEVERITY_COLOR[s] }}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Address — auto-geocodes on blur */}
            <Grid item xs={12}>
              <TextField
                label="Address / Location"
                fullWidth
                placeholder="e.g. Sector 17, Chandigarh, Punjab"
                helperText={errors.address?.message ?? "Leave field and coordinates resolve automatically"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {geoStatus === "loading"
                        ? <CircularProgress size={16} sx={{ mr: 1 }} />
                        : (
                          <Button size="small" variant="outlined" onClick={handleLocate}
                            sx={{
                              fontSize: "0.7rem", px: 1.5, py: 0.5, whiteSpace: "nowrap",
                              borderColor: "#404040", color: "#a3a3a3",
                              "&:hover": { borderColor: "#dc2626", color: "#dc2626" },
                            }}
                            startIcon={<MyLocationIcon sx={{ fontSize: 16 }} />}
                          >
                            Locate
                          </Button>
                        )}
                    </InputAdornment>
                  ),
                }}
                {...register("address", {
                  onBlur: (e) => handleAddressBlur(e.target.value),
                })}
              />
            </Grid>

            {/* Geocode feedback */}
            {geoStatus === "ok" && (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: "#10b981" }} />
                  <Typography sx={{ fontSize: "0.8rem", color: "#10b981", flex: 1 }}>
                    {geoLabel}
                  </Typography>
                  <Button size="small" sx={{ fontSize: "0.7rem", color: "#6b7280" }}
                    onClick={() => setShowManual((v) => !v)}>
                    {showManual ? "Hide" : "Edit"}
                  </Button>
                </Box>
              </Grid>
            )}
            {geoStatus === "error" && (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1 }}>
                  <ErrorIcon sx={{ fontSize: 16, color: "#dc2626" }} />
                  <Typography sx={{ fontSize: "0.8rem", color: "#dc2626" }}>
                    Could not resolve.{" "}
                    <Box component="span" sx={{ textDecoration: "underline", cursor: "pointer" }}
                      onClick={() => setShowManual(true)}>
                      Enter coordinates manually
                    </Box>.
                  </Typography>
                </Box>
              </Grid>
            )}
            {geoStatus === "idle" && (
              <Grid item xs={12}>
                <Box component="span"
                  sx={{ fontSize: "0.75rem", color: "#525252", cursor: "pointer",
                        textDecoration: "underline", px: 1 }}
                  onClick={() => setShowManual((v) => !v)}>
                  Enter coordinates manually
                </Box>
              </Grid>
            )}

            {/* Manual lat/lon */}
            <Grid item xs={12}>
              <Collapse in={showManual || geoStatus === "ok"}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField label="Latitude" type="number" fullWidth size="small"
                      error={!!errors.latitude} helperText={errors.latitude?.message}
                      inputProps={{ step: "any" }}
                      InputProps={{ readOnly: geoStatus === "ok" && !showManual }}
                      {...register("latitude", {
                        valueAsNumber: true,
                        min: { value: -90,  message: "Min -90" },
                        max: { value: 90,   message: "Max 90"  },
                      })} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Longitude" type="number" fullWidth size="small"
                      error={!!errors.longitude} helperText={errors.longitude?.message}
                      inputProps={{ step: "any" }}
                      InputProps={{ readOnly: geoStatus === "ok" && !showManual }}
                      {...register("longitude", {
                        valueAsNumber: true,
                        min: { value: -180, message: "Min -180" },
                        max: { value: 180,  message: "Max 180"  },
                      })} />
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>

            {/* Caller info */}
            <Grid item xs={6}>
              <TextField label="Caller Name" fullWidth {...register("caller_name")} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Caller Phone" fullWidth {...register("caller_phone")} />
            </Grid>

          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting || micBusy}>Cancel</Button>
        <Button type="submit" form="create-alert-form" variant="contained"
          disabled={isSubmitting || micBusy}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}>
          Create Alert
        </Button>
      </DialogActions>
    </Dialog>
  );
}
