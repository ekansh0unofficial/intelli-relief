# IntelliRelief - Environment Setup Files Reference

**Generated:** February 13, 2026  
**Total Files:** 12 configuration files + 1 automated script

---

## 📦 File Inventory

### 1. **docker-compose.yml** ⭐ MAIN
**Location:** Project root  
**Purpose:** Orchestrates all services (PostgreSQL, Redis, Backend, Frontend, Nginx)  
**Contains:**
- 5 service definitions
- Volume mappings
- Network configuration
- Health checks
- Environment variable bindings

**Key Services:**
- `postgres` - PostgreSQL 15 database (port 5432)
- `redis` - Redis 7 cache (port 6379)
- `backend` - FastAPI application (port 8000)
- `frontend` - React + Vite dev server (port 5173)
- `nginx` - Reverse proxy (port 80)

---

### 2. **.env.example** ⭐ CRITICAL
**Location:** Project root (copy to `.env`)  
**Purpose:** Environment variables template  
**Contains:**
- Database credentials
- Secret keys for JWT
- API keys (OpenWeatherMap, Mapbox)
- Email/SMS configuration
- CORS settings
- Development flags

**⚠️ ACTION REQUIRED:**
```bash
cp .env.example .env
# Then edit .env and set:
# - SECRET_KEY (generate new one)
# - OPENWEATHER_API_KEY
# - Email credentials (if needed)
```

---

### 3. **backend-Dockerfile**
**Location:** `backend/Dockerfile` (rename when copying)  
**Purpose:** Docker image for FastAPI backend  
**Contains:**
- Python 3.11-slim base image
- System dependencies (gcc, postgresql-client)
- Python package installation
- Health check endpoint
- Uvicorn server configuration

**Base Image:** `python:3.11-slim`  
**Exposed Port:** 8000  
**Health Check:** `curl http://localhost:8000/health`

---

### 4. **frontend-Dockerfile**
**Location:** `frontend/Dockerfile` (rename when copying)  
**Purpose:** Multi-stage Docker image for React frontend  
**Contains:**
- Development stage (Node 18, hot reload)
- Build stage (production build)
- Production stage (Nginx serving)

**Base Image:** `node:18-alpine`  
**Exposed Ports:** 
- Development: 5173
- Production: 80  
**Build Output:** `/app/dist`

---

### 5. **requirements.txt**
**Location:** `backend/requirements.txt`  
**Purpose:** Python dependencies for backend  
**Contains:** 40+ packages including:
- FastAPI 0.110.0
- SQLAlchemy 2.0.27
- Pydantic 2.6.1
- PostgreSQL drivers
- Redis client
- JWT authentication
- Testing tools
- Development tools

**Install:** Auto-installed during Docker build

---

### 6. **package.json**
**Location:** `frontend/package.json`  
**Purpose:** Node.js dependencies and scripts for frontend  
**Contains:**
- React 18.2.0
- TypeScript 5.3.3
- Redux Toolkit 2.1.0
- Material-UI 5.15.9
- Leaflet for maps
- Axios for HTTP
- Testing libraries

**Scripts:**
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run test` - Run tests

---

### 7. **init.sql** ⭐ DATABASE
**Location:** `backend/init.sql`  
**Purpose:** Database initialization and schema creation  
**Contains:**
- 9 enum types
- 7 main tables (users, alerts, assignments, shelters, volunteers, etc.)
- Indexes for performance
- Constraints and checks
- Triggers for timestamps
- Seed data (3 default users, 1 shelter)

**Tables Created:**
1. `users` - System users
2. `alerts` - Emergency alerts
3. `alert_updates` - Alert timeline
4. `assignments` - Responder assignments
5. `shelters` - Evacuation centers
6. `volunteers` - Volunteer data
7. `refresh_tokens` - JWT refresh tokens
8. `audit_log` - System audit trail

**Default Users:**
- `admin` / `admin123`
- `operator1` / `admin123`
- `responder1` / `admin123`

---

### 8. **nginx.conf**
**Location:** `nginx/nginx.conf`  
**Purpose:** Nginx reverse proxy configuration  
**Contains:**
- Backend API proxy (`/api/*`)
- WebSocket proxy (`/ws/*`)
- Frontend proxy (`/*`)
- Rate limiting rules
- CORS headers
- Security headers
- Gzip compression

**Rate Limits:**
- API endpoints: 60 requests/minute
- Auth endpoints: 5 requests/minute

---

### 9. **vite.config.ts**
**Location:** `frontend/vite.config.ts`  
**Purpose:** Vite build tool configuration  
**Contains:**
- React plugin setup
- Path aliases (@, @modules, @services, etc.)
- Dev server configuration (HMR, proxy)
- Build optimization
- Code splitting rules

**Dev Server:** Port 5173, hot reload enabled  
**Proxy:** `/api` → `http://backend:8000`

---

### 10. **tsconfig.json**
**Location:** `frontend/tsconfig.json`  
**Purpose:** TypeScript compiler configuration  
**Contains:**
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Path aliases configuration
- React JSX settings

**Path Aliases:**
- `@/*` → `./src/*`
- `@modules/*` → `./src/modules/*`
- `@services/*` → `./src/services/*`

---

### 11. **SETUP_GUIDE.md** ⭐ INSTRUCTIONS
**Location:** Project root  
**Purpose:** Complete step-by-step setup instructions  
**Contains:**
- Prerequisites checklist
- 8-step setup process
- File placement guide
- Minimal boilerplate code
- Common commands reference
- Troubleshooting section
- Verification checklist

**Estimated Time:** 30-45 minutes

---

### 12. **setup.sh** 🤖 AUTOMATION
**Location:** Project root  
**Purpose:** Automated project structure creation  
**Contains:**
- Directory creation script
- Prerequisite checks
- Boilerplate file generation
- Python package initialization
- Basic frontend/backend files

**Usage:**
```bash
chmod +x setup.sh
./setup.sh
```

**What it creates:**
- Complete directory structure
- All Python `__init__.py` files
- Minimal `backend/app/main.py`
- Minimal frontend files (App.tsx, main.tsx, index.html)
- .gitignore
- README.md

---

## 🎯 Setup Workflow

### Option A: Automated (Recommended)
```bash
# 1. Run the setup script
./setup.sh

# 2. Copy configuration files into intellirelief/
cp docker-compose.yml intellirelief/
cp .env.example intellirelief/
cp backend-Dockerfile intellirelief/backend/Dockerfile
cp frontend-Dockerfile intellirelief/frontend/Dockerfile
cp requirements.txt intellirelief/backend/
cp package.json intellirelief/frontend/
cp init.sql intellirelief/backend/
cp nginx.conf intellirelief/nginx/
cp vite.config.ts intellirelief/frontend/
cp tsconfig.json intellirelief/frontend/

# 3. Configure environment
cd intellirelief
cp .env.example .env
# Edit .env with your settings

# 4. Start services
docker-compose up --build -d

# 5. Verify
docker-compose ps
curl http://localhost:8000/health
```

### Option B: Manual
Follow the detailed instructions in **SETUP_GUIDE.md**

---

## 📁 Final Directory Structure

```
intellirelief/
├── docker-compose.yml          # ← Main orchestration file
├── .env                        # ← Your environment variables (copy from .env.example)
├── .env.example                # ← Template
├── .gitignore                  # ← Generated by setup.sh
├── README.md                   # ← Generated by setup.sh
├── SETUP_GUIDE.md              # ← Detailed instructions
├── setup.sh                    # ← Automation script
│
├── backend/
│   ├── Dockerfile              # ← Copy from backend-Dockerfile
│   ├── requirements.txt        # ← Python dependencies
│   ├── init.sql                # ← Database schema
│   └── app/
│       ├── __init__.py         # ← Generated by setup.sh
│       ├── main.py             # ← Generated by setup.sh
│       └── core/
│           └── __init__.py     # ← Generated by setup.sh
│
├── frontend/
│   ├── Dockerfile              # ← Copy from frontend-Dockerfile
│   ├── package.json            # ← Node dependencies
│   ├── vite.config.ts          # ← Vite configuration
│   ├── tsconfig.json           # ← TypeScript configuration
│   ├── index.html              # ← Generated by setup.sh
│   └── src/
│       ├── main.tsx            # ← Generated by setup.sh
│       ├── App.tsx             # ← Generated by setup.sh
│       ├── index.css           # ← Generated by setup.sh
│       └── vite-env.d.ts       # ← Generated by setup.sh
│
├── nginx/
│   └── nginx.conf              # ← Nginx configuration
│
├── logs/                       # ← Auto-created by Docker
│   ├── backend/
│   └── nginx/
│
└── data/                       # ← Auto-created by Docker
    ├── postgres/
    └── redis/
```

---

## ✅ Verification Steps

After setup completes, verify:

1. **Services Running:**
   ```bash
   docker-compose ps
   # All 5 services should show "Up"
   ```

2. **Backend Health:**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"healthy","service":"IntelliRelief API","version":"2.0.0"}
   ```

3. **Frontend Loading:**
   - Open http://localhost:5173
   - Should show IntelliRelief welcome page

4. **Database Tables:**
   ```bash
   docker-compose exec postgres psql -U intellirelief -d intellirelief_db -c "\dt"
   # Should list 8 tables
   ```

5. **Default Users:**
   ```bash
   docker-compose exec postgres psql -U intellirelief -d intellirelief_db -c "SELECT username, role FROM users;"
   # Should show: admin, operator1, responder1
   ```

6. **API Documentation:**
   - Open http://localhost:8000/docs
   - Should show FastAPI Swagger UI

7. **Redis Connection:**
   ```bash
   docker-compose exec redis redis-cli ping
   # Should return: PONG
   ```

---

## 🚨 Critical Configuration

### Must Change Before Production:

1. **Secret Key:**
   ```bash
   # Generate new secret key
   openssl rand -hex 32
   # Add to .env as SECRET_KEY
   ```

2. **Database Password:**
   ```bash
   # Change in .env:
   POSTGRES_PASSWORD=your_secure_password_here
   ```

3. **Default User Passwords:**
   - Change all default passwords (`admin123`)
   - Update in database after first login

4. **CORS Origins:**
   ```bash
   # In .env, set to your actual domains:
   CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
   ```

5. **Environment Flag:**
   ```bash
   # Change in .env for production:
   ENVIRONMENT=production
   DEBUG=false
   ```

---

## 📞 Support & Resources

- **Full Setup Guide:** `SETUP_GUIDE.md`
- **API Contracts:** `MODULE_INTERFACE_SPECIFICATION.md`
- **Architecture:** `IntelliRelief_System_Design_Document_v2.md`

---

## 🎉 Ready to Code!

Once all verification steps pass, you have:
- ✅ Working PostgreSQL database with schema
- ✅ Redis cache running
- ✅ FastAPI backend with health endpoint
- ✅ React frontend with hot reload
- ✅ Nginx reverse proxy
- ✅ All dependencies installed
- ✅ Default users created
- ✅ Development environment ready

**Next:** Implement Core Infrastructure (EventBus, Auth, Database connections)
