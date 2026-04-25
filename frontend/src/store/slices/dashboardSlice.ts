import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@services/apiClient";
import type {
  DashboardState,
  DashboardStats,
  RecentActivity,
  RecentActivityResponse,
} from "@types/dashboard.types";

const initialState: DashboardState = {
  stats: null,
  recentActivity: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

export const fetchDashboardStatsThunk = createAsyncThunk(
  "dashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch dashboard stats");
    }
  }
);

export const fetchRecentActivityThunk = createAsyncThunk(
  "dashboard/fetchActivity",
  async (limit: number | void = 20, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<RecentActivityResponse>("/dashboard/recent-activity", {
        params: { limit },
      });
      return data.activities;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch recent activity");
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStatsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStatsThunk.fulfilled, (state, action: PayloadAction<DashboardStats>) => {
        state.loading = false;
        state.stats = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardStatsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRecentActivityThunk.fulfilled, (state, action: PayloadAction<RecentActivity[]>) => {
        state.recentActivity = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
