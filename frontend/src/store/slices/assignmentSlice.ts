import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@services/apiClient";
import type {
  Assignment,
  AssignmentCreateRequest,
  AssignmentFilters,
  AssignmentListResponse,
  AssignmentState,
  AssignmentStatusUpdateRequest,
  AssignmentUpdateRequest,
} from "@types/assignment.types";

const initialState: AssignmentState = {
  assignments: [],
  selectedAssignment: null,
  total: 0,
  loading: false,
  error: null,
  filters: { limit: 20, offset: 0 },
};

export const fetchAssignmentsThunk = createAsyncThunk(
  "assignments/fetchAll",
  async (filters: AssignmentFilters, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<AssignmentListResponse>("/assignments", {
        params: filters,
      });
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch assignments");
    }
  }
);

export const fetchAssignmentThunk = createAsyncThunk(
  "assignments/fetchOne",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<Assignment>(`/assignments/${id}`);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to fetch assignment");
    }
  }
);

export const createAssignmentThunk = createAsyncThunk(
  "assignments/create",
  async (payload: AssignmentCreateRequest, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<Assignment>("/assignments", payload);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to create assignment");
    }
  }
);

export const updateAssignmentThunk = createAsyncThunk(
  "assignments/update",
  async (
    { id, payload }: { id: string; payload: AssignmentUpdateRequest },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await apiClient.patch<Assignment>(`/assignments/${id}`, payload);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to update assignment");
    }
  }
);

export const updateAssignmentStatusThunk = createAsyncThunk(
  "assignments/updateStatus",
  async (
    { id, payload }: { id: string; payload: AssignmentStatusUpdateRequest },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await apiClient.post<Assignment>(`/assignments/${id}/status`, payload);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(error.response?.data?.detail ?? "Failed to update status");
    }
  }
);

const assignmentSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<AssignmentFilters>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedAssignment(state) {
      state.selectedAssignment = null;
    },
    upsertAssignment(state, action: PayloadAction<Assignment>) {
      const idx = state.assignments.findIndex((a) => a.id === action.payload.id);
      if (idx >= 0) state.assignments[idx] = action.payload;
      else state.assignments.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignmentsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAssignmentsThunk.fulfilled,
        (state, action: PayloadAction<AssignmentListResponse>) => {
          state.loading = false;
          state.assignments = action.payload.assignments;
          state.total = action.payload.total;
        }
      )
      .addCase(fetchAssignmentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAssignmentThunk.fulfilled, (state, action: PayloadAction<Assignment>) => {
        state.selectedAssignment = action.payload;
      })
      .addCase(createAssignmentThunk.fulfilled, (state, action: PayloadAction<Assignment>) => {
        state.assignments.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateAssignmentThunk.fulfilled, (state, action: PayloadAction<Assignment>) => {
        const idx = state.assignments.findIndex((a) => a.id === action.payload.id);
        if (idx >= 0) state.assignments[idx] = action.payload;
        if (state.selectedAssignment?.id === action.payload.id)
          state.selectedAssignment = action.payload;
      })
      .addCase(
        updateAssignmentStatusThunk.fulfilled,
        (state, action: PayloadAction<Assignment>) => {
          const idx = state.assignments.findIndex((a) => a.id === action.payload.id);
          if (idx >= 0) state.assignments[idx] = action.payload;
          if (state.selectedAssignment?.id === action.payload.id)
            state.selectedAssignment = action.payload;
        }
      );
  },
});

export const { setFilters, clearSelectedAssignment, upsertAssignment } = assignmentSlice.actions;
export default assignmentSlice.reducer;
