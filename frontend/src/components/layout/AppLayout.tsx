import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { logout } from "@store/slices/authSlice";
import { disconnectSocket } from "@services/socketClient";
import Sidebar, { DRAWER_WIDTH } from "./Sidebar";

const MONO = "'Courier New', Courier, monospace";

const ROLE_COLOR: Record<string, string> = {
  admin:        "#dc2626",
  operator:     "#f59e0b",
  responder:    "#3b82f6",
  ngo_official: "#10b981",
  volunteer:    "#8b5cf6",
};

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate  = useNavigate();
  const user      = useAppSelector((s) => s.auth.user);
  const weather   = useAppSelector((s) => s.weather.current);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    disconnectSocket();
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const roleColor = user ? (ROLE_COLOR[user.role] ?? "#a3a3a3") : "#a3a3a3";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* ── Full-width top bar ─────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: "100%",
          height: 64,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: "64px !important",
            px: { xs: 2, sm: 2.5 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* ── Left: hamburger (mobile) + logo ── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#fafafa",
              }}
            >
              <Box sx={{ color: "#dc2626", lineHeight: 0 }}>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </Box>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: "1.125rem",
                  textTransform: "uppercase",
                  letterSpacing: "-0.5px",
                  color: "#fafafa",
                }}
              >
                IntelliRelief
              </Typography>
            </Box>
          </Box>

          {/* ── Center: weather widget ── */}
          {weather && (
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 2,
                px: 2,
                py: 0.75,
                background: "#171717",
                borderRadius: "6px",
                border: "1px solid #2a2a2a",
                fontSize: "0.875rem",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, fontFamily: MONO, color: "#fafafa" }}>
                  {Math.round(weather.temperature)}°C
                </Typography>
              </Box>
              <Box sx={{ width: "1px", height: 16, bgcolor: "#2a2a2a" }} />
              <Typography sx={{ fontSize: "0.8rem", color: "#a3a3a3" }}>
                {weather.conditions[0]?.description ?? ""}
              </Typography>
              <Box sx={{ width: "1px", height: 16, bgcolor: "#2a2a2a" }} />
              <Typography sx={{ fontSize: "0.8rem", color: "#a3a3a3" }}>
                {weather.city}
              </Typography>
            </Box>
          )}

          {/* ── Right: user info + logout ── */}
          {user && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <Typography
                  sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#fafafa", lineHeight: 1.3 }}
                >
                  {user.full_name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: roleColor,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {user.role.replace("_", " ")}
                </Typography>
              </Box>

              <Tooltip title="Sign out">
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    width: 36,
                    height: 36,
                    border: "1px solid #404040",
                    borderRadius: "4px",
                    color: "#fafafa",
                    "&:hover": { bgcolor: "#262626", borderColor: "#a3a3a3" },
                  }}
                >
                  {/* Logout arrow icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* ── Below topbar: sidebar + content ───────────────────────── */}
      <Box sx={{ display: "flex", flex: 1, mt: "64px" }}>
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            minHeight: "calc(100vh - 64px)",
            bgcolor: "background.default",
            p: 3,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
