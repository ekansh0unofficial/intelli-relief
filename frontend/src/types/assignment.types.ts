export type AssignmentStatus =
  | "pending"
  | "acknowledged"
  | "en_route"
  | "on_scene"
  | "completed"
  | "cancelled";

export type AssignmentPriority = "low" | "medium" | "high" | "critical";

export interface Assignment {
  id: string;
  alert_id: string;
  alert_title: string;
  alert_location: { latitude: number; longitude: number };
  responder_id: string;
  responder_name: string;
  responder_unit: string | null;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  notes: string | null;
  assigned_by: string;
  assigned_by_name: string;
  assigned_at: string;
  acknowledged_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimated_arrival: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentCreateRequest {
  alert_id: string;
  responder_id: string;
  priority: AssignmentPriority;
  notes?: string;
  estimated_arrival?: string;
}

export interface AssignmentUpdateRequest {
  status?: AssignmentStatus;
  notes?: string;
  estimated_arrival?: string;
}

export interface AssignmentStatusUpdateRequest {
  status: AssignmentStatus;
  notes?: string;
}

export interface AssignmentListResponse {
  assignments: Assignment[];
  total: number;
  limit: number;
  offset: number;
}

export interface AssignmentFilters {
  status?: AssignmentStatus;
  responder_id?: string;
  alert_id?: string;
  limit?: number;
  offset?: number;
}

export interface AssignmentState {
  assignments: Assignment[];
  selectedAssignment: Assignment | null;
  total: number;
  loading: boolean;
  error: string | null;
  filters: AssignmentFilters;
}
