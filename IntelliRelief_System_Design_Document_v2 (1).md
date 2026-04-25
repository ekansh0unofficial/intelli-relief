# IntelliRelief System Design Document

**Version:** 2.0  
**Date:** February 2026  
**Status:** Final Design Specification

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Models](#data-models)
6. [Event-Driven Architecture](#event-driven-architecture)
7. [API Specifications](#api-specifications)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Failure Handling & Resilience](#failure-handling--resilience)
11. [Scalability Strategy](#scalability-strategy)
12. [Development Guidelines](#development-guidelines)

---

## Executive Summary

### Purpose

IntelliRelief is a production-grade, event-driven disaster management and response platform designed to coordinate emergency operations between government authorities, operators, responders, NGOs, and volunteers. The system provides real-time situational awareness, incident tracking, resource coordination, and data-driven decision support during natural and man-made disasters.

### Core Design Principles

1. **Event-Driven Architecture**: Services communicate asynchronously via a centralized EventBus for loose coupling and scalability
2. **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
3. **Domain-Driven Design**: Clear bounded contexts with explicit data ownership
4. **Separation of Concerns**: UI handles presentation only; business logic resides in backend services
5. **Fail-Safe Operations**: Graceful degradation ensures core emergency functions remain operational during partial system failures
6. **Human-in-the-Loop**: All critical emergency decisions require human authorization; automation provides decision support only

### Key Features

- **Operator-Controlled Alert System**: Trained operators manually log and manage emergency help requests
- **Real-Time Dashboard**: Map-based visualization of incidents, resources, shelters, and hazards
- **Resource Coordination**: Intelligent assignment of responders, volunteers, and supplies
- **Weather & Hazard Monitoring**: Automated integration with meteorological and seismic data sources
- **Shelter Management**: Real-time tracking of evacuation centers and capacity
- **Multi-Role Access Control**: Role-based permissions for Admin, Operator, Responder, Volunteer, and NGO users

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Admin   │  │ Operator │  │Responder │  │Volunteer │   │
│  │Dashboard │  │Dashboard │  │Interface │  │ Portal   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                    React + TypeScript                        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/WSS
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   API GATEWAY LAYER                          │
│              FastAPI REST + WebSocket                        │
│                  (JWT Authentication)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Core Domain Services                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│  │
│  │  │  Alert   │ │Assignment│ │ Shelter  │ │User     ││  │
│  │  │ Service  │ │ Service  │ │ Service  │ │Access   ││  │
│  │  └──────────┘ └──────────┘ └──────────┘ │Service  ││  │
│  │  ┌──────────┐                            └─────────┘│  │
│  │  │Volunteer │                                        │  │
│  │  │ Service  │                                        │  │
│  │  └──────────┘                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Integration Services                        │  │
│  │  ┌──────────┐ ┌──────────────┐                       │  │
│  │  │ Weather  │ │   Seismic    │                       │  │
│  │  │ Service  │ │   Activity   │                       │  │
│  │  └──────────┘ │   Service    │                       │  │
│  │                └──────────────┘                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│               INFRASTRUCTURE LAYER                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ EventBus │  │PostgreSQL│  │  Redis   │  │ Logging  │   │
│  │ (Async)  │  │ Database │  │  Cache   │  │  System  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│               EXTERNAL INTEGRATIONS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │OpenWeatherMap│  │  USGS Seismic│  │ Leaflet/     │     │
│  │     API      │  │     API      │  │ Mapbox       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Architectural Patterns

#### 1. **Layered Architecture**
- **Presentation Layer**: React components (no business logic)
- **API Layer**: FastAPI routes (request/response handling)
- **Service Layer**: Business logic implementation
- **Repository Layer**: Data access abstraction
- **Infrastructure Layer**: Cross-cutting concerns

#### 2. **Repository Pattern**
- Abstracts data persistence from business logic
- Enables easy testing with mock repositories
- Supports future database migrations

#### 3. **Event-Driven Communication**
- Services publish domain events to EventBus
- Subscribers react to events asynchronously
- Enables audit logging and future analytics

#### 4. **Dependency Injection**
- Services receive dependencies via constructor injection
- Facilitates testing and modularity
- Managed by FastAPI dependency injection system

---

## Technology Stack

### Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 18.x | UI component library |
| **Language** | TypeScript | 5.x | Type-safe development |
| **State Management** | Redux Toolkit | 2.x | Application state |
| **Routing** | React Router | 6.x | Client-side routing |
| **HTTP Client** | Axios | 1.x | API communication |
| **WebSocket** | Socket.io-client | 4.x | Real-time updates |
| **Maps** | Leaflet.js | 1.9.x | GIS visualization |
| **Maps (Alternative)** | Mapbox GL JS | 2.x | Advanced mapping |
| **UI Components** | Material-UI (MUI) | 5.x | Component library |
| **Forms** | React Hook Form | 7.x | Form management |
| **Validation** | Zod | 3.x | Schema validation |
| **Date/Time** | date-fns | 2.x | Date manipulation |
| **Build Tool** | Vite | 5.x | Fast build system |

### Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | FastAPI | 0.110.x | REST API framework |
| **Language** | Python | 3.11+ | Backend language |
| **ASGI Server** | Uvicorn | 0.27.x | Production server |
| **ORM** | SQLAlchemy | 2.0.x | Database ORM |
| **Migrations** | Alembic | 1.13.x | Schema migrations |
| **Database** | PostgreSQL | 15.x | Primary database |
| **Cache** | Redis | 7.x | Session & cache store |
| **Task Queue** | Celery | 5.x | Background jobs |
| **Validation** | Pydantic | 2.x | Data validation |
| **Authentication** | PyJWT | 2.x | JWT tokens |
| **HTTP Client** | httpx | 0.27.x | External API calls |
| **WebSocket** | Socket.io | 5.x | Real-time communication |

### External APIs

| Service | Purpose | Rate Limits | Fallback |
|---------|---------|-------------|----------|
| **OpenWeatherMap API** | Weather data, alerts | 60 calls/min (free tier) | Cached data (stale acceptable) |
| **USGS Earthquake Feed** | Seismic activity | No strict limit (public feed) | Manual seismic data entry |
| **Mapbox/Leaflet Tiles** | Map rendering | Tile CDN limits | OpenStreetMap tiles |

### DevOps & Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Application packaging |
| **Orchestration** | Docker Compose / Kubernetes | Container management |
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Monitoring** | Prometheus + Grafana | System metrics |
| **Logging** | ELK Stack (Elasticsearch, Logstash, Kibana) | Centralized logging |
| **Reverse Proxy** | Nginx | Load balancing, SSL termination |

---

## System Components

### Frontend Modules

#### 1. **AuthModule**
**Responsibility**: User authentication and session management

**Features**:
- Login/logout functionality
- JWT token storage and refresh
- Role-based route guards
- Session timeout handling

**Files**:
```
src/modules/auth/
├── components/
│   ├── LoginForm.tsx
│   └── ProtectedRoute.tsx
├── hooks/
│   └── useAuth.ts
├── services/
│   └── authService.ts
└── types/
    └── auth.types.ts
```

---

#### 2. **AlertModule**
**Responsibility**: Display and manage emergency help alerts

**Features**:
- Alert list view with filters
- Alert detail modal
- Status update interface
- Timeline of alert updates
- Priority/severity indicators

**Files**:
```
src/modules/alerts/
├── components/
│   ├── AlertList.tsx
│   ├── AlertCard.tsx
│   ├── AlertDetail.tsx
│   ├── AlertForm.tsx
│   ├── AlertFilters.tsx
│   └── AlertTimeline.tsx
├── hooks/
│   └── useAlerts.ts
└── types/
    └── alert.types.ts
```

---

#### 3. **AssignmentModule**
**Responsibility**: Responder and resource assignment

**Features**:
- Available responder list
- Assignment interface
- Status tracking
- Proximity-based suggestions

**Files**:
```
src/modules/assignments/
├── components/
│   ├── ResponderList.tsx
│   ├── AssignmentPanel.tsx
│   └── ResponderStatus.tsx
└── types/
    └── assignment.types.ts
```

---

#### 4. **ShelterModule**
**Responsibility**: Shelter and safe zone management

**Features**:
- Shelter list and map view
- Capacity tracking
- Status updates (open/full/closed)
- Shelter details and resources

**Files**:
```
src/modules/shelters/
├── components/
│   ├── ShelterList.tsx
│   ├── ShelterCard.tsx
│   ├── ShelterForm.tsx
│   └── CapacityIndicator.tsx
└── types/
    └── shelter.types.ts
```

---

#### 5. **WeatherModule**
**Responsibility**: Weather and hazard data display

**Features**:
- Current weather conditions
- Weather alerts
- Forecast display
- Hazard warnings

**Files**:
```
src/modules/weather/
├── components/
│   ├── WeatherWidget.tsx
│   ├── WeatherAlerts.tsx
│   └── HazardIndicators.tsx
└── types/
    └── weather.types.ts
```

---

#### 6. **MapModule**
**Responsibility**: GIS visualization (presentation only)

**Features**:
- Interactive map with layers
- Alert markers
- Shelter markers
- Responder locations
- Hazard zones
- Heatmaps

**Files**:
```
src/modules/map/
├── components/
│   ├── MapContainer.tsx
│   ├── AlertMarker.tsx
│   ├── ShelterMarker.tsx
│   ├── ResponderMarker.tsx
│   ├── HazardLayer.tsx
│   └── MapControls.tsx
├── hooks/
│   └── useMap.ts
└── utils/
    └── mapHelpers.ts
```

---

#### 7. **UserManagementModule**
**Responsibility**: User account administration

**Features**:
- User creation/editing
- Role assignment
- Account activation/deactivation
- User list and search

**Files**:
```
src/modules/users/
├── components/
│   ├── UserList.tsx
│   ├── UserForm.tsx
│   └── RoleSelector.tsx
└── types/
    └── user.types.ts
```

---

#### 8. **DashboardModule**
**Responsibility**: Main dashboard and overview

**Features**:
- Key metrics and KPIs
- Active alert summary
- Weather overview
- System status
- Recent activity feed

**Files**:
```
src/modules/dashboard/
├── components/
│   ├── Dashboard.tsx
│   ├── MetricsCard.tsx
│   ├── ActivityFeed.tsx
│   └── QuickActions.tsx
└── types/
    └── dashboard.types.ts
```

---

### Backend Services

#### Core Domain Services

#### 1. **AlertService**
**Responsibility**: Manages emergency help alerts

**Data Ownership**: Alert entities

**Key Operations**:
- `create_alert(data: AlertCreate) -> Alert`
- `get_alert(alert_id: UUID) -> Alert`
- `update_alert(alert_id: UUID, data: AlertUpdate) -> Alert`
- `list_alerts(filters: AlertFilters) -> List[Alert]`
- `change_severity(alert_id: UUID, severity: Severity) -> Alert`
- `resolve_alert(alert_id: UUID) -> Alert`
- `add_update(alert_id: UUID, update: AlertUpdate) -> AlertUpdate`

**Events Published**:
- `AlertCreated`
- `AlertUpdated`
- `AlertResolved`
- `AlertSeverityChanged`
- `AlertAssigned`

**Database Tables**:
- `alerts`
- `alert_updates`

**File Structure**:
```
backend/services/alert/
├── __init__.py
├── models.py          # SQLAlchemy models
├── schemas.py         # Pydantic schemas
├── repository.py      # Database operations
├── service.py         # Business logic
├── routes.py          # API endpoints
└── events.py          # Event definitions
```

---

#### 2. **AssignmentService**
**Responsibility**: Manages responder assignments and availability

**Data Ownership**: Responder entities, Assignment records

**Key Operations**:
- `register_responder(data: ResponderCreate) -> Responder`
- `update_availability(responder_id: UUID, status: AvailabilityStatus) -> Responder`
- `assign_to_alert(alert_id: UUID, responder_id: UUID) -> Assignment`
- `get_available_responders(filters: ResponderFilters) -> List[Responder]`
- `suggest_responders(alert_id: UUID) -> List[Responder]`  # Proximity-based
- `acknowledge_assignment(assignment_id: UUID) -> Assignment`
- `complete_assignment(assignment_id: UUID) -> Assignment`

**Events Published**:
- `ResponderRegistered`
- `ResponderAvailabilityChanged`
- `ResponderAssignedToAlert`
- `AssignmentAcknowledged`
- `AssignmentCompleted`

**Events Subscribed**:
- `AlertCreated` → Update assignment suggestions
- `AlertResolved` → Mark assignment complete

**Database Tables**:
- `responders`
- `assignments`

---

#### 3. **ShelterService**
**Responsibility**: Manages evacuation shelters and safe zones

**Data Ownership**: Shelter entities

**Key Operations**:
- `create_shelter(data: ShelterCreate) -> Shelter`
- `update_shelter(shelter_id: UUID, data: ShelterUpdate) -> Shelter`
- `update_capacity(shelter_id: UUID, current_occupancy: int) -> Shelter`
- `list_shelters(filters: ShelterFilters) -> List[Shelter]`
- `find_nearest_shelters(lat: float, lon: float, limit: int) -> List[Shelter]`

**Events Published**:
- `ShelterCreated`
- `ShelterUpdated`
- `ShelterCapacityChanged`
- `ShelterFull`
- `ShelterClosed`

**Database Tables**:
- `shelters`

---

#### 4. **VolunteerService**
**Responsibility**: Manages volunteer registration and task assignment

**Data Ownership**: Volunteer entities

**Key Operations**:
- `register_volunteer(data: VolunteerCreate) -> Volunteer`
- `update_availability(volunteer_id: UUID, available: bool) -> Volunteer`
- `assign_task(volunteer_id: UUID, task: VolunteerTask) -> Assignment`
- `list_volunteers(filters: VolunteerFilters) -> List[Volunteer]`

**Events Published**:
- `VolunteerRegistered`
- `VolunteerAvailabilityChanged`
- `VolunteerAssignedToTask`

**Database Tables**:
- `volunteers`
- `volunteer_tasks`

---

#### 5. **UserAccessService**
**Responsibility**: User authentication, authorization, and account management

**Data Ownership**: User entities

**Key Operations**:
- `create_user(data: UserCreate) -> User`
- `authenticate(username: str, password: str) -> TokenPair`
- `refresh_token(refresh_token: str) -> TokenPair`
- `update_user(user_id: UUID, data: UserUpdate) -> User`
- `deactivate_user(user_id: UUID) -> User`
- `assign_role(user_id: UUID, role: UserRole) -> User`

**Events Published**:
- `UserCreated`
- `UserUpdated`
- `UserDeactivated`
- `UserRoleChanged`

**Database Tables**:
- `users`
- `user_roles`

---

#### Integration Services

#### 6. **WeatherService**
**Responsibility**: Fetches and processes weather data from external APIs

**Data Ownership**: Weather records, Weather alerts

**Key Operations**:
- `fetch_current_weather(lat: float, lon: float) -> WeatherData`
- `fetch_forecast(lat: float, lon: float, days: int) -> List[ForecastData]`
- `fetch_alerts(region: str) -> List[WeatherAlert]`
- `store_weather_data(data: WeatherData) -> WeatherRecord`

**Events Published**:
- `WeatherUpdated`
- `SevereWeatherDetected`
- `WeatherAlertIssued`

**Events Subscribed**:
- None (runs on schedule)

**External Dependencies**:
- OpenWeatherMap API

**Database Tables**:
- `weather_data`
- `weather_alerts`

**Caching Strategy**:
- Current weather: 10-minute TTL
- Forecast: 1-hour TTL
- Alerts: 5-minute TTL

---

#### 7. **SeismicActivityService**
**Responsibility**: Monitors seismic activity from USGS feed

**Data Ownership**: Seismic event records

**Key Operations**:
- `fetch_recent_earthquakes(region: str, min_magnitude: float) -> List[SeismicEvent]`
- `store_seismic_event(event: SeismicEvent) -> SeismicRecord`
- `check_significant_events() -> List[SeismicEvent]`

**Events Published**:
- `SeismicActivityDetected`
- `SignificantEarthquakeDetected` (magnitude >= 5.0)

**Events Subscribed**:
- None (runs on schedule)

**External Dependencies**:
- USGS Earthquake Feed

**Database Tables**:
- `seismic_events`

**Polling Frequency**:
- Every 5 minutes for significant events (magnitude >= 4.0)
- Every 15 minutes for all events

---

### Infrastructure Components

#### 8. **EventBus**
**Responsibility**: Asynchronous event distribution between services

**Implementation**: 
- **Phase 1**: In-memory async queue (Python `asyncio.Queue`)
- **Phase 2**: Redis Pub/Sub
- **Phase 3**: RabbitMQ with persistent queues

**Features**:
- Publish/subscribe pattern
- Event persistence (Phase 2+)
- Retry mechanism for failed handlers
- Dead letter queue for unprocessable events

**API**:
```python
class EventBus:
    async def publish(self, event: DomainEvent) -> None
    async def subscribe(self, event_type: Type[DomainEvent], handler: EventHandler) -> None
    async def unsubscribe(self, event_type: Type[DomainEvent], handler: EventHandler) -> None
```

---

#### 9. **Logging & Audit System**
**Responsibility**: Centralized logging and audit trail

**Features**:
- Structured logging (JSON format)
- Request/response logging
- Error tracking with stack traces
- Audit trail for critical operations
- Log aggregation and search

**Log Levels**:
- **DEBUG**: Development debugging
- **INFO**: General information (API calls, event processing)
- **WARNING**: Degraded service, API rate limits
- **ERROR**: Application errors
- **CRITICAL**: System failures

**Audit Events**:
- User login/logout
- Alert creation/update
- Responder assignment
- Shelter status changes
- Configuration changes

---

## Data Models

### Core Entities

#### Alert
```python
class Alert(Base):
    __tablename__ = "alerts"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    
    # Incident Information
    title: str = Column(String(200), nullable=False)
    description: str = Column(Text, nullable=False)
    incident_type: IncidentType = Column(Enum(IncidentType), nullable=False)
    severity: Severity = Column(Enum(Severity), nullable=False)
    status: AlertStatus = Column(Enum(AlertStatus), default=AlertStatus.OPEN)
    
    # Location
    latitude: float = Column(Float, nullable=False)
    longitude: float = Column(Float, nullable=False)
    address: str = Column(String(500), nullable=True)
    
    # Caller Information
    caller_name: str = Column(String(200), nullable=True)
    caller_phone: str = Column(String(20), nullable=True)
    
    # Assignment
    assigned_responder_id: UUID = Column(UUID(as_uuid=True), ForeignKey("responders.id"), nullable=True)
    
    # Metadata
    created_by_id: UUID = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    resolved_at: datetime = Column(DateTime, nullable=True)
    
    # Relationships
    updates = relationship("AlertUpdate", back_populates="alert", cascade="all, delete-orphan")
    assigned_responder = relationship("Responder", back_populates="assigned_alerts")
    creator = relationship("User", back_populates="created_alerts")
```

**Enums**:
```python
class IncidentType(str, Enum):
    FLOOD = "flood"
    FIRE = "fire"
    EARTHQUAKE = "earthquake"
    CYCLONE = "cyclone"
    LANDSLIDE = "landslide"
    MEDICAL_EMERGENCY = "medical_emergency"
    STRUCTURAL_COLLAPSE = "structural_collapse"
    EVACUATION_NEEDED = "evacuation_needed"
    OTHER = "other"

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(str, Enum):
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"
```

---

#### AlertUpdate
```python
class AlertUpdate(Base):
    __tablename__ = "alert_updates"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    alert_id: UUID = Column(UUID(as_uuid=True), ForeignKey("alerts.id"), nullable=False)
    created_at: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    message: str = Column(Text, nullable=False)
    update_type: UpdateType = Column(Enum(UpdateType), nullable=False)
    created_by_id: UUID = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    alert = relationship("Alert", back_populates="updates")
    creator = relationship("User")

class UpdateType(str, Enum):
    STATUS_CHANGE = "status_change"
    SEVERITY_CHANGE = "severity_change"
    PROGRESS_UPDATE = "progress_update"
    COMMENT = "comment"
```

---

#### Responder
```python
class Responder(Base):
    __tablename__ = "responders"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    
    # Personal Information
    name: str = Column(String(200), nullable=False)
    phone: str = Column(String(20), nullable=False)
    email: str = Column(String(200), nullable=True)
    
    # Responder Details
    responder_type: ResponderType = Column(Enum(ResponderType), nullable=False)
    unit_name: str = Column(String(200), nullable=True)
    
    # Status
    availability_status: AvailabilityStatus = Column(Enum(AvailabilityStatus), default=AvailabilityStatus.AVAILABLE)
    
    # Current Location (optional)
    current_latitude: float = Column(Float, nullable=True)
    current_longitude: float = Column(Float, nullable=True)
    
    # Relationships
    assigned_alerts = relationship("Alert", back_populates="assigned_responder")
    assignments = relationship("Assignment", back_populates="responder")

class ResponderType(str, Enum):
    POLICE = "police"
    FIRE = "fire"
    AMBULANCE = "ambulance"
    RESCUE_TEAM = "rescue_team"
    CIVIL_DEFENSE = "civil_defense"

class AvailabilityStatus(str, Enum):
    AVAILABLE = "available"
    ON_ASSIGNMENT = "on_assignment"
    OFF_DUTY = "off_duty"
    UNAVAILABLE = "unavailable"
```

---

#### Shelter
```python
class Shelter(Base):
    __tablename__ = "shelters"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    
    # Shelter Information
    name: str = Column(String(200), nullable=False)
    address: str = Column(String(500), nullable=False)
    
    # Location
    latitude: float = Column(Float, nullable=False)
    longitude: float = Column(Float, nullable=False)
    
    # Capacity
    max_capacity: int = Column(Integer, nullable=False)
    current_occupancy: int = Column(Integer, default=0)
    
    # Status
    operational_status: ShelterStatus = Column(Enum(ShelterStatus), default=ShelterStatus.OPEN)
    
    # Contact
    contact_person: str = Column(String(200), nullable=True)
    contact_phone: str = Column(String(20), nullable=True)
    
    # Resources
    facilities: JSON = Column(JSON, default=list)  # ["medical", "food", "water", "electricity"]

class ShelterStatus(str, Enum):
    OPEN = "open"
    FULL = "full"
    CLOSED = "closed"
    PREPARING = "preparing"
```

---

#### User
```python
class User(Base):
    __tablename__ = "users"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    
    # Credentials
    username: str = Column(String(100), unique=True, nullable=False)
    email: str = Column(String(200), unique=True, nullable=False)
    hashed_password: str = Column(String(255), nullable=False)
    
    # Profile
    full_name: str = Column(String(200), nullable=False)
    phone: str = Column(String(20), nullable=True)
    
    # Access Control
    role: UserRole = Column(Enum(UserRole), nullable=False)
    is_active: bool = Column(Boolean, default=True)
    
    # Relationships
    created_alerts = relationship("Alert", back_populates="creator")

class UserRole(str, Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    RESPONDER = "responder"
    VOLUNTEER = "volunteer"
    NGO_OFFICIAL = "ngo_official"
```

---

#### Volunteer
```python
class Volunteer(Base):
    __tablename__ = "volunteers"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Personal Information
    name: str = Column(String(200), nullable=False)
    phone: str = Column(String(20), nullable=False)
    email: str = Column(String(200), nullable=True)
    
    # Skills
    skills: JSON = Column(JSON, default=list)  # ["first_aid", "logistics", "communication"]
    
    # Availability
    is_available: bool = Column(Boolean, default=True)
    
    # Associated User (optional)
    user_id: UUID = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
```

---

#### WeatherData
```python
class WeatherData(Base):
    __tablename__ = "weather_data"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    recorded_at: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Location
    latitude: float = Column(Float, nullable=False)
    longitude: float = Column(Float, nullable=False)
    region_name: str = Column(String(200), nullable=True)
    
    # Weather Metrics
    temperature: float = Column(Float, nullable=False)  # Celsius
    humidity: int = Column(Integer, nullable=False)  # Percentage
    wind_speed: float = Column(Float, nullable=False)  # km/h
    rainfall: float = Column(Float, default=0.0)  # mm
    pressure: float = Column(Float, nullable=True)  # hPa
    
    # Conditions
    condition: str = Column(String(100), nullable=True)  # "clear", "rain", "storm"
    description: str = Column(String(200), nullable=True)
```

---

## Event-Driven Architecture

### Event Model

All domain events inherit from `DomainEvent`:

```python
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID, uuid4
from typing import Any, Dict

@dataclass
class DomainEvent:
    event_id: UUID = uuid4()
    event_type: str = ""
    occurred_at: datetime = datetime.utcnow()
    payload: Dict[str, Any] = {}
    
    def to_dict(self) -> dict:
        return {
            "event_id": str(self.event_id),
            "event_type": self.event_type,
            "occurred_at": self.occurred_at.isoformat(),
            "payload": self.payload
        }
```

### Event Catalog

#### Alert Events

```python
@dataclass
class AlertCreated(DomainEvent):
    event_type: str = "alert.created"
    
    # Payload structure:
    # {
    #   "alert_id": str,
    #   "severity": str,
    #   "incident_type": str,
    #   "latitude": float,
    #   "longitude": float,
    #   "created_by_id": str
    # }

@dataclass
class AlertUpdated(DomainEvent):
    event_type: str = "alert.updated"

@dataclass
class AlertResolved(DomainEvent):
    event_type: str = "alert.resolved"

@dataclass
class AlertSeverityChanged(DomainEvent):
    event_type: str = "alert.severity_changed"
    
    # Payload:
    # {
    #   "alert_id": str,
    #   "old_severity": str,
    #   "new_severity": str
    # }

@dataclass
class AlertAssigned(DomainEvent):
    event_type: str = "alert.assigned"
    
    # Payload:
    # {
    #   "alert_id": str,
    #   "responder_id": str,
    #   "assigned_by_id": str
    # }
```

#### Weather & Seismic Events

```python
@dataclass
class WeatherUpdated(DomainEvent):
    event_type: str = "weather.updated"

@dataclass
class SevereWeatherDetected(DomainEvent):
    event_type: str = "weather.severe_detected"
    
    # Payload:
    # {
    #   "region": str,
    #   "hazard_type": str,  # "storm", "cyclone", "heavy_rain"
    #   "severity": str,
    #   "expires_at": str (ISO 8601)
    # }

@dataclass
class SeismicActivityDetected(DomainEvent):
    event_type: str = "seismic.detected"
    
    # Payload:
    # {
    #   "magnitude": float,
    #   "latitude": float,
    #   "longitude": float,
    #   "depth": float,
    #   "region": str
    # }
```

#### Assignment Events

```python
@dataclass
class ResponderAvailabilityChanged(DomainEvent):
    event_type: str = "responder.availability_changed"

@dataclass
class ResponderAssignedToAlert(DomainEvent):
    event_type: str = "responder.assigned"
```

#### Shelter Events

```python
@dataclass
class ShelterCapacityChanged(DomainEvent):
    event_type: str = "shelter.capacity_changed"
    
    # Payload:
    # {
    #   "shelter_id": str,
    #   "max_capacity": int,
    #   "current_occupancy": int,
    #   "occupancy_percentage": float
    # }

@dataclass
class ShelterFull(DomainEvent):
    event_type: str = "shelter.full"
```

---

### Event Flow Examples

#### Example 1: Alert Creation Flow

```
1. Operator creates alert via AlertModule UI
   ↓
2. Frontend POST /api/alerts
   ↓
3. AlertService.create_alert() saves to DB
   ↓
4. AlertService publishes AlertCreated event to EventBus
   ↓
5. EventBus distributes event to subscribers:
   - LoggingService → Writes audit log
   - WebSocketService → Broadcasts to connected clients (real-time update)
   - AssignmentService → Updates responder suggestions
   - NotificationService (future) → Sends notifications
```

#### Example 2: Severe Weather Detection Flow

```
1. WeatherService polls OpenWeatherMap API every 10 minutes
   ↓
2. API returns severe storm warning
   ↓
3. WeatherService.process_alerts() detects severity threshold
   ↓
4. WeatherService publishes SevereWeatherDetected event
   ↓
5. EventBus distributes event to:
   - AlertService → Auto-creates weather-related alert (optional)
   - WebSocketService → Shows weather warning on all dashboards
   - LoggingService → Logs hazard detection
```

---

## API Specifications

### RESTful API Design

**Base URL**: `https://api.intellirelief.gov/v1`

**Authentication**: JWT Bearer Token in `Authorization` header

```
Authorization: Bearer <jwt_token>
```

---

### Authentication Endpoints

#### POST /auth/login
**Description**: Authenticate user and obtain JWT tokens

**Request**:
```json
{
  "username": "operator001",
  "password": "securepassword"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "operator001",
    "full_name": "John Doe",
    "role": "operator",
    "email": "john.doe@example.com"
  }
}
```

**Error** (401 Unauthorized):
```json
{
  "detail": "Incorrect username or password"
}
```

---

#### POST /auth/refresh
**Description**: Refresh access token using refresh token

**Request**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

### Alert Endpoints

#### GET /alerts
**Description**: List alerts with filters

**Query Parameters**:
- `status` (optional): Filter by status (open, assigned, in_progress, resolved)
- `severity` (optional): Filter by severity (low, medium, high, critical)
- `incident_type` (optional): Filter by incident type
- `limit` (default: 50, max: 100)
- `offset` (default: 0)

**Response** (200 OK):
```json
{
  "total": 127,
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Flood Emergency - Residential Area",
      "description": "Severe flooding reported in low-lying residential areas...",
      "incident_type": "flood",
      "severity": "high",
      "status": "assigned",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "address": "Sector 12, New Delhi, India",
      "caller_name": "Rajesh Kumar",
      "caller_phone": "+91 98765 43210",
      "assigned_responder_id": "660f9500-f39c-52e5-b827-557766551111",
      "created_at": "2026-02-07T10:30:00Z",
      "updated_at": "2026-02-07T10:45:00Z",
      "created_by": {
        "id": "770g0600-g40d-63f6-c938-668877662222",
        "full_name": "Operator Singh"
      }
    }
  ],
  "limit": 50,
  "offset": 0
}
```

---

#### POST /alerts
**Description**: Create new alert

**Permissions**: Admin, Operator

**Request**:
```json
{
  "title": "Fire Emergency - Industrial Complex",
  "description": "Large fire reported in chemical storage facility...",
  "incident_type": "fire",
  "severity": "critical",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "address": "Industrial Area Phase 1, Delhi",
  "caller_name": "Amit Sharma",
  "caller_phone": "+91 98123 45678"
}
```

**Response** (201 Created):
```json
{
  "id": "880h1700-h51e-74g7-d049-779988773333",
  "title": "Fire Emergency - Industrial Complex",
  "status": "open",
  "created_at": "2026-02-07T11:00:00Z",
  ...
}
```

---

#### GET /alerts/{alert_id}
**Description**: Get alert details with timeline

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Flood Emergency - Residential Area",
  "description": "...",
  "incident_type": "flood",
  "severity": "high",
  "status": "in_progress",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "assigned_responder": {
    "id": "660f9500-f39c-52e5-b827-557766551111",
    "name": "Fire Unit 7",
    "responder_type": "fire",
    "phone": "+91 98111 22333"
  },
  "updates": [
    {
      "id": "990i2800-i62f-85h8-e15a-88aa99884444",
      "message": "Responder en route to location",
      "update_type": "progress_update",
      "created_at": "2026-02-07T10:50:00Z",
      "created_by": {
        "full_name": "Responder Kapoor"
      }
    },
    {
      "id": "aa0j3900-j73g-96i9-f26b-99bb00995555",
      "message": "Status changed to In Progress",
      "update_type": "status_change",
      "created_at": "2026-02-07T10:45:00Z",
      "created_by": {
        "full_name": "Operator Singh"
      }
    }
  ],
  "created_at": "2026-02-07T10:30:00Z",
  "updated_at": "2026-02-07T10:50:00Z"
}
```

---

#### PUT /alerts/{alert_id}
**Description**: Update alert information

**Permissions**: Admin, Operator, Assigned Responder

**Request**:
```json
{
  "severity": "critical",
  "description": "Updated: Fire spreading to adjacent buildings"
}
```

**Response** (200 OK):
```json
{
  "id": "880h1700-h51e-74g7-d049-779988773333",
  "severity": "critical",
  "updated_at": "2026-02-07T11:15:00Z",
  ...
}
```

---

#### POST /alerts/{alert_id}/updates
**Description**: Add update/comment to alert

**Request**:
```json
{
  "message": "Evacuation of nearby buildings in progress",
  "update_type": "progress_update"
}
```

**Response** (201 Created):
```json
{
  "id": "bb1k4a00-k84h-a7j0-g37c-aaccbb006666",
  "alert_id": "880h1700-h51e-74g7-d049-779988773333",
  "message": "Evacuation of nearby buildings in progress",
  "update_type": "progress_update",
  "created_at": "2026-02-07T11:20:00Z",
  "created_by": {
    "id": "660f9500-f39c-52e5-b827-557766551111",
    "full_name": "Responder Verma"
  }
}
```

---

#### POST /alerts/{alert_id}/assign
**Description**: Assign responder to alert

**Permissions**: Admin, Operator

**Request**:
```json
{
  "responder_id": "660f9500-f39c-52e5-b827-557766551111"
}
```

**Response** (200 OK):
```json
{
  "id": "880h1700-h51e-74g7-d049-779988773333",
  "status": "assigned",
  "assigned_responder": {
    "id": "660f9500-f39c-52e5-b827-557766551111",
    "name": "Fire Unit 7"
  },
  "updated_at": "2026-02-07T11:25:00Z"
}
```

---

### Responder Endpoints

#### GET /responders
**Description**: List responders with availability filters

**Query Parameters**:
- `availability_status` (optional): available, on_assignment, off_duty
- `responder_type` (optional): police, fire, ambulance, rescue_team
- `near_lat`, `near_lon`, `radius_km` (optional): Find responders near location

**Response** (200 OK):
```json
{
  "total": 45,
  "items": [
    {
      "id": "660f9500-f39c-52e5-b827-557766551111",
      "name": "Fire Unit 7",
      "responder_type": "fire",
      "unit_name": "Delhi Fire Service - Station 7",
      "availability_status": "available",
      "phone": "+91 98111 22333",
      "current_latitude": 28.6500,
      "current_longitude": 77.2000
    }
  ]
}
```

---

#### GET /responders/suggest/{alert_id}
**Description**: Get suggested responders for an alert (proximity-based)

**Response** (200 OK):
```json
{
  "alert_id": "880h1700-h51e-74g7-d049-779988773333",
  "suggestions": [
    {
      "responder": {
        "id": "660f9500-f39c-52e5-b827-557766551111",
        "name": "Fire Unit 7",
        "responder_type": "fire"
      },
      "distance_km": 2.3,
      "eta_minutes": 8
    },
    {
      "responder": {
        "id": "cc2l5b00-l95i-b8k1-h48d-bbddcc117777",
        "name": "Fire Unit 12",
        "responder_type": "fire"
      },
      "distance_km": 4.7,
      "eta_minutes": 15
    }
  ]
}
```

---

### Shelter Endpoints

#### GET /shelters
**Description**: List shelters

**Query Parameters**:
- `operational_status` (optional): open, full, closed
- `near_lat`, `near_lon`, `radius_km` (optional): Find shelters near location

**Response** (200 OK):
```json
{
  "total": 23,
  "items": [
    {
      "id": "dd3m6c00-m06j-c9l2-i59e-cceedd228888",
      "name": "Community Center Shelter",
      "address": "Block A, Sector 15, New Delhi",
      "latitude": 28.5800,
      "longitude": 77.3200,
      "max_capacity": 500,
      "current_occupancy": 320,
      "occupancy_percentage": 64.0,
      "operational_status": "open",
      "facilities": ["medical", "food", "water", "electricity", "sanitation"],
      "contact_person": "Dr. Meera Patel",
      "contact_phone": "+91 98765 11223"
    }
  ]
}
```

---

#### POST /shelters
**Description**: Create new shelter

**Permissions**: Admin

**Request**:
```json
{
  "name": "Sports Complex Shelter",
  "address": "Municipal Stadium, Sector 22, New Delhi",
  "latitude": 28.6200,
  "longitude": 77.2800,
  "max_capacity": 1000,
  "facilities": ["food", "water", "medical"],
  "contact_person": "Coordinator Singh",
  "contact_phone": "+91 98123 99887"
}
```

**Response** (201 Created):
```json
{
  "id": "ee4n7d00-n17k-d0m3-j60f-ddfee3399999",
  "name": "Sports Complex Shelter",
  "operational_status": "open",
  "current_occupancy": 0,
  ...
}
```

---

#### PUT /shelters/{shelter_id}/capacity
**Description**: Update shelter occupancy

**Permissions**: Admin, Operator

**Request**:
```json
{
  "current_occupancy": 450
}
```

**Response** (200 OK):
```json
{
  "id": "dd3m6c00-m06j-c9l2-i59e-cceedd228888",
  "current_occupancy": 450,
  "occupancy_percentage": 90.0,
  "updated_at": "2026-02-07T12:00:00Z"
}
```

---

### Weather Endpoints

#### GET /weather/current
**Description**: Get current weather for a location

**Query Parameters**:
- `lat` (required): Latitude
- `lon` (required): Longitude

**Response** (200 OK):
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "temperature": 32.5,
  "humidity": 68,
  "wind_speed": 15.3,
  "rainfall": 0.0,
  "condition": "partly_cloudy",
  "description": "Partly cloudy with light winds",
  "recorded_at": "2026-02-07T12:00:00Z"
}
```

---

#### GET /weather/alerts
**Description**: Get active weather alerts for a region

**Query Parameters**:
- `region` (optional): Region name

**Response** (200 OK):
```json
{
  "alerts": [
    {
      "id": "ff5o8e00-o28l-e1n4-k71g-eefff4400000",
      "alert_type": "heavy_rain",
      "severity": "high",
      "region": "Delhi NCR",
      "description": "Heavy rainfall expected for next 6 hours",
      "issued_at": "2026-02-07T11:00:00Z",
      "expires_at": "2026-02-07T17:00:00Z"
    }
  ]
}
```

---

### WebSocket API

**Endpoint**: `wss://api.intellirelief.gov/v1/ws`

**Authentication**: Send JWT token in initial connection message

#### Connection
```javascript
const socket = io('wss://api.intellirelief.gov/v1/ws', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIs...'
  }
});
```

#### Events from Server

**alert.created**
```json
{
  "event": "alert.created",
  "data": {
    "id": "880h1700-h51e-74g7-d049-779988773333",
    "title": "Fire Emergency - Industrial Complex",
    "severity": "critical",
    ...
  }
}
```

**alert.updated**
```json
{
  "event": "alert.updated",
  "data": {
    "id": "880h1700-h51e-74g7-d049-779988773333",
    "severity": "critical",
    "updated_at": "2026-02-07T11:15:00Z"
  }
}
```

**weather.severe_detected**
```json
{
  "event": "weather.severe_detected",
  "data": {
    "region": "Delhi NCR",
    "hazard_type": "storm",
    "severity": "high"
  }
}
```

---

## Security Architecture

### Authentication & Authorization

#### JWT Token Structure

**Access Token** (expires in 1 hour):
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // user_id
  "username": "operator001",
  "role": "operator",
  "exp": 1707310800,  // Expiration timestamp
  "iat": 1707307200,  // Issued at timestamp
  "type": "access"
}
```

**Refresh Token** (expires in 7 days):
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "type": "refresh",
  "exp": 1707912000,
  "iat": 1707307200
}
```

#### Password Hashing

- **Algorithm**: bcrypt with 12 rounds
- **Library**: `passlib` with bcrypt backend
- **Salt**: Automatically generated per password

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash("plaintext_password")
is_valid = pwd_context.verify("plaintext_password", hashed)
```

---

### Role-Based Access Control (RBAC)

#### Permission Matrix

| Endpoint | Admin | Operator | Responder | Volunteer | NGO Official |
|----------|-------|----------|-----------|-----------|--------------|
| **Alerts** |
| GET /alerts | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /alerts | ✓ | ✓ | ✗ | ✗ | ✗ |
| PUT /alerts/{id} | ✓ | ✓ | ✓ (assigned) | ✗ | ✗ |
| POST /alerts/{id}/updates | ✓ | ✓ | ✓ (assigned) | ✗ | ✗ |
| POST /alerts/{id}/assign | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Responders** |
| GET /responders | ✓ | ✓ | ✓ | ✗ | ✗ |
| POST /responders | ✓ | ✗ | ✗ | ✗ | ✗ |
| PUT /responders/{id} | ✓ | ✗ | ✓ (self) | ✗ | ✗ |
| **Shelters** |
| GET /shelters | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /shelters | ✓ | ✗ | ✗ | ✗ | ✗ |
| PUT /shelters/{id} | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Users** |
| POST /users | ✓ | ✗ | ✗ | ✗ | ✗ |
| PUT /users/{id} | ✓ | ✗ | ✗ | ✗ | ✗ |
| DELETE /users/{id} | ✓ | ✗ | ✗ | ✗ | ✗ |

---

### API Security Measures

#### 1. **Rate Limiting**
- **Per User**: 100 requests/minute
- **Per IP**: 1000 requests/minute
- **Login Endpoint**: 5 attempts/15 minutes per IP

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/auth/login")
@limiter.limit("5/15minute")
async def login(request: Request, credentials: LoginRequest):
    ...
```

#### 2. **Input Validation**
- All request bodies validated with Pydantic schemas
- SQL injection prevention via ORM (SQLAlchemy)
- XSS prevention via automatic HTML escaping in frontend

#### 3. **HTTPS Only**
- All production traffic encrypted with TLS 1.3
- HSTS header enforced
- Certificate pinning for mobile apps (future)

#### 4. **CORS Configuration**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.intellirelief.gov"],  # Frontend domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

## Deployment Architecture

### Infrastructure Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                   (Nginx / HAProxy)                      │
│                  SSL Termination                         │
└────────────────────┬────────────────────────────────────┘
                     │
       ┌─────────────┴─────────────┐
       │                           │
┌──────▼──────┐            ┌──────▼──────┐
│  Frontend   │            │  Frontend   │
│  Container  │            │  Container  │
│  (Nginx)    │            │  (Nginx)    │
└─────────────┘            └─────────────┘
       │                           │
       └─────────────┬─────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              API Gateway (Nginx)                         │
└────────────────────┬────────────────────────────────────┘
                     │
       ┌─────────────┼─────────────┐
       │             │             │
┌──────▼──────┐ ┌───▼────────┐ ┌──▼──────────┐
│   FastAPI   │ │  FastAPI   │ │  FastAPI    │
│  Instance 1 │ │ Instance 2 │ │ Instance 3  │
└─────┬───────┘ └─────┬──────┘ └──────┬──────┘
      │               │               │
      └───────────────┼───────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
   ┌─────▼─────┐ ┌───▼────┐ ┌────▼────┐
   │PostgreSQL │ │ Redis  │ │EventBus │
   │  Primary  │ │ Cache  │ │(Redis)  │
   └─────┬─────┘ └────────┘ └─────────┘
         │
   ┌─────▼─────┐
   │PostgreSQL │
   │  Replica  │
   │(Read-only)│
   └───────────┘
```

---

### Container Configuration

#### Docker Compose (Development)

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/intellirelief
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=intellirelief
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  celery_worker:
    build: ./backend
    command: celery -A app.celery worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/intellirelief
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
  redis_data:
```

---

### Production Deployment (Kubernetes Example)

#### Backend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: intellirelief-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: fastapi
        image: intellirelief/backend:v2.0
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

### Environment Configuration

#### Development
```env
# .env.development
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost:5432/intellirelief_dev
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=dev-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000
OPENWEATHERMAP_API_KEY=your_dev_key
```

#### Production
```env
# .env.production
DEBUG=False
DATABASE_URL=postgresql://user:strong_pass@db.intellirelief.gov:5432/intellirelief
REDIS_URL=redis://redis.intellirelief.gov:6379/0
JWT_SECRET_KEY=<securely-generated-256-bit-key>
ALLOWED_ORIGINS=https://app.intellirelief.gov
OPENWEATHERMAP_API_KEY=<production_api_key>
LOG_LEVEL=INFO
```

---

## Failure Handling & Resilience

### Failure Categories & Strategies

#### 1. **External API Failures**

**Weather API Unavailable**:
- **Detection**: HTTP timeout (10s), connection errors
- **Fallback**: Return cached weather data with staleness indicator
- **User Impact**: Dashboard shows "Last updated 25 minutes ago"
- **Recovery**: Retry with exponential backoff (1s, 2s, 4s, 8s, max 32s)

**Seismic API Unavailable**:
- **Detection**: HTTP errors, malformed responses
- **Fallback**: Manual seismic data entry by operators
- **User Impact**: No automated earthquake alerts; operators notified to check external sources
- **Recovery**: Background job continues polling every 5 minutes

**Map Tile Service Unavailable**:
- **Detection**: Tile load failures
- **Fallback**: Switch to alternative tile provider (OpenStreetMap)
- **User Impact**: Map rendering may be slower; visual style changes
- **Recovery**: Automatic retry after 60 seconds

---

#### 2. **Database Failures**

**Primary Database Unreachable**:
- **Detection**: Connection timeout, query failures
- **Action**: 
  - Read queries → Failover to read replica
  - Write queries → Queue in Redis, return HTTP 503 with retry-after header
- **User Impact**: Read-only mode for dashboard; alert creation temporarily unavailable
- **Recovery**: Database administrator notification; automatic reconnection every 30s

**Read Replica Unavailable**:
- **Detection**: Connection errors
- **Fallback**: Route read queries to primary database
- **User Impact**: Minimal; slight performance degradation
- **Recovery**: Automatic reconnection

---

#### 3. **EventBus Failures**

**Redis Pub/Sub Down**:
- **Detection**: Connection errors, publish failures
- **Fallback**: In-memory event queue for current instance (events not distributed)
- **User Impact**: Real-time updates work within single backend instance only
- **Critical**: Core alert + assignment operations continue normally
- **Recovery**: Reconnection attempts every 5 seconds; administrator alert

---

#### 4. **Service-Level Failures**

**WeatherService Crash**:
- **Detection**: Health check endpoint failure
- **Impact**: No new weather updates; existing data remains available
- **User Impact**: Weather widget shows stale data
- **Recovery**: Container orchestrator (Kubernetes) restarts service automatically

**AlertService Crash**:
- **Detection**: Health check failure
- **Impact**: **CRITICAL** - core functionality unavailable
- **Mitigation**: Multiple backend instances ensure other instances handle requests
- **Recovery**: Immediate restart; alerts sent to on-call engineers

---

### Graceful Degradation Matrix

| Component | Failure Impact | Degradation Mode | Critical? |
|-----------|---------------|------------------|-----------|
| **Weather API** | No new weather data | Show cached data with age indicator | No |
| **Seismic API** | No auto-earthquake alerts | Manual data entry by operators | No |
| **Map Tiles** | Map rendering issues | Alternative tile provider | No |
| **EventBus (Redis)** | No cross-instance real-time updates | In-memory events per instance | No |
| **Primary Database** | No write operations | Read-only mode + queue writes | **Yes** |
| **Backend Instance** | Reduced capacity | Load balancer routes to healthy instances | No |
| **AlertService** | No alert management | Failover to other instances | **Yes** |
| **AssignmentService** | No responder assignment | Manual assignment in DB | **Yes** |

---

### Health Checks

#### Backend Health Endpoint

**GET /health**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-07T12:00:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "latency_ms": 15
    },
    "redis": {
      "status": "healthy",
      "latency_ms": 3
    },
    "event_bus": {
      "status": "healthy"
    },
    "weather_api": {
      "status": "degraded",
      "last_successful_call": "2026-02-07T11:45:00Z",
      "error": "Connection timeout"
    }
  }
}
```

**GET /ready**
- Returns 200 OK if service can handle requests
- Returns 503 Service Unavailable if critical dependencies are down

---

### Circuit Breaker Pattern

```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=60, expected_exception=RequestException)
async def fetch_weather_data(lat: float, lon: float) -> WeatherData:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(f"{WEATHER_API_URL}?lat={lat}&lon={lon}")
        response.raise_for_status()
        return WeatherData(**response.json())
```

**Behavior**:
- After 5 consecutive failures → Circuit opens (stop calling API)
- Wait 60 seconds → Attempt one test request
- If successful → Circuit closes (resume normal operation)
- If failed → Wait another 60 seconds

---

## Scalability Strategy

### Phase 1: Monolith with Modular Services (Current)
- Single FastAPI application with service modules
- PostgreSQL with read replica
- Redis for caching and sessions
- 3-5 backend instances behind load balancer

**Capacity**: 
- 10,000 concurrent users
- 500 alerts/hour
- 1,000 real-time dashboard connections

---

### Phase 2: EventBus Upgrade
- **Replace**: In-memory EventBus
- **With**: Redis Pub/Sub or RabbitMQ
- **Benefits**: 
  - Cross-instance event distribution
  - Event persistence and replay
  - Better observability

---

### Phase 3: Service Extraction (Microservices)
- **Extract**: Heavy services to separate deployments
  - WeatherService → Independent service
  - SeismicActivityService → Independent service
  - NotificationService → New microservice
- **Communication**: REST + EventBus
- **Benefits**: Independent scaling, language flexibility

---

### Phase 4: Analytics & AI Module
- **New Services**:
  - AnalyticsService → Historical data analysis
  - PredictiveService → Incident prediction using ML
  - OptimizationService → Responder assignment optimization
- **Data Pipeline**: 
  - EventBus → Kafka
  - Kafka → Data warehouse (BigQuery/Redshift)
  - ML models consume from data warehouse

---

### Horizontal Scaling Targets

| Component | Current | Phase 2 | Phase 3 |
|-----------|---------|---------|---------|
| **Backend Instances** | 3 | 5-10 | 20+ (auto-scaled) |
| **Database** | 1 primary + 1 replica | 1 primary + 3 replicas | Sharded by region |
| **Redis** | Single instance | Redis Cluster (3 nodes) | Redis Cluster (6+ nodes) |
| **Users** | 10,000 concurrent | 50,000 concurrent | 200,000+ concurrent |
| **Alerts/hour** | 500 | 2,000 | 10,000+ |

---

## Development Guidelines

### Code Organization

#### Backend Service Template

```
backend/services/alert/
├── __init__.py
├── models.py          # SQLAlchemy ORM models
├── schemas.py         # Pydantic request/response schemas
├── repository.py      # Database operations (Data Access Layer)
├── service.py         # Business logic
├── routes.py          # FastAPI endpoints
├── events.py          # Domain event definitions
└── tests/
    ├── test_service.py
    ├── test_repository.py
    └── test_routes.py
```

**Example: AlertService**

**models.py**:
```python
from sqlalchemy import Column, String, Float, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from uuid import uuid4

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    # ... other fields
```

**schemas.py**:
```python
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

class AlertCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    incident_type: IncidentType
    severity: Severity
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    # ... other fields

class AlertResponse(BaseModel):
    id: UUID
    title: str
    status: AlertStatus
    created_at: datetime
    # ... other fields
    
    class Config:
        from_attributes = True
```

**repository.py**:
```python
from typing import List, Optional
from sqlalchemy.orm import Session
from .models import Alert
from .schemas import AlertCreate

class AlertRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, alert: AlertCreate, created_by_id: UUID) -> Alert:
        db_alert = Alert(**alert.dict(), created_by_id=created_by_id)
        self.db.add(db_alert)
        self.db.commit()
        self.db.refresh(db_alert)
        return db_alert
    
    def get_by_id(self, alert_id: UUID) -> Optional[Alert]:
        return self.db.query(Alert).filter(Alert.id == alert_id).first()
    
    def list_alerts(self, filters: dict) -> List[Alert]:
        query = self.db.query(Alert)
        if filters.get("status"):
            query = query.filter(Alert.status == filters["status"])
        # ... apply other filters
        return query.all()
```

**service.py**:
```python
from typing import List
from uuid import UUID
from .repository import AlertRepository
from .schemas import AlertCreate, AlertResponse
from .events import AlertCreated
from app.core.event_bus import EventBus

class AlertService:
    def __init__(self, repository: AlertRepository, event_bus: EventBus):
        self.repository = repository
        self.event_bus = event_bus
    
    async def create_alert(self, data: AlertCreate, user_id: UUID) -> AlertResponse:
        # Business logic
        alert = self.repository.create(data, created_by_id=user_id)
        
        # Publish domain event
        event = AlertCreated(
            payload={
                "alert_id": str(alert.id),
                "severity": alert.severity.value,
                "latitude": alert.latitude,
                "longitude": alert.longitude
            }
        )
        await self.event_bus.publish(event)
        
        return AlertResponse.from_orm(alert)
```

**routes.py**:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.auth import get_current_user
from app.core.database import get_db
from .schemas import AlertCreate, AlertResponse
from .service import AlertService
from .repository import AlertRepository

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.post("/", response_model=AlertResponse, status_code=201)
async def create_alert(
    data: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repository = AlertRepository(db)
    service = AlertService(repository, event_bus)
    return await service.create_alert(data, current_user.id)
```

---

### Testing Strategy

#### Unit Tests
```python
# tests/test_service.py
import pytest
from uuid import uuid4
from unittest.mock import Mock, AsyncMock
from services.alert.service import AlertService
from services.alert.schemas import AlertCreate, Severity, IncidentType

@pytest.fixture
def mock_repository():
    return Mock()

@pytest.fixture
def mock_event_bus():
    bus = AsyncMock()
    return bus

@pytest.fixture
def alert_service(mock_repository, mock_event_bus):
    return AlertService(mock_repository, mock_event_bus)

@pytest.mark.asyncio
async def test_create_alert_publishes_event(alert_service, mock_event_bus):
    # Arrange
    data = AlertCreate(
        title="Test Alert",
        description="Test description",
        incident_type=IncidentType.FLOOD,
        severity=Severity.HIGH,
        latitude=28.6139,
        longitude=77.2090
    )
    user_id = uuid4()
    
    # Act
    await alert_service.create_alert(data, user_id)
    
    # Assert
    mock_event_bus.publish.assert_called_once()
    published_event = mock_event_bus.publish.call_args[0][0]
    assert published_event.event_type == "alert.created"
```

#### Integration Tests
```python
# tests/test_routes.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_alert_returns_201():
    # Arrange
    payload = {
        "title": "Integration Test Alert",
        "description": "Description with enough text",
        "incident_type": "flood",
        "severity": "high",
        "latitude": 28.6139,
        "longitude": 77.2090
    }
    headers = {"Authorization": f"Bearer {get_test_token()}"}
    
    # Act
    response = client.post("/api/alerts", json=payload, headers=headers)
    
    # Assert
    assert response.status_code == 201
    assert "id" in response.json()
```

---

### Git Workflow

#### Branch Strategy
- `main` → Production-ready code
- `develop` → Integration branch
- `feature/<ticket-number>-<description>` → Feature branches
- `hotfix/<description>` → Emergency fixes

#### Commit Convention
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example**:
```
feat(alerts): add severity change event

- Publish AlertSeverityChanged event when severity updated
- Subscribe to event in NotificationService
- Add integration test for event flow

Closes #123
```

---

### Code Review Checklist

- [ ] Code follows SOLID principles
- [ ] Business logic in service layer, not routes
- [ ] All database queries in repository layer
- [ ] Pydantic schemas for validation
- [ ] Domain events published for state changes
- [ ] Unit tests cover business logic
- [ ] Integration tests for API endpoints
- [ ] No secrets in code (use environment variables)
- [ ] Error handling with appropriate HTTP status codes
- [ ] Logging for important operations
- [ ] Documentation updated (if applicable)

---

## Appendix

### File Structure (Complete)

```
intellirelief/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── alerts/
│   │   │   ├── assignments/
│   │   │   ├── shelters/
│   │   │   ├── weather/
│   │   │   ├── map/
│   │   │   ├── users/
│   │   │   └── dashboard/
│   │   ├── services/
│   │   │   ├── apiClient.ts
│   │   │   ├── authService.ts
│   │   │   ├── alertApi.ts
│   │   │   ├── socketClient.ts
│   │   │   └── mapService.ts
│   │   ├── store/
│   │   │   ├── index.ts
│   │   │   ├── alertSlice.ts
│   │   │   ├── authSlice.ts
│   │   │   └── shelterSlice.ts
│   │   ├── routes/
│   │   │   ├── AppRoutes.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── types/
│   │   │   ├── alert.types.ts
│   │   │   ├── user.types.ts
│   │   │   └── common.types.ts
│   │   ├── utils/
│   │   │   ├── dateHelpers.ts
│   │   │   └── mapHelpers.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── auth.py
│   │   │   ├── event_bus.py
│   │   │   └── logging.py
│   │   ├── services/
│   │   │   ├── alert/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── models.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── service.py
│   │   │   │   ├── routes.py
│   │   │   │   ├── events.py
│   │   │   │   └── tests/
│   │   │   ├── assignment/
│   │   │   ├── shelter/
│   │   │   ├── volunteer/
│   │   │   ├── weather/
│   │   │   ├── seismic/
│   │   │   └── users/
│   │   ├── infrastructure/
│   │   │   ├── __init__.py
│   │   │   ├── cache.py
│   │   │   ├── external_clients.py
│   │   │   └── websocket.py
│   │   └── migrations/
│   │       └── versions/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── pytest.ini
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

### Glossary

| Term | Definition |
|------|------------|
| **Alert** | Emergency help request logged by operator |
| **Responder** | Authorized personnel (police, fire, ambulance) assigned to incidents |
| **Operator** | Trained personnel who log alerts into the system |
| **Shelter** | Predefined safe evacuation location |
| **EventBus** | Infrastructure component for asynchronous event distribution |
| **Domain Event** | Immutable record of something that happened in the system |
| **Repository** | Data access layer abstraction |
| **Service** | Business logic layer component |
| **JWT** | JSON Web Token for authentication |
| **ORM** | Object-Relational Mapping (SQLAlchemy) |
| **GIS** | Geographic Information System |

---

**Document Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | Initial Team | Initial design draft |
| 2.0 | Feb 2026 | Architecture Team | Complete redesign with concrete specifications |

---

**END OF DOCUMENT**
