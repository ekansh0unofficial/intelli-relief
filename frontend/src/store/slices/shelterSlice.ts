import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@services/apiClient";
import type {
  Shelter,
  ShelterCreateRequest,
  ShelterFilters,
  ShelterListResponse,
  ShelterState,
  ShelterUpdateRequest,
} from "@types/shelter.types";

const initialState: ShelterState = {
  shelters: [],
  selectedShelter: null,
  total: 0,
  loading: false,
  error: null,
  filters: { limit: 20, offset: 0 },
};

export const fetchSheltersThunk = createAsyncThunk(
  "shelters/fetchAll",
  async (filters: ShelterFilters, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<ShelterListResponse>("/shelters", { params: filters });
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch shelters");
    }
  }
);

export const fetchShelterThunk = createAsyncThunk(
  "shelters/fetchOne",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<Shelter>(`/shelters/${id}`);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch shelter");
    }
  }
);

export const createShelterThunk = createAsyncThunk(
  "shelters/create",
  async (payload: ShelterCreateRequest, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<Shelter>("/shelters", payload);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to create shelter");
    }
  }
);

export const updateShelterThunk = createAsyncThunk(
  "shelters/update",
  async ({ id, payload }: { id: string; payload: ShelterUpdateRequest }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch<Shelter>(`/shelters/${id}`, payload);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to update shelter");
    }
  }
);

const shelterSlice = createSlice({
  name: "shelters",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<ShelterFilters>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedShelter(state) {
      state.selectedShelter = null;
    },
    upsertShelter(state, action: PayloadAction<Shelter>) {
      const idx = state.shelters.findIndex((s) => s.id === action.payload.id);
      if (idx >= 0) state.shelters[idx] = action.payload;
      else state.shelters.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSheltersThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSheltersThunk.fulfilled, (state, action: PayloadAction<ShelterListResponse>) => {
        state.loading = false;
        state.shelters = action.payload.shelters;
        state.total = action.payload.total;
      })
      .addCase(fetchSheltersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchShelterThunk.fulfilled, (state, action: PayloadAction<Shelter>) => {
        state.selectedShelter = action.payload;
      })
      .addCase(createShelterThunk.fulfilled, (state, action: PayloadAction<Shelter>) => {
        state.shelters.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateShelterThunk.fulfilled, (state, action: PayloadAction<Shelter>) => {
        const idx = state.shelters.findIndex((s) => s.id === action.payload.id);
        if (idx >= 0) state.shelters[idx] = action.payload;
        if (state.selectedShelter?.id === action.payload.id) state.selectedShelter = action.payload;
      });
  },
});

export const { setFilters, clearSelectedShelter, upsertShelter } = shelterSlice.actions;
export default shelterSlice.reducer;
