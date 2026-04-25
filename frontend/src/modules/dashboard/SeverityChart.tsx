import { Box, Card, CardContent, Typography, useTheme } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const SEVERITY_COLORS: Record<string, string> = {
  low: "#4caf50",
  medium: "#ff9800",
  high: "#f44336",
  critical: "#9c27b0",
};

interface SeverityChartProps {
  data: Record<string, number>;
}

export default function SeverityChart({ data }: SeverityChartProps) {
  const theme = useTheme();

  const chartData = Object.entries(data).map(([severity, count]) => ({
    severity: severity.charAt(0).toUpperCase() + severity.slice(1),
    count,
    key: severity,
  }));

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Alerts by Severity
        </Typography>
        <Box sx={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="severity"
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${theme.palette.divider}`,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={SEVERITY_COLORS[entry.key] ?? "#1565c0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
