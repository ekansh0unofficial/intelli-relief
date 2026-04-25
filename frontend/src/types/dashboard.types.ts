export interface AlertStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  by_severity: Record<string, number>;
  by_incident_type: Record<string, number>;
  last_24h: number;
}

export interface AssignmentStats {
  total: number;
  active: number;
  completed: number;
}

export interface ShelterStats {
  total: number;
  operational: number;
  total_capacity: number;
  current_occupancy: number;
  available_capacity: number;
}

export interface ResponderStats {
  total: number;
  available: number;
}

export interface DashboardStats {
  alerts: AlertStats;
  assignments: AssignmentStats;
  shelters: ShelterStats;
  responders: ResponderStats;
}

export interface ActivityUser {
  username: string;
  full_name: string;
  role: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  timestamp: string | null;
  user: ActivityUser | null;
}

export interface RecentActivityResponse {
  activities: RecentActivity[];
  total: number;
}

export interface DashboardState {
  stats: DashboardStats | null;
  recentActivity: RecentActivity[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}
