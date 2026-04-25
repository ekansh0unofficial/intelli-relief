import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { loginThunk, clearError } from "@store/slices/authSlice";
import type { LoginRequest, UserRole } from "@types/auth.types";

const MONO = "'Courier New', Courier, monospace";

const ROLES: Array<{ value: UserRole; label: string }> = [
  { value: "admin",        label: "Admin" },
  { value: "operator",     label: "Operator" },
  { value: "responder",    label: "Responder" },
  { value: "ngo_official", label: "NGO Official" },
  { value: "volunteer",    label: "Volunteer" },
];

const DEMO_CREDS = [
  { label: "Admin",     user: "admin",      pass: "admin123" },
  { label: "Operator",  user: "operator1",  pass: "admin123" },
  { label: "Responder", user: "responder1", pass: "admin123" },
];

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isAuthenticated, loading, error } = useAppSelector((s) => s.auth);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginRequest>({ defaultValues: { role: "admin" } });

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  useEffect(() => { return () => { dispatch(clearError()); }; }, [dispatch]);

  const onSubmit = (data: LoginRequest) => { dispatch(loginThunk(data)); };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a0000 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated diagonal stripe overlay */}
      <Box
        sx={{
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(220, 38, 38, 0.03) 10px,
            rgba(220, 38, 38, 0.03) 20px
          )`,
          "@keyframes slidePattern": {
            "0%":   { transform: "translate(0, 0)" },
            "100%": { transform: "translate(50px, 50px)" },
          },
          animation: "slidePattern 20s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          bgcolor: "#1c1c1c",
          border: "1px solid #404040",
          borderRadius: "8px",
          p: "32px",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.6)",
          "@keyframes slideUp": {
            from: { opacity: 0, transform: "translateY(20px)" },
            to:   { opacity: 1, transform: "translateY(0)" },
          },
          animation: "slideUp 0.5s ease",
        }}
      >
        {/* Logo + Title */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              background: "#dc2626",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 0 20px rgba(220, 38, 38, 0.3)",
              mb: 2,
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </Box>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "#fafafa",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            IntelliRelief
          </Typography>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: "#737373",
              mt: 0.75,
              letterSpacing: "0.5px",
            }}
          >
            Unified Disaster Response Platform
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {/* Username */}
          <Box>
            <Typography
              component="label"
              htmlFor="username-input"
              sx={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#a3a3a3",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 0.75,
              }}
            >
              Username
            </Typography>
            <TextField
              id="username-input"
              fullWidth
              autoComplete="username"
              autoFocus
              error={!!errors.username}
              helperText={errors.username?.message}
              {...register("username", { required: "Username is required" })}
              inputProps={{ style: { fontSize: "1rem" } }}
            />
          </Box>

          {/* Password */}
          <Box>
            <Typography
              component="label"
              htmlFor="password-input"
              sx={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#a3a3a3",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 0.75,
              }}
            >
              Password
            </Typography>
            <TextField
              id="password-input"
              fullWidth
              type="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register("password", { required: "Password is required" })}
              inputProps={{ style: { fontSize: "1rem" } }}
            />
          </Box>

          {/* Role */}
          <Box>
            <Typography
              component="label"
              sx={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#a3a3a3",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 0.75,
              }}
            >
              Role
            </Typography>
            <Controller
              name="role"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  {...field}
                  inputProps={{ style: { fontSize: "1rem" } }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: { sx: { bgcolor: "#1c1c1c", border: "1px solid #404040" } },
                    },
                  }}
                >
                  {ROLES.map(({ value, label }) => (
                    <MenuItem key={value} value={value} sx={{ fontSize: "0.9rem" }}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 0.5,
              py: 1.25,
              fontSize: "1rem",
              fontWeight: 600,
              letterSpacing: "0.5px",
              background: "#dc2626",
              "&:hover": { background: "#991b1b", transform: "translateY(-1px)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.5)" },
              transition: "all 0.25s ease",
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : "Access System"}
          </Button>
        </Box>

        {/* Demo credentials */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            background: "#171717",
            border: "1px dashed #404040",
            borderRadius: "4px",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#737373",
              mb: 1,
            }}
          >
            Demo Credentials:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {DEMO_CREDS.map(({ label, user, pass }) => (
              <Typography
                key={user}
                sx={{ fontSize: "0.875rem", color: "#a3a3a3", fontFamily: MONO }}
              >
                <Box component="strong" sx={{ color: "#dc2626" }}>{label}:</Box>
                {" "}{user} / {pass}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
