import {
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Typography,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import type { RecentActivity } from "@types/dashboard.types";

const ACTION_COLORS: Record<string, "default" | "primary" | "success" | "warning" | "error"> = {
  create: "primary",
  update: "warning",
  delete: "error",
  login: "success",
  logout: "default",
};

function getActionColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find((k) => action.toLowerCase().includes(k));
  return key ? ACTION_COLORS[key] : "default";
}

interface RecentActivityFeedProps {
  activities: RecentActivity[];
  loading: boolean;
}

export default function RecentActivityFeed({ activities, loading }: RecentActivityFeedProps) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Recent Activity
        </Typography>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ mb: 1.5 }}>
              <Skeleton height={20} width="60%" />
              <Skeleton height={16} width="40%" />
            </Box>
          ))
        ) : activities.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No recent activity
          </Typography>
        ) : (
          <Box sx={{ flex: 1, overflowY: "auto", maxHeight: 360 }}>
            {activities.map((activity) => (
              <Box
                key={activity.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Chip
                  label={activity.action}
                  size="small"
                  color={getActionColor(activity.action)}
                  sx={{ minWidth: 70, fontSize: 11 }}
                />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {activity.entity_type}
                    {activity.entity_id && (
                      <Typography component="span" variant="body2" color="text.secondary">
                        {" "}#{activity.entity_id.slice(0, 8)}
                      </Typography>
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activity.user?.full_name ?? "System"}
                    {" · "}
                    {activity.timestamp
                      ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
                      : "—"}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
