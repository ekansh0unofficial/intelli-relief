import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import { useForm, Controller } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";
import apiClient from "@services/apiClient";
import type { User, UserRole } from "@types/auth.types";

const ROLES: UserRole[] = ["admin", "operator", "responder", "ngo", "volunteer"];

const ROLE_COLOR: Record<UserRole, "default" | "error" | "warning" | "primary" | "success" | "info"> = {
  admin: "error",
  operator: "warning",
  responder: "primary",
  ngo_official: "success",
  volunteer: "info",
};

interface UserListResponse {
  users: User[];
  total: number;
}

interface RegisterUserForm {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
}

function RegisterUserDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } =
    useForm<RegisterUserForm>({ defaultValues: { role: "responder" } });

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  const onSubmit = async (data: RegisterUserForm) => {
    try {
      await apiClient.post("/auth/register", data);
      toast.success(`User ${data.username} created`);
      onCreated();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail ?? "Failed to create user");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Register User</DialogTitle>
      <DialogContent>
        <Box component="form" id="register-user-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Username" fullWidth error={!!errors.username} helperText={errors.username?.message}
              {...register("username", { required: "Required" })} />
            <TextField label="Full Name" fullWidth error={!!errors.full_name} helperText={errors.full_name?.message}
              {...register("full_name", { required: "Required" })} />
            <TextField label="Email" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message}
              {...register("email", { required: "Required" })} />
            <TextField label="Password" type="password" fullWidth error={!!errors.password} helperText={errors.password?.message}
              {...register("password", { required: "Required", minLength: { value: 8, message: "Min 8 chars" } })} />
            <Controller name="role" control={control} render={({ field }) => (
              <TextField select label="Role" fullWidth {...field}>
                {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            )} />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="register-user-form" variant="contained" disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [registerOpen, setRegisterOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<UserListResponse>("/users", {
        params: { limit: rowsPerPage, offset: page * rowsPerPage },
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail ?? "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, rowsPerPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleActive = async (user: User) => {
    try {
      await apiClient.patch(`/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`${user.username} ${user.is_active ? "deactivated" : "activated"}`);
      load();
    } catch {
      toast.error("Failed to update user");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>User Management</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={load} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRegisterOpen(true)}>
            New User
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No users found</Typography></TableCell></TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={500}>{u.username}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{u.full_name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{u.email}</Typography></TableCell>
                    <TableCell><Chip label={u.role} size="small" color={ROLE_COLOR[u.role]} /></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={u.is_active ? "Deactivate" : "Activate"}>
                        <Switch
                          size="small"
                          checked={u.is_active}
                          onChange={() => handleToggleActive(u)}
                          color="success"
                        />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={total} page={page} rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>

      <RegisterUserDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onCreated={load}
      />
    </Box>
  );
}
