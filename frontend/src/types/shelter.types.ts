// Values must match backend ShelterType enum exactly
export type ShelterType = "school" | "community_center" | "stadium" | "temporary" | "other";

export type ShelterStatus = "operational" | "full" | "closed" | "damaged";

export interface Shelter {
  id: string;
  name: string;
  type: ShelterType;          // backend field name is "type"
  status: ShelterStatus;
  latitude: number;
  longitude: number;
  address: string;
  total_capacity: number;
  current_occupancy: number;
  available_capacity: number;
  contact_person: string | null;  // backend field name is "contact_person"
  contact_phone: string | null;
  facilities: string[] | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShelterCreateRequest {
  name: string;
  type: ShelterType;          // backend field name is "type"
  latitude: number;
  longitude: number;
  address: string;
  total_capacity: number;
  current_occupancy?: number;
  contact_person?: string;    // backend field name is "contact_person"
  contact_phone?: string;
  facilities?: string[];
  notes?: string;
}

export interface ShelterUpdateRequest {
  status?: ShelterStatus;
  current_occupancy?: number;
  contact_person?: string;
  contact_phone?: string;
  facilities?: string[];
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface ShelterListResponse {
  shelters: Shelter[];
  total: number;
  limit: number;
  offset: number;
}

export interface ShelterFilters {
  status?: ShelterStatus;
  type?: ShelterType;         // backend param is "type"
  capacity_available?: boolean;
  limit?: number;
  offset?: number;
}

export interface ShelterState {
  shelters: Shelter[];
  selectedShelter: Shelter | null;
  total: number;
  loading: boolean;
  error: string | null;
  filters: ShelterFilters;
}
