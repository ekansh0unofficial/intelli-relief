import { Box, Card, CardContent, Typography, useTheme } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = [
  "#1565c0", "#b71c1c", "#e65100", "#1b5e20",
  "#4a148c", "#006064", "#37474f", "#bf360c", "#0d47a1",
];

interface IncidentTypeChartProps {
  data: Record<string, number>;
}

export default function IncidentTypeChart({ data }: IncidentTypeChartProps) {
  const theme = useTheme();

  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([type, count], i) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: COLORS[i % COLORS.length],
    }));

  if (chartData.length === 0) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Alerts by Incident Type
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <Typography color="text.secondary" variant="body2">
              No incidents recorded
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Alerts by Incident Type
        </Typography>
        <Box sx={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${theme.palette.divider}`,
                  fontSize: 13,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
