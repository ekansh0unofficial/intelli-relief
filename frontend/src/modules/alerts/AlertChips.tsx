import { Chip } from "@mui/material";
import type { AlertStatus, Severity } from "@types/alert.types";

const SEVERITY_CONFIG: Record<Severity, { label: string; color: "default" | "success" | "warning" | "error" }> = {
  low: { label: "Low", color: "success" },
  medium: { label: "Medium", color: "warning" },
  high: { label: "High", color: "error" },
  critical: { label: "Critical", color: "error" },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: "default" | "warning" | "primary" | "success" | "error" }> = {
  pending: { label: "Pending", color: "warning" },
  in_progress: { label: "In Progress", color: "primary" },
  resolved: { label: "Resolved", color: "success" },
  cancelled: { label: "Cancelled", color: "default" },
};

export function SeverityChip({ severity }: { severity: Severity }) {
  const { label, color } = SEVERITY_CONFIG[severity];
  return (
    <Chip
      label={label}
      color={color}
      size="small"
      sx={{ fontWeight: 600, ...(severity === "critical" && { bgcolor: "#9c27b0", color: "white" }) }}
    />
  );
}

export function StatusChip({ status }: { status: AlertStatus }) {
  const { label, color } = STATUS_CONFIG[status];
  return <Chip label={label} color={color} size="small" variant="outlined" />;
}
