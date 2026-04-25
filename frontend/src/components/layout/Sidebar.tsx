import { Box, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import CloudIcon from "@mui/icons-material/Cloud";
import MapIcon from "@mui/icons-material/Map";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import PeopleIcon from "@mui/icons-material/People";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@store/hooks";

export const DRAWER_WIDTH = 240;

const navItems = [
  { label: "Overview",      path: "/dashboard",   icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
  { label: "Active Alerts", path: "/alerts",      icon: <WarningAmberIcon sx={{ fontSize: 20 }} /> },
  { label: "Assignments",   path: "/assignments", icon: <AssignmentIcon sx={{ fontSize: 20 }} /> },
  { label: "Shelters",      path: "/shelters",    icon: <HomeWorkIcon sx={{ fontSize: 20 }} /> },
  { label: "Weather",       path: "/weather",     icon: <CloudIcon sx={{ fontSize: 20 }} /> },
  { label: "GIS Map",       path: "/map",         icon: <MapIcon sx={{ fontSize: 20 }} /> },
  { label: "Volunteers",    path: "/volunteers",  icon: <VolunteerActivismIcon sx={{ fontSize: 20 }} /> },
];

const adminItems = [
  { label: "Users", path: "/users", icon: <PeopleIcon sx={{ fontSize: 20 }} /> },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const navigate    = useNavigate();
  const { pathname } = useLocation();
  const user        = useAppSelector((s) => s.auth.user);

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const navContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", py: 1.5 }}>
      <List disablePadding>
        {navItems.map(({ label, path, icon }) => {
          const active = pathname === path || pathname.startsWith(path + "/");
          return (
            <ListItemButton
              key={path}
              selected={active}
              onClick={() => handleNav(path)}
              sx={{
                px: 3,
                py: 2,
                mb: 0,
                gap: 2,
                borderLeft: active ? "3px solid #dc2626" : "3px solid transparent",
                color: active ? "#fafafa" : "#a3a3a3",
                fontSize: "0.9rem",
                fontWeight: active ? 500 : 400,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "unset",
                  color: active ? "#dc2626" : "#a3a3a3",
                }}
              >
                {icon}
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontSize: "0.9rem",
                  fontWeight: active ? 500 : 400,
                  color: active ? "#fafafa" : "#a3a3a3",
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {user?.role === "admin" && (
        <>
          <Divider sx={{ my: 1.5, borderColor: "#2a2a2a" }} />
          <List disablePadding>
            {adminItems.map(({ label, path, icon }) => {
              const active = pathname.startsWith(path);
              return (
                <ListItemButton
                  key={path}
                  selected={active}
                  onClick={() => handleNav(path)}
                  sx={{
                    px: 3,
                    py: 2,
                    gap: 2,
                    borderLeft: active ? "3px solid #dc2626" : "3px solid transparent",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "unset", color: active ? "#dc2626" : "#a3a3a3" }}>
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: active ? 500 : 400,
                      color: active ? "#fafafa" : "#a3a3a3",
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </>
      )}

    </Box>
  );

  const drawerSx = {
    "& .MuiDrawer-paper": {
      width: DRAWER_WIDTH,
      boxSizing: "border-box" as const,
      top: 64,
      height: "calc(100vh - 64px)",
    },
  };

  return (
    <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          ...drawerSx,
        }}
      >
        {navContent}
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", sm: "block" },
          ...drawerSx,
        }}
      >
        {navContent}
      </Drawer>
    </Box>
  );
}
