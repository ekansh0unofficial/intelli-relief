export type IncidentType =
  | "flood"
  | "fire"
  | "earthquake"
  | "accident"
  | "medical"
  | "rescue"
  | "landslide"
  | "cyclone"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";

export type AlertStatus = "pending" | "in_progress" | "resolved" | "cancelled";

export interface AlertUpdate {
  id: string;
  alert_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  update_text: string;
  status_before: AlertStatus | null;
  status_after: AlertStatus | null;
  created_at: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  incident_type: IncidentType;
  severity: Severity;
  status: AlertStatus;
  latitude: number;
  longitude: number;
  address: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  created_by: string;
  created_by_name: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  updates: AlertUpdate[];
}

export interface AlertCreateRequest {
  title?: string;
  description: string;
  incident_type?: IncidentType;
  severity?: Severity;
  latitude?: number;
  longitude?: number;
  address?: string;
  caller_name?: string;
  caller_phone?: string;
}

export interface AlertInferResponse {
  title: string;
  incident_type: IncidentType;
  severity: Severity;
  latitude: number | null;
  longitude: number | null;
  geocoding_succeeded: boolean;
}

export interface TranscribeResponse {
  transcript: string;
  inferred_title: string;
  inferred_incident_type: IncidentType;
  inferred_severity: Severity;
}

export interface AlertUpdateRequest {
  status?: AlertStatus;
  severity?: Severity;
  description?: string;
  assigned_to?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface AlertAddUpdateRequest {
  update_text: string;
  status_change?: AlertStatus;
}

export interface AlertListResponse {
  alerts: Alert[];
  total: number;
  limit: number;
  offset: number;
}

export interface AlertFilters {
  status?: AlertStatus;
  severity?: Severity;
  incident_type?: IncidentType;
  limit?: number;
  offset?: number;
}

export interface AlertState {
  alerts: Alert[];
  selectedAlert: Alert | null;
  total: number;
  loading: boolean;
  error: string | null;
  filters: AlertFilters;
}
