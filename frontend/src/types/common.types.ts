export interface PaginatedResponse<T> {
  total: number;
  limit: number;
  offset: number;
  items?: T[];
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export type LoadingState = "idle" | "loading" | "succeeded" | "failed";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}
