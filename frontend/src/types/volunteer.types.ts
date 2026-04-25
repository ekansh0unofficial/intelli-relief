export type VolunteerStatus = "pending" | "approved" | "active" | "inactive" | "rejected";

export interface Volunteer {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  status: VolunteerStatus;
  skills: string[];
  availability: boolean;
  location_lat: number | null;
  location_lon: number | null;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VolunteerCreateRequest {
  full_name: string;
  email: string;
  phone: string;
  skills?: string[];
  availability?: boolean;
  location_lat?: number;
  location_lon?: number;
  notes?: string;
}

export interface VolunteerUpdateRequest {
  status?: VolunteerStatus;
  skills?: string[];
  availability?: boolean;
  location_lat?: number;
  location_lon?: number;
  notes?: string;
}

export interface VolunteerListResponse {
  volunteers: Volunteer[];
  total: number;
  limit: number;
  offset: number;
}

export interface VolunteerFilters {
  status?: VolunteerStatus;
  availability?: boolean;
  skills?: string[];
  limit?: number;
  offset?: number;
}

export interface VolunteerState {
  volunteers: Volunteer[];
  selectedVolunteer: Volunteer | null;
  total: number;
  loading: boolean;
  error: string | null;
  filters: VolunteerFilters;
}
