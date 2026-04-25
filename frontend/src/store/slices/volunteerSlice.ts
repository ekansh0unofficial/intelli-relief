import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@services/apiClient";
import type {
  Volunteer,
  VolunteerCreateRequest,
  VolunteerFilters,
  VolunteerListResponse,
  VolunteerState,
  VolunteerUpdateRequest,
} from "@types/volunteer.types";

const initialState: VolunteerState = {
  volunteers: [],
  selectedVolunteer: null,
  total: 0,
  loading: false,
  error: null,
  filters: { limit: 20, offset: 0 },
};

export const fetchVolunteersThunk = createAsyncThunk(
  "volunteers/fetchAll",
  async (filters: VolunteerFilters, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<VolunteerListResponse>("/volunteers", {
        params: filters,
      });
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch volunteers");
    }
  }
);

export const fetchVolunteerThunk = createAsyncThunk(
  "volunteers/fetchOne",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<Volunteer>(`/volunteers/${id}`);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch volunteer");
    }
  }
);

export const createVolunteerThunk = createAsyncThunk(
  "volunteers/create",
  async (payload: VolunteerCreateRequest, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<Volunteer>("/volunteers", payload);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to create volunteer");
    }
  }
);

export const updateVolunteerThunk = createAsyncThunk(
  "volunteers/update",
  async (
    { id, payload }: { id: string; payload: VolunteerUpdateRequest },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await apiClient.patch<Volunteer>(`/volunteers/${id}`, payload);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to update volunteer");
    }
  }
);

export const approveVolunteerThunk = createAsyncThunk(
  "volunteers/approve",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<Volunteer>(`/volunteers/${id}/approve`);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to approve volunteer");
    }
  }
);

const volunteerSlice = createSlice({
  name: "volunteers",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<VolunteerFilters>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedVolunteer(state) {
      state.selectedVolunteer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVolunteersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchVolunteersThunk.fulfilled,
        (state, action: PayloadAction<VolunteerListResponse>) => {
          state.loading = false;
          state.volunteers = action.payload.volunteers;
          state.total = action.payload.total;
        }
      )
      .addCase(fetchVolunteersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchVolunteerThunk.fulfilled, (state, action: PayloadAction<Volunteer>) => {
        state.selectedVolunteer = action.payload;
      })
      .addCase(createVolunteerThunk.fulfilled, (state, action: PayloadAction<Volunteer>) => {
        state.volunteers.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateVolunteerThunk.fulfilled, (state, action: PayloadAction<Volunteer>) => {
        const idx = state.volunteers.findIndex((v) => v.id === action.payload.id);
        if (idx >= 0) state.volunteers[idx] = action.payload;
        if (state.selectedVolunteer?.id === action.payload.id)
          state.selectedVolunteer = action.payload;
      })
      .addCase(approveVolunteerThunk.fulfilled, (state, action: PayloadAction<Volunteer>) => {
        const idx = state.volunteers.findIndex((v) => v.id === action.payload.id);
        if (idx >= 0) state.volunteers[idx] = action.payload;
      });
  },
});

export const { setFilters, clearSelectedVolunteer } = volunteerSlice.actions;
export default volunteerSlice.reducer;
