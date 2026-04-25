import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@services/apiClient";
import type {
  Alert,
  AlertCreateRequest,
  AlertFilters,
  AlertListResponse,
  AlertState,
  AlertUpdateRequest,
  AlertAddUpdateRequest,
  AlertUpdate,
} from "@types/alert.types";

const initialState: AlertState = {
  alerts: [],
  selectedAlert: null,
  total: 0,
  loading: false,
  error: null,
  filters: { limit: 20, offset: 0 },
};

export const fetchAlertsThunk = createAsyncThunk(
  "alerts/fetchAll",
  async (filters: AlertFilters, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<AlertListResponse>("/alerts", { params: filters });
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch alerts");
    }
  }
);

export const fetchAlertThunk = createAsyncThunk(
  "alerts/fetchOne",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<Alert>(`/alerts/${id}`);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch alert");
    }
  }
);

export const createAlertThunk = createAsyncThunk(
  "alerts/create",
  async (payload: AlertCreateRequest, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<Alert>("/alerts", payload);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to create alert");
    }
  }
);

export const updateAlertThunk = createAsyncThunk(
  "alerts/update",
  async ({ id, payload }: { id: string; payload: AlertUpdateRequest }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch<Alert>(`/alerts/${id}`, payload);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to update alert");
    }
  }
);

export const addAlertUpdateThunk = createAsyncThunk(
  "alerts/addUpdate",
  async (
    { id, payload }: { id: string; payload: AlertAddUpdateRequest },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await apiClient.post<AlertUpdate>(`/alerts/${id}/updates`, payload);
      return { alertId: id, update: data };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to add update");
    }
  }
);

const alertSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<AlertFilters>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedAlert(state) {
      state.selectedAlert = null;
    },
    upsertAlert(state, action: PayloadAction<Alert>) {
      const idx = state.alerts.findIndex((a) => a.id === action.payload.id);
      if (idx >= 0) state.alerts[idx] = action.payload;
      else state.alerts.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlertsThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAlertsThunk.fulfilled, (state, action: PayloadAction<AlertListResponse>) => {
        state.loading = false;
        state.alerts = action.payload.alerts;
        state.total = action.payload.total;
      })
      .addCase(fetchAlertsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAlertThunk.fulfilled, (state, action: PayloadAction<Alert>) => {
        state.selectedAlert = action.payload;
      })
      .addCase(createAlertThunk.fulfilled, (state, action: PayloadAction<Alert>) => {
        state.alerts.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateAlertThunk.fulfilled, (state, action: PayloadAction<Alert>) => {
        const idx = state.alerts.findIndex((a) => a.id === action.payload.id);
        if (idx >= 0) state.alerts[idx] = action.payload;
        if (state.selectedAlert?.id === action.payload.id) state.selectedAlert = action.payload;
      })
      .addCase(addAlertUpdateThunk.fulfilled, (state, action) => {
        if (state.selectedAlert?.id === action.payload.alertId) {
          state.selectedAlert.updates.push(action.payload.update);
        }
      });
  },
});

export const { setFilters, clearSelectedAlert, upsertAlert } = alertSlice.actions;
export default alertSlice.reducer;
