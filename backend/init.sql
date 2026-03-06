-- IntelliRelief Database Initialization Script
-- This script runs automatically when PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geographic data (if needed)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'responder', 'volunteer', 'ngo_official');
CREATE TYPE incident_type AS ENUM ('flood', 'fire', 'earthquake', 'accident', 'medical', 'rescue', 'landslide', 'cyclone', 'other');
CREATE TYPE severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status AS ENUM ('pending', 'in_progress', 'resolved', 'cancelled');
CREATE TYPE assignment_status AS ENUM ('pending', 'acknowledged', 'en_route', 'on_scene', 'completed', 'cancelled');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE shelter_type AS ENUM ('school', 'community_center', 'stadium', 'temporary', 'other');
CREATE TYPE shelter_status AS ENUM ('operational', 'full', 'closed', 'damaged');
CREATE TYPE volunteer_status AS ENUM ('active', 'inactive', 'pending_approval');

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================
-- ALERTS TABLE
-- ============================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    incident_type incident_type NOT NULL,
    severity severity NOT NULL,
    status alert_status NOT NULL DEFAULT 'pending',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    caller_name VARCHAR(100),
    caller_phone VARCHAR(20),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    CONSTRAINT valid_coordinates CHECK (
        latitude BETWEEN -90 AND 90 AND
        longitude BETWEEN -180 AND 180
    )
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_incident_type ON alerts(incident_type);
CREATE INDEX idx_alerts_created_by ON alerts(created_by);
CREATE INDEX idx_alerts_assigned_to ON alerts(assigned_to);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_location ON alerts(latitude, longitude);

-- ============================================
-- ALERT UPDATES TABLE
-- ============================================
CREATE TABLE alert_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    update_text TEXT NOT NULL,
    status_before alert_status,
    status_after alert_status,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alert_updates_alert_id ON alert_updates(alert_id);
CREATE INDEX idx_alert_updates_created_at ON alert_updates(created_at DESC);

-- ============================================
-- ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    priority priority NOT NULL,
    status assignment_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_arrival TIMESTAMP
);

CREATE INDEX idx_assignments_alert_id ON assignments(alert_id);
CREATE INDEX idx_assignments_responder_id ON assignments(responder_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_assigned_at ON assignments(assigned_at DESC);

-- ============================================
-- SHELTERS TABLE
-- ============================================
CREATE TABLE shelters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type shelter_type NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    total_capacity INTEGER NOT NULL CHECK (total_capacity > 0),
    current_occupancy INTEGER NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
    facilities TEXT[],
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    status shelter_status NOT NULL DEFAULT 'operational',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_shelter_coordinates CHECK (
        latitude BETWEEN -90 AND 90 AND
        longitude BETWEEN -180 AND 180
    ),
    CONSTRAINT valid_occupancy CHECK (current_occupancy <= total_capacity)
);

CREATE INDEX idx_shelters_status ON shelters(status);
CREATE INDEX idx_shelters_type ON shelters(type);
CREATE INDEX idx_shelters_location ON shelters(latitude, longitude);

-- ============================================
-- VOLUNTEERS TABLE
-- ============================================
CREATE TABLE volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skills TEXT[],
    availability BOOLEAN DEFAULT TRUE,
    status volunteer_status DEFAULT 'pending_approval',
    verified BOOLEAN DEFAULT FALSE,
    ngo_affiliation VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX idx_volunteers_status ON volunteers(status);
CREATE INDEX idx_volunteers_availability ON volunteers(availability);

-- ============================================
-- REFRESH TOKENS TABLE (for JWT)
-- ============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shelters_updated_at BEFORE UPDATE ON shelters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (Development Only)
-- ============================================

-- Create default admin user (password: admin123)
-- Password hash generated with bcrypt
INSERT INTO users (username, password_hash, full_name, email, phone, role)
VALUES 
    ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYWZ4XVRXpK', 'System Administrator', 'admin@intellirelief.com', '+919876543210', 'admin'),
    ('operator1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYWZ4XVRXpK', 'Operator One', 'operator1@intellirelief.com', '+919876543211', 'operator'),
    ('responder1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYWZ4XVRXpK', 'Responder One', 'responder1@intellirelief.com', '+919876543212', 'responder');

-- Sample shelter
INSERT INTO shelters (name, type, address, latitude, longitude, total_capacity, current_occupancy, facilities, contact_person, contact_phone, status, created_by)
SELECT 
    'Central Community Center', 
    'community_center', 
    '123 Main Street, Delhi', 
    28.6139, 
    77.2090, 
    500, 
    0, 
    ARRAY['water', 'electricity', 'medical', 'food', 'sanitation'],
    'John Doe',
    '+919876543220',
    'operational',
    id
FROM users WHERE username = 'admin' LIMIT 1;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO intelli_relief;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO intelli_relief;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'IntelliRelief database initialized successfully!';
    RAISE NOTICE 'Default admin user: username=admin, password=admin123';
    RAISE NOTICE 'IMPORTANT: Change the admin password immediately!';
END $$;