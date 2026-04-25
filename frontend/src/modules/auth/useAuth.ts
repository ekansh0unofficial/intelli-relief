import { useAppDispatch, useAppSelector } from "@store/hooks";
import { logout } from "@store/slices/authSlice";
import { disconnectSocket } from "@services/socketClient";

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);

  const handleLogout = () => {
    disconnectSocket();
    dispatch(logout());
  };

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    logout: handleLogout,
  };
}
