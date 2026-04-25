import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@services/apiClient";
import type { AuthState, LoginRequest, LoginResponse, User } from "@types/auth.types";

const loadFromStorage = (): Partial<AuthState> => {
  try {
    const user = localStorage.getItem("user");
    const access_token = localStorage.getItem("access_token");
    const refresh_token = localStorage.getItem("refresh_token");
    if (user && access_token && refresh_token) {
      return {
        user: JSON.parse(user) as User,
        access_token,
        refresh_token,
        isAuthenticated: true,
      };
    }
  } catch {
    // ignore
  }
  return { user: null, access_token: null, refresh_token: null, isAuthenticated: false };
};

const initialState: AuthState = {
  ...loadFromStorage(),
  loading: false,
  error: null,
} as AuthState;

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<LoginResponse>("/auth/login", credentials);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Login failed");
    }
  }
);

export const fetchMeThunk = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<User>("/auth/me");
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch user");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.access_token = null;
      state.refresh_token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.access_token = action.payload.access_token;
        state.refresh_token = action.payload.refresh_token;
        state.isAuthenticated = true;
        localStorage.setItem("access_token", action.payload.access_token);
        localStorage.setItem("refresh_token", action.payload.refresh_token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMeThunk.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem("user", JSON.stringify(action.payload));
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
