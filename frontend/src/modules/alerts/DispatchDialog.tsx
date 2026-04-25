import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import { toast } from "react-toastify";
import { useAppDispatch } from "@store/hooks";
import { createAssignmentThunk } from "@store/slices/assignmentSlice";
import apiClient from "@services/apiClient";
import type { Alert, Severity } from "@types/alert.types";
import type { AssignmentPriority } from "@types/assignment.types";

interface Responder {
  id: string;
  full_name: string;
  username: string;
  phone: string | null;
  is_active: boolean;
}

const SEVERITY_TO_PRIORITY: Record<Severity, AssignmentPriority> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
};

const ROLE_COLOR: Record<string, string> = {
  responder: "#3b82f6",
};

interface DispatchDialogProps {
  alert: Alert | null;
  open: boolean;
  onClose: () => void;
}

export default function DispatchDialog({ alert, open, onClose }: DispatchDialogProps) {
  const dispatch = useAppDispatch();
  const [responders, setResponders] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setResponders([]); return; }
    setLoading(true);
    apiClient
      .get<{ users: Responder[] }>("/users/responders")
      .then((r) => setResponders(r.data.users))
      .catch(() => toast.error("Failed to load responders"))
      .finally(() => setLoading(false));
  }, [open]);

  const handleDispatch = async (responder: Responder) => {
    if (!alert) return;
    setDispatching(responder.id);
    try {
      await dispatch(
        createAssignmentThunk({
          alert_id: alert.id,
          responder_id: responder.id,
          priority: SEVERITY_TO_PRIORITY[alert.severity],
        })
      ).unwrap();
      toast.success(`${responder.full_name} dispatched to ${alert.title}`);
      onClose();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Dispatch failed");
    } finally {
      setDispatching(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box>
          <Typography variant="h6">Dispatch Responder</Typography>
          {alert && (
            <Typography variant="caption" color="text.secondary">
              {alert.title} · {alert.severity.toUpperCase()}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : responders.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <PersonIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
            <Typography color="text.secondary" variant="body2">
              No active responders available
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />}>
            {responders.map((r) => (
              <Box
                key={r.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 2.5,
                  py: 1.75,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: `${ROLE_COLOR.responder}22`,
                    color: ROLE_COLOR.responder,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    borderRadius: "4px",
                  }}
                >
                  {r.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {r.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.phone ?? r.username}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  disabled={dispatching === r.id}
                  onClick={() => handleDispatch(r)}
                  sx={{
                    fontSize: "0.7rem",
                    px: 1.5,
                    py: 0.5,
                    minWidth: 80,
                    background: "#dc2626",
                    "&:hover": { background: "#991b1b" },
                  }}
                >
                  {dispatching === r.id ? <CircularProgress size={14} color="inherit" /> : "Dispatch"}
                </Button>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
