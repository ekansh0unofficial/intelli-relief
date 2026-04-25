import { Box, Card, CardContent, Skeleton, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

const MONO = "'Courier New', Courier, monospace";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  Icon: SvgIconComponent;
  color: string;
  loading?: boolean;
}

export default function StatCard({ title, value, subtitle, Icon, color, loading }: StatCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.25s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.5)" },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          background: color,
        },
      }}
    >
      <CardContent sx={{ pl: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              bgcolor: `${color}1a`,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon sx={{ color, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: "0.875rem",
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: 600,
              }}
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={60} height={36} />
            ) : (
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: "2rem",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: "text.primary",
                }}
              >
                {value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
