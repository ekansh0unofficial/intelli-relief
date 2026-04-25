import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { store } from "@store/index";
import AppRoutes from "@/routes/AppRoutes";

const MONO = "'Courier New', Courier, monospace";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary:    { main: "#dc2626", light: "#ef4444", dark: "#991b1b", contrastText: "#fff" },
    secondary:  { main: "#f59e0b", light: "#fcd34d", dark: "#d97706", contrastText: "#000" },
    error:      { main: "#dc2626" },
    warning:    { main: "#f59e0b" },
    success:    { main: "#10b981" },
    info:       { main: "#3b82f6" },
    background: { default: "#0a0a0a", paper: "#1c1c1c" },
    divider:    "#2a2a2a",
    text:       { primary: "#fafafa", secondary: "#a3a3a3" },
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontFamily: MONO, fontWeight: 700, letterSpacing: "-0.5px", textTransform: "uppercase" as const },
    h2: { fontFamily: MONO, fontWeight: 700, letterSpacing: "-0.5px", textTransform: "uppercase" as const },
    h3: { fontFamily: MONO, fontWeight: 700, letterSpacing: "-0.5px", textTransform: "uppercase" as const },
    h4: { fontFamily: MONO, fontWeight: 700, letterSpacing: "-0.5px", textTransform: "uppercase" as const },
    h5: { fontFamily: MONO, fontWeight: 700 },
    h6: { fontFamily: MONO, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*::-webkit-scrollbar":       { width: "6px", height: "6px" },
        "*::-webkit-scrollbar-track": { background: "#0a0a0a" },
        "*::-webkit-scrollbar-thumb": { background: "#404040", borderRadius: "3px" },
        "*::-webkit-scrollbar-thumb:hover": { background: "#525252" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { background: "#1c1c1c", borderBottom: "1px solid #404040", boxShadow: "none" },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { background: "#1c1c1c", borderRight: "1px solid #404040" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid #404040" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid #404040" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root:  { borderColor: "#2a2a2a" },
        head:  {
          color: "#a3a3a3",
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 700,
          fontFamily: MONO,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&:hover td": { background: "rgba(255,255,255,0.03)" } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.05em" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" },
        containedPrimary: {
          background: "#dc2626",
          "&:hover": { background: "#991b1b" },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            background: "#171717",
            "& fieldset": { borderColor: "#2a2a2a" },
            "&:hover fieldset": { borderColor: "#525252" },
            "&.Mui-focused fieldset": { borderColor: "#dc2626", boxShadow: "0 0 0 3px rgba(220, 38, 38, 0.1)" },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: { color: "#a3a3a3" },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { background: "#1c1c1c", border: "1px solid #404040" },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          margin: 0,
          "&.Mui-selected": {
            background: "#171717",
            borderLeft: "3px solid #dc2626",
            "& .MuiListItemIcon-root": { color: "#dc2626" },
            "& .MuiListItemText-primary": { color: "#fafafa", fontWeight: 600 },
          },
          "&:hover": { background: "#171717" },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 2, background: "#262626" } },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: "#2a2a2a" } },
    },
    MuiAlert: {
      styleOverrides: { root: { border: "1px solid" } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { background: "#1c1c1c", border: "1px solid #404040" },
      },
    },
  },
});

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          theme="dark"
          toastStyle={{ background: "#1c1c1c", border: "1px solid #404040", fontFamily: "-apple-system, sans-serif" }}
        />
      </ThemeProvider>
    </Provider>
  );
}
