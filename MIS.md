# IntelliRelief - Module Interface Specification
## Immutable API Contracts for Modular Development

**Version:** 1.0  
**Date:** February 13, 2026  
**Purpose:** Define immutable interfaces (inputs/outputs) for all modules to maintain consistency across code changes

---
## 📋 ARCHITECTURE ASSESSMENT

### Are the Defined Modules Adequate for Requirements?

Based on SRS requirements analysis against System_Design_v2.md:

#### ✅ ADEQUATE COVERAGE:

| SRS Requirement | Mapped Module/Service | Status |
|----------------|----------------------|--------|
| User Management | AuthModule + UserAccessService | ✅ Complete |
| Help-Alert Logging | AlertModule + AlertService | ✅ Complete |
| Dashboard & GIS | MapModule + DashboardModule | ✅ Complete |
| Responder Assignment | AssignmentModule + AssignmentService | ✅ Complete |
| Status Tracking | AlertService (status updates) | ✅ Complete |
| Weather Monitoring | WeatherService | ✅ Complete |
| Shelter Management | ShelterModule + ShelterService | ✅ Complete |
| Volunteer Coordination | VolunteerService | ✅ Complete |

## 🔒 IMMUTABLE INTERFACE DEFINITIONS

### Core Principle
**When code changes, these MUST remain unchanged:**
- API endpoint paths and methods
- Request/response payload structures
- Event names and payloads
- Service method signatures (inputs/outputs)
- Database schema field names

---

## MODULE 1: AuthModule

### Purpose
User authentication, authorization, and session management

### Dependencies
- `UserAccessService` (backend)
- `apiClient.ts`
- `authSlice` (Redux store)

### 🔒 IMMUTABLE INPUTS (What it receives)

#### Component Props
```typescript
// LoginForm.tsx props
interface LoginFormProps {
  onSuccess: (user: User) => void;
  onError: (error: string) => void;
  redirectTo?: string;
}

// ProtectedRoute.tsx props
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}
```

#### API Calls (Consumed)
```typescript
// POST /api/auth/login
interface LoginRequest {
  username: string;
  password: string;
  role: UserRole; // 'admin' | 'operator' | 'responder' | 'volunteer' | 'ngo_official'
}

interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: {
    id: string; // UUID
    username: string;
    full_name: string;
    role: UserRole;
    email?: string;
    phone?: string;
  };
}

// POST /api/auth/refresh
interface RefreshRequest {
  refresh_token: string;
}

interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

// POST /api/auth/logout
// No request body, uses Authorization header
interface LogoutResponse {
  message: "Logged out successfully";
}
```

### 🔒 IMMUTABLE OUTPUTS (What it provides)

#### Redux State Shape
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

#### Events Published
```typescript
// Event: "auth.login_success"
interface AuthLoginSuccessEvent {
  event_type: "auth.login_success";
  timestamp: string; // ISO 8601
  user_id: string;
  username: string;
  role: UserRole;
}

// Event: "auth.logout"
interface AuthLogoutEvent {
  event_type: "auth.logout";
  timestamp: string;
  user_id: string;
}

// Event: "auth.session_expired"
interface AuthSessionExpiredEvent {
  event_type: "auth.session_expired";
  timestamp: string;
  user_id: string;
}
```

#### Exported Hooks
```typescript
// useAuth() hook return type
interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}
```

---

## MODULE 2: AlertModule

### Purpose
Display, create, update, and filter emergency help alerts

### Dependencies
- `AlertService` (backend)
- `MapModule` (for location selection)
- `alertSlice` (Redux store)

### 🔒 IMMUTABLE INPUTS (What it receives)

#### Component Props
```typescript
// AlertList.tsx props
interface AlertListProps {
  filters?: AlertFilters;
  onAlertSelect: (alertId: string) => void;
}

// AlertDetail.tsx props
interface AlertDetailProps {
  alertId: string;
  onClose: () => void;
  onUpdate?: (alert: Alert) => void;
}

// AlertForm.tsx props
interface AlertFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Alert>;
  onSubmit: (data: AlertCreate) => void;
  onCancel: () => void;
}
```

#### API Calls (Consumed)
```typescript
// GET /api/alerts
interface GetAlertsParams {
  status?: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  incident_type?: IncidentType;
  assigned_to?: string; // user_id
  created_by?: string; // operator_id
  limit?: number;
  offset?: number;
  bounds?: { // For map filtering
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface GetAlertsResponse {
  alerts: Alert[];
  total: number;
  limit: number;
  offset: number;
}

// POST /api/alerts
interface AlertCreate {
  title: string; // min: 5 chars, max: 100 chars
  description: string; // min: 20 chars, max: 1000 chars
  incident_type: IncidentType; // 'flood' | 'fire' | 'earthquake' | 'accident' | 'medical' | 'rescue' | 'other'
  severity: Severity; // 'low' | 'medium' | 'high' | 'critical'
  latitude: number; // -90 to 90
  longitude: number; // -180 to 180
  address?: string;
  caller_name?: string;
  caller_phone?: string;
}

interface AlertResponse {
  id: string; // UUID
  title: string;
  description: string;
  incident_type: IncidentType;
  severity: Severity;
  status: AlertStatus;
  latitude: number;
  longitude: number;
  address?: string;
  caller_name?: string;
  caller_phone?: string;
  created_by: string; // operator_id
  created_by_name: string;
  created_at: string; // ISO 8601
  updated_at: string;
  assigned_to?: string; // responder_id
  assigned_to_name?: string;
  resolved_at?: string;
  updates: AlertUpdate[]; // Timeline of status updates
}

// PATCH /api/alerts/{alert_id}
interface AlertUpdateRequest {
  status?: AlertStatus;
  severity?: Severity;
  description?: string;
  assigned_to?: string;
  notes?: string;
}

// POST /api/alerts/{alert_id}/updates
interface AlertUpdateCreate {
  update_text: string; // min: 10 chars
  status_change?: AlertStatus;
}

interface AlertUpdate {
  id: string;
  alert_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  update_text: string;
  status_before?: AlertStatus;
  status_after?: AlertStatus;
  created_at: string;
}
```

#### Events Subscribed
```typescript
// Event: "alert.created"
interface AlertCreatedEvent {
  event_type: "alert.created";
  timestamp: string;
  alert_id: string;
  alert: AlertResponse;
  created_by: string;
}

// Event: "alert.updated"
interface AlertUpdatedEvent {
  event_type: "alert.updated";
  timestamp: string;
  alert_id: string;
  changes: Partial<AlertResponse>;
  updated_by: string;
}

// Event: "alert.assigned"
interface AlertAssignedEvent {
  event_type: "alert.assigned";
  timestamp: string;
  alert_id: string;
  responder_id: string;
  responder_name: string;
  assigned_by: string;
}

// Event: "alert.status_changed"
interface AlertStatusChangedEvent {
  event_type: "alert.status_changed";
  timestamp: string;
  alert_id: string;
  old_status: AlertStatus;
  new_status: AlertStatus;
  changed_by: string;
}
```

### 🔒 IMMUTABLE OUTPUTS (What it provides)

#### Redux State Shape
```typescript
interface AlertState {
  list: Alert[];
  selectedAlert: Alert | null;
  filters: AlertFilters;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  pagination: {
    limit: number;
    offset: number;
  };
}
```

#### Events Published
```typescript
// Event: "alert.filter_changed"
interface AlertFilterChangedEvent {
  event_type: "alert.filter_changed";
  timestamp: string;
  filters: AlertFilters;
}

// Event: "alert.selected"
interface AlertSelectedEvent {
  event_type: "alert.selected";
  timestamp: string;
  alert_id: string;
}

// Event: "alert.create_requested"
interface AlertCreateRequestedEvent {
  event_type: "alert.create_requested";
  timestamp: string;
  location?: { lat: number; lng: number };
}
```

---

## MODULE 3: AssignmentModule

### Purpose
Assign responders to alerts, manage assignments, track status

### Dependencies
- `AssignmentService` (backend)
- `AlertModule` (for alert data)
- `assignmentSlice` (Redux store)

### 🔒 IMMUTABLE INPUTS (What it receives)

#### Component Props
```typescript
// AssignmentForm.tsx props
interface AssignmentFormProps {
  alertId: string;
  onSubmit: (data: AssignmentCreate) => void;
  onCancel: () => void;
}

// AssignmentList.tsx props
interface AssignmentListProps {
  filters?: {
    status?: AssignmentStatus;
    responder_id?: string;
    alert_id?: string;
  };
  onAssignmentSelect: (assignmentId: string) => void;
}
```

#### API Calls (Consumed)
```typescript
// POST /api/assignments
interface AssignmentCreate {
  alert_id: string;
  responder_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  estimated_arrival?: string; // ISO 8601
}

interface AssignmentResponse {
  id: string; // UUID
  alert_id: string;
  alert_title: string;
  alert_location: { latitude: number; longitude: number };
  responder_id: string;
  responder_name: string;
  responder_unit: string;
  priority: Priority;
  status: AssignmentStatus; // 'pending' | 'acknowledged' | 'en_route' | 'on_scene' | 'completed' | 'cancelled'
  notes?: string;
  assigned_by: string;
  assigned_by_name: string;
  assigned_at: string;
  acknowledged_at?: string;
  started_at?: string;
  completed_at?: string;
  estimated_arrival?: string;
}

// GET /api/assignments
interface GetAssignmentsParams {
  status?: AssignmentStatus;
  responder_id?: string;
  alert_id?: string;
  assigned_by?: string;
  limit?: number;
  offset?: number;
}

interface GetAssignmentsResponse {
  assignments: AssignmentResponse[];
  total: number;
}

// PATCH /api/assignments/{assignment_id}
interface AssignmentUpdateRequest {
  status?: AssignmentStatus;
  notes?: string;
  estimated_arrival?: string;
}

// POST /api/assignments/{assignment_id}/status
interface AssignmentStatusUpdate {
  status: AssignmentStatus;
  notes?: string;
  location?: { latitude: number; longitude: number };
}
```

#### Events Subscribed
```typescript
// Event: "assignment.created"
interface AssignmentCreatedEvent {
  event_type: "assignment.created";
  timestamp: string;
  assignment_id: string;
  assignment: AssignmentResponse;
}

// Event: "assignment.status_changed"
interface AssignmentStatusChangedEvent {
  event_type: "assignment.status_changed";
  timestamp: string;
  assignment_id: string;
  old_status: AssignmentStatus;
  new_status: AssignmentStatus;
  responder_id: string;
}
```

### 🔒 IMMUTABLE OUTPUTS (What it provides)

#### Redux State Shape
```typescript
interface AssignmentState {
  list: AssignmentResponse[];
  selectedAssignment: AssignmentResponse | null;
  isLoading: boolean;
  error: string | null;
}
```

#### Events Published
```typescript
// Event: "assignment.assign_requested"
interface AssignmentRequestedEvent {
  event_type: "assignment.assign_requested";
  timestamp: string;
  alert_id: string;
}
```

---

## MODULE 4: ShelterModule

### Purpose
Display shelters, manage capacity, show availability

### Dependencies
- `ShelterService` (backend)
- `MapModule` (for location display)
- `shelterSlice` (Redux store)

### 🔒 IMMUTABLE INPUTS (What it receives)

#### Component Props
```typescript
// ShelterList.tsx props
interface ShelterListProps {
  filters?: {
    capacity_available?: boolean;
    type?: ShelterType;
  };
  onShelterSelect: (shelterId: string) => void;
}

// ShelterDetail.tsx props
interface ShelterDetailProps {
  shelterId: string;
  onClose: () => void;
}

// ShelterForm.tsx props (Admin only)
interface ShelterFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Shelter>;
  onSubmit: (data: ShelterCreate) => void;
  onCancel: () => void;
}
```

#### API Calls (Consumed)
```typescript
// GET /api/shelters
interface GetSheltersParams {
  type?: ShelterType; // 'school' | 'community_center' | 'stadium' | 'temporary' | 'other'
  capacity_available?: boolean;
  within_bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface GetSheltersResponse {
  shelters: Shelter[];
  total: number;
}

// POST /api/shelters (Admin only)
interface ShelterCreate {
  name: string; // min: 5 chars, max: 100 chars
  type: ShelterType;
  address: string;
  latitude: number;
  longitude: number;
  total_capacity: number; // > 0
  current_occupancy: number; // >= 0, <= total_capacity
  facilities: string[]; // ['water', 'electricity', 'medical', 'food', 'sanitation']
  contact_person?: string;
  contact_phone?: string;
  status: 'operational' | 'full' | 'closed' | 'damaged';
  notes?: string;
}

interface Shelter {
  id: string; // UUID
  name: string;
  type: ShelterType;
  address: string;
  latitude: number;
  longitude: number;
  total_capacity: number;
  current_occupancy: number;
  available_capacity: number; // Computed: total - current
  facilities: string[];
  contact_person?: string;
  contact_phone?: string;
  status: ShelterStatus;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// PATCH /api/shelters/{shelter_id}
interface ShelterUpdateRequest {
  current_occupancy?: number;
  status?: ShelterStatus;
  notes?: string;
  facilities?: string[];
}
```

#### Events Subscribed
```typescript
// Event: "shelter.created"
interface ShelterCreatedEvent {
  event_type: "shelter.created";
  timestamp: string;
  shelter_id: string;
  shelter: Shelter;
}

// Event: "shelter.updated"
interface ShelterUpdatedEvent {
  event_type: "shelter.updated";
  timestamp: string;
  shelter_id: string;
  changes: Partial<Shelter>;
}

// Event: "shelter.capacity_changed"
interface ShelterCapacityChangedEvent {
  event_type: "shelter.capacity_changed";
  timestamp: string;
  shelter_id: string;
  old_occupancy: number;
  new_occupancy: number;
  available_capacity: number;
}
```

### 🔒 IMMUTABLE OUTPUTS (What it provides)

#### Redux State Shape
```typescript
interface ShelterState {
  list: Shelter[];
  selectedShelter: Shelter | null;
  filters: ShelterFilters;
  isLoading: boolean;
  error: string | null;
}
```

#### Events Published
```typescript
// Event: "shelter.selected"
interface ShelterSelectedEvent {
  event_type: "shelter.selected";
  timestamp: string;
  shelter_id: string;
}
```

---

## MODULE 5: MapModule

### Purpose
Display interactive map with alerts, shelters, responders, weather layers

### Dependencies
- `MapService` (backend for geocoding)
- `AlertModule` (for alert markers)
- `ShelterModule` (for shelter markers)
- Leaflet.js / Mapbox

### 🔒 IMMUTABLE INPUTS (What it receives)

#### Component Props
```typescript
// MapView.tsx props
interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  layers?: MapLayer[];
  drawingMode?: 'marker' | 'polygon' | 'circle' | null;
}

interface MapMarker {
  id: string;
  type: 'alert' | 'shelter' | 'responder' | 'hazard';
  position: { lat: number; lng: number };
  icon: string;
  color?: string;
  data: any; // Type depends on marker type
  popup?: {
    title: string;
    content: string;
  };
}

interface MapLayer {
  id: string;
  type: 'heatmap' | 'polygon' | 'circle' | 'polyline';
  visible: boolean;
  data: any; // Type depends on layer type
  style?: {
    color?: string;
    fillColor?: string;
    weight?: number;
    opacity?: number;
  };
}
```

#### API Calls (Consumed)
```typescript
// POST /api/map/geocode
interface GeocodeRequest {
  address: string;
}

interface GeocodeResponse {
  latitude: number;
  longitude: number;
  formatted_address: string;
  place_name?: string;
}

// POST /api/map/reverse-geocode
interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

interface ReverseGeocodeResponse {
  address: string;
  place_name?: string;
  district?: string;
  state?: string;
  country?: string;
}

// GET /api/map/bounds
interface GetBoundsResponse {
  north: number;
  south: number;
  east: number;
  west: number;
  center: { lat: number; lng: number };
}
```

#### Events Subscribed
```typescript
// Event: "alert.created" - Add marker
// Event: "alert.updated" - Update marker
// Event: "shelter.created" - Add marker
// Event: "shelter.updated" - Update marker
```

### 🔒 IMMUTABLE OUTPUTS (What it provides)

#### Map State
```typescript
interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  markers: MapMarker[];
  selectedMarker: MapMarker | null;
  layers: MapLayer[];
  isLoading: boolean;
}
```

#### Events Published
```typescript
// Event: "map.bounds_changed"
interface MapBoundsChangedEvent {
  event_type: "map.bounds_changed";
  timestamp: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: { lat: number; lng: number };
  zoom: number;
}

// Event: "map.marker_clicked"
interface MapMarkerClickedEvent {
  event_type: "map.marker_clicked";
  timestamp: string;
  marker_id: string;
  marker_type: string;
}

// Event: "map.location_selected"
interface MapLocationSelectedEvent {
  event_type: "map.location_selected";
  timestamp: string;
  location: { lat: number; lng: number };
}
```

---

## MODULE 6: WeatherModule

### Purpose
Display weather data, alerts, and forecasts

### Dependencies
- `WeatherService` (backend)
- External: OpenWeatherMap API

### 🔒 IMMUTABLE INPUTS (What it receives)

#### API Calls (Consumed)
```typescript
// GET /api/weather/current
interface GetCurrentWeatherParams {
  latitude: number;
  longitude: number;
}

interface CurrentWeatherResponse {
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  timestamp: string;
  temperature: number; // Celsius
  feels_like: number;
  humidity: number; // Percentage
  pressure: number; // hPa
  wind_speed: number; // m/s
  wind_direction: number; // Degrees
  visibility: number; // meters
  cloud_cover: number; // Percentage
  weather: {
    main: string; // "Clear", "Clouds", "Rain", etc.
    description: string;
    icon: string; // Weather icon code
  };
  sunrise: string; // ISO 8601
  sunset: string;
}

// GET /api/weather/forecast
interface GetForecastParams {
  latitude: number;
  longitude: number;
  days?: number; // Default: 5
}

interface ForecastResponse {
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  forecasts: Array<{
    date: string; // ISO 8601 date
    temperature_max: number;
    temperature_min: number;
    precipitation_chance: number; // Percentage
    weather: {
      main: string;
      description: string;
      icon: string;
    };
  }>;
}

// GET /api/weather/alerts
interface GetWeatherAlertsParams {
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface WeatherAlert {
  id: string;
  event: string; // "Heavy Rain", "Thunderstorm", etc.
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  urgency: 'immediate' | 'expected' | 'future';
  areas_affected: string[];
  description: string;
  start_time: string;
  end_time: string;
  source: string; // "OpenWeatherMap", "IMD", etc.
}

interface WeatherAlertsResponse {
  alerts: WeatherAlert[];
  total: number;
}
```

#### Events Subscribed
```typescript
// Event: "weather.refresh_requested"
interface WeatherRefreshRequestedEvent {
  event_type: "weather.refresh_requested";
  timestamp: string;
  location?: { lat: number; lng: number };
}
```

### 🔒 IMMUTABLE OUTPUTS (What it provides)

#### Redux State Shape
```typescript
interface WeatherState {
  current: CurrentWeatherResponse | null;
  forecast: ForecastResponse | null;
  alerts: WeatherAlert[];
  selectedLocation: { lat: number; lng: number } | null;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
}
```

#### Events Published
```typescript
// Event: "weather.updated"
interface WeatherUpdatedEvent {
  event_type: "weather.updated";
  timestamp: string;
  location: { lat: number; lng: number };
  current: CurrentWeatherResponse;
}

// Event: "weather.alert_received"
interface WeatherAlertReceivedEvent {
  event_type: "weather.alert_received";
  timestamp: string;
  alert: WeatherAlert;
}
```

---

## MODULE 7: DashboardModule

### Purpose
Aggregate and display key metrics, statistics, and summaries

### Dependencies
- `AlertService` (for alert stats)
- `AssignmentService` (for response stats)
- `ShelterService` (for shelter stats)

### 🔒 IMMUTABLE INPUTS (What it receives)

#### API Calls (Consumed)
```typescript
// GET /api/dashboard/stats
interface DashboardStatsResponse {
  alerts: {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
    by_severity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    by_incident_type: Record<IncidentType, number>;
    last_24h: number;
  };
  assignments: {
    total: number;
    active: number;
    completed: number;
    average_response_time_minutes: number;
  };
  shelters: {
    total: number;
    operational: number;
    total_capacity: number;
    current_occupancy: number;
    available_capacity: number;
  };
  responders: {
    total: number;
    available: number;
    on_duty: number;
  };
  weather_alerts: {
    active: number;
    severe_count: number;
  };
}

// GET /api/dashboard/recent-activity
interface RecentActivityParams {
  limit?: number; // Default: 20
  types?: Array<'alert' | 'assignment' | 'shelter' | 'weather'>;
}

interface ActivityItem {
  id: string;
  type: 'alert_created' | 'alert_updated' | 'assignment_created' | 'assignment_completed' | 'shelter_updated';
  timestamp: string;
  user: {
    id: string;
    name: string;
    role: UserRole;
  };
  description: string;
  data: any; // Type depends on activity type
}

interface RecentActivityResponse {
  activities: ActivityItem[];
  total: number;
}
```

### 🔒 IMMUTABLE OUTPUTS (What it provides)

#### Redux State Shape
```typescript
interface DashboardState {
  stats: DashboardStatsResponse | null;
  recentActivity: ActivityItem[];
  isLoading: boolean;
  error: string | null;
  lastRefresh: string | null;
}
```

---

## MODULE 8: VolunteerModule

### Purpose
Manage volunteer registrations, assignments, and tracking

### Dependencies
- `VolunteerService` (backend)

### 🔒 IMMUTABLE INPUTS (What it receives)

#### API Calls (Consumed)
```typescript
// GET /api/volunteers
interface GetVolunteersParams {
  status?: 'active' | 'inactive' | 'pending_approval';
  skills?: string[];
  availability?: boolean;
  limit?: number;
  offset?: number;
}

interface Volunteer {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  skills: string[]; // ['first_aid', 'cooking', 'logistics', 'medical', 'search_rescue']
  availability: boolean;
  status: 'active' | 'inactive' | 'pending_approval';
  verified: boolean;
  ngo_affiliation?: string;
  location?: { latitude: number; longitude: number };
  created_at: string;
  updated_at: string;
}

interface GetVolunteersResponse {
  volunteers: Volunteer[];
  total: number;
}

// POST /api/volunteers
interface VolunteerCreate {
  full_name: string;
  email: string;
  phone: string;
  skills: string[];
  ngo_affiliation?: string;
}

// PATCH /api/volunteers/{volunteer_id}
interface VolunteerUpdateRequest {
  availability?: boolean;
  skills?: string[];
  status?: 'active' | 'inactive';
}
```

### 🔒 IMMUTABLE OUTPUTS (What it provides)

#### Redux State Shape
```typescript
interface VolunteerState {
  list: Volunteer[];
  selectedVolunteer: Volunteer | null;
  filters: VolunteerFilters;
  isLoading: boolean;
  error: string | null;
}
```

---

## BACKEND SERVICES - IMMUTABLE CONTRACTS

### Service: AlertService

#### Public Methods (Cannot change signatures)
```python
class AlertService:
    async def create_alert(
        self,
        data: AlertCreate,
        created_by: UUID
    ) -> Alert
    
    async def get_alerts(
        self,
        filters: AlertFilters
    ) -> List[Alert]
    
    async def get_alert_by_id(
        self,
        alert_id: UUID
    ) -> Optional[Alert]
    
    async def update_alert(
        self,
        alert_id: UUID,
        data: AlertUpdate,
        updated_by: UUID
    ) -> Alert
    
    async def add_alert_update(
        self,
        alert_id: UUID,
        update: AlertUpdateCreate,
        user_id: UUID
    ) -> AlertUpdate
    
    async def assign_responder(
        self,
        alert_id: UUID,
        responder_id: UUID,
        assigned_by: UUID
    ) -> Alert
```

#### Events Published (Cannot change event names or payloads)
```python
# "alert.created"
{
    "event_type": "alert.created",
    "timestamp": "2026-02-13T10:30:00Z",
    "alert_id": "uuid",
    "alert": Alert,
    "created_by": "uuid"
}

# "alert.updated"
{
    "event_type": "alert.updated",
    "timestamp": "2026-02-13T10:35:00Z",
    "alert_id": "uuid",
    "changes": dict,
    "updated_by": "uuid"
}

# "alert.assigned"
{
    "event_type": "alert.assigned",
    "timestamp": "2026-02-13T10:40:00Z",
    "alert_id": "uuid",
    "responder_id": "uuid",
    "responder_name": str,
    "assigned_by": "uuid"
}

# "alert.status_changed"
{
    "event_type": "alert.status_changed",
    "timestamp": "2026-02-13T10:45:00Z",
    "alert_id": "uuid",
    "old_status": AlertStatus,
    "new_status": AlertStatus,
    "changed_by": "uuid"
}
```

---

### Service: AssignmentService

#### Public Methods
```python
class AssignmentService:
    async def create_assignment(
        self,
        data: AssignmentCreate,
        assigned_by: UUID
    ) -> Assignment
    
    async def get_assignments(
        self,
        filters: AssignmentFilters
    ) -> List[Assignment]
    
    async def update_assignment_status(
        self,
        assignment_id: UUID,
        status: AssignmentStatus,
        updated_by: UUID,
        notes: Optional[str] = None
    ) -> Assignment
    
    async def get_responder_assignments(
        self,
        responder_id: UUID,
        status: Optional[AssignmentStatus] = None
    ) -> List[Assignment]
```

#### Events Published
```python
# "assignment.created"
{
    "event_type": "assignment.created",
    "timestamp": str,
    "assignment_id": str,
    "assignment": Assignment,
    "assigned_by": str
}

# "assignment.status_changed"
{
    "event_type": "assignment.status_changed",
    "timestamp": str,
    "assignment_id": str,
    "old_status": AssignmentStatus,
    "new_status": AssignmentStatus,
    "responder_id": str
}

# "assignment.completed"
{
    "event_type": "assignment.completed",
    "timestamp": str,
    "assignment_id": str,
    "alert_id": str,
    "responder_id": str,
    "duration_minutes": int
}
```

---

### Service: ShelterService

#### Public Methods
```python
class ShelterService:
    async def create_shelter(
        self,
        data: ShelterCreate,
        created_by: UUID
    ) -> Shelter
    
    async def get_shelters(
        self,
        filters: ShelterFilters
    ) -> List[Shelter]
    
    async def update_shelter(
        self,
        shelter_id: UUID,
        data: ShelterUpdate,
        updated_by: UUID
    ) -> Shelter
    
    async def update_occupancy(
        self,
        shelter_id: UUID,
        new_occupancy: int,
        updated_by: UUID
    ) -> Shelter
```

#### Events Published
```python
# "shelter.created"
{
    "event_type": "shelter.created",
    "timestamp": str,
    "shelter_id": str,
    "shelter": Shelter
}

# "shelter.updated"
{
    "event_type": "shelter.updated",
    "timestamp": str,
    "shelter_id": str,
    "changes": dict
}

# "shelter.capacity_changed"
{
    "event_type": "shelter.capacity_changed",
    "timestamp": str,
    "shelter_id": str,
    "old_occupancy": int,
    "new_occupancy": int,
    "available_capacity": int
}
```

---

### Service: WeatherService

#### Public Methods
```python
class WeatherService:
    async def get_current_weather(
        self,
        latitude: float,
        longitude: float
    ) -> CurrentWeather
    
    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        days: int = 5
    ) -> Forecast
    
    async def get_weather_alerts(
        self,
        bounds: Optional[GeoBounds] = None
    ) -> List[WeatherAlert]
    
    async def refresh_weather_data(self) -> None
```

#### Events Published
```python
# "weather.updated"
{
    "event_type": "weather.updated",
    "timestamp": str,
    "location": {"lat": float, "lng": float},
    "current": CurrentWeather
}

# "weather.alert_received"
{
    "event_type": "weather.alert_received",
    "timestamp": str,
    "alert": WeatherAlert
}
```

---

## 🔒 DATABASE SCHEMA - IMMUTABLE FIELD NAMES

### Table: users
```sql
id UUID PRIMARY KEY
username VARCHAR(50) NOT NULL UNIQUE
password_hash VARCHAR(255) NOT NULL
full_name VARCHAR(100) NOT NULL
email VARCHAR(100)
phone VARCHAR(20)
role VARCHAR(20) NOT NULL  -- 'admin', 'operator', 'responder', 'volunteer', 'ngo_official'
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### Table: alerts
```sql
id UUID PRIMARY KEY
title VARCHAR(100) NOT NULL
description TEXT NOT NULL
incident_type VARCHAR(50) NOT NULL
severity VARCHAR(20) NOT NULL
status VARCHAR(20) NOT NULL DEFAULT 'pending'
latitude DECIMAL(10, 8) NOT NULL
longitude DECIMAL(11, 8) NOT NULL
address TEXT
caller_name VARCHAR(100)
caller_phone VARCHAR(20)
created_by UUID NOT NULL REFERENCES users(id)
assigned_to UUID REFERENCES users(id)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
resolved_at TIMESTAMP
```

### Table: alert_updates
```sql
id UUID PRIMARY KEY
alert_id UUID NOT NULL REFERENCES alerts(id)
user_id UUID NOT NULL REFERENCES users(id)
update_text TEXT NOT NULL
status_before VARCHAR(20)
status_after VARCHAR(20)
created_at TIMESTAMP DEFAULT NOW()
```

### Table: assignments
```sql
id UUID PRIMARY KEY
alert_id UUID NOT NULL REFERENCES alerts(id)
responder_id UUID NOT NULL REFERENCES users(id)
priority VARCHAR(20) NOT NULL
status VARCHAR(20) NOT NULL DEFAULT 'pending'
notes TEXT
assigned_by UUID NOT NULL REFERENCES users(id)
assigned_at TIMESTAMP DEFAULT NOW()
acknowledged_at TIMESTAMP
started_at TIMESTAMP
completed_at TIMESTAMP
estimated_arrival TIMESTAMP
```

### Table: shelters
```sql
id UUID PRIMARY KEY
name VARCHAR(100) NOT NULL
type VARCHAR(50) NOT NULL
address TEXT NOT NULL
latitude DECIMAL(10, 8) NOT NULL
longitude DECIMAL(11, 8) NOT NULL
total_capacity INTEGER NOT NULL
current_occupancy INTEGER NOT NULL DEFAULT 0
facilities TEXT[]
contact_person VARCHAR(100)
contact_phone VARCHAR(20)
status VARCHAR(20) NOT NULL DEFAULT 'operational'
notes TEXT
created_by UUID NOT NULL REFERENCES users(id)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### Table: volunteers
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL REFERENCES users(id)
skills TEXT[]
availability BOOLEAN DEFAULT true
status VARCHAR(20) DEFAULT 'pending_approval'
verified BOOLEAN DEFAULT false
ngo_affiliation VARCHAR(100)
latitude DECIMAL(10, 8)
longitude DECIMAL(11, 8)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

---

## 🎯 RECOMMENDED ADDITIONS

### 1. NotificationService

**Purpose:** Send notifications via email, SMS, push notifications

#### Public Methods
```python
class NotificationService:
    async def send_notification(
        self,
        user_id: UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: Optional[dict] = None
    ) -> None
    
    async def send_bulk_notification(
        self,
        user_ids: List[UUID],
        notification_type: NotificationType,
        title: str,
        message: str
    ) -> None
```

#### Events Subscribed
- `alert.created` → Notify admins/operators
- `alert.assigned` → Notify assigned responder
- `assignment.status_changed` → Notify operators
- `weather.alert_received` → Notify relevant users
- `shelter.capacity_changed` → Notify admins if critical

---

### 2. AnalyticsService

**Purpose:** Generate reports, statistics, and data analysis

#### Public Methods
```python
class AnalyticsService:
    async def get_alert_statistics(
        self,
        start_date: datetime,
        end_date: datetime,
        group_by: str  # 'day', 'week', 'month', 'incident_type', 'severity'
    ) -> dict
    
    async def get_response_time_analysis(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> dict
    
    async def get_geographic_heatmap(
        self,
        incident_type: Optional[IncidentType] = None
    ) -> List[dict]
    
    async def export_report(
        self,
        report_type: str,
        format: str,  # 'pdf', 'csv', 'excel'
        params: dict
    ) -> bytes
```

---

## 📝 DEVELOPMENT CHECKLIST

Before changing any module/service code:

- [ ] Verify interface contract in this document
- [ ] Check if API endpoints will remain unchanged
- [ ] Confirm event names and payloads stay consistent
- [ ] Ensure database field names are preserved
- [ ] Validate service method signatures remain the same
- [ ] Test that other modules still work with new code
- [ ] Update only internal implementation, not external contracts

---

## 🚨 BREAKING CHANGE PROTOCOL

If you MUST change an immutable interface:

1. **Document the change reason** (critical bug, security issue, etc.)
2. **Create a migration plan** for dependent modules
3. **Version the API** (e.g., `/api/v2/alerts`)
4. **Deprecate old interface** (6-month grace period)
5. **Update all dependent modules simultaneously**
6. **Run full integration test suite**

---

## ✅ CONCLUSION

**Current Architecture Assessment:**
- ✅ Core modules are well-defined and adequate
- ✅ Event-driven architecture enables loose coupling
- ✅ Service layer properly separates concerns
- ⚠️ Need to add: NotificationService, AnalyticsService
- ✅ All interfaces are clearly specified and can remain immutable

**Next Steps:**
1. Resolve tech stack discrepancy (use v2.md specification)
2. Implement missing services (Notification, Analytics)
3. Begin module implementation following these contracts
4. Set up integration tests to verify interface contracts
5. Establish API versioning strategy

---

**Document Status:** APPROVED FOR IMPLEMENTATION  
**Last Updated:** February 13, 2026  
**Next Review:** Before Phase 2 Implementation
