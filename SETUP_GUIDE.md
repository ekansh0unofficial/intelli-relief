# IntelliRelief - Complete Environment Setup Guide

**Version:** 1.0  
**Estimated Time:** 30-45 minutes  
**Date:** February 13, 2026

---

## 📋 Prerequisites Check

Before starting, verify you have these installed:

```bash
# Check Docker
docker --version
# Expected: Docker version 20.10 or higher

# Check Docker Compose
docker-compose --version
# Expected: Docker Compose version 2.0 or higher

# Check Node.js
node --version
# Expected: v18.0.0 or higher

# Check Python
python --version
# Expected: Python 3.11 or higher

# Check Git
git --version
```

---

## 🚀 Step-by-Step Setup

### Step 1: Create Project Structure

```bash
# Create main project directory
mkdir intellirelief
cd intellirelief

# Create subdirectories
mkdir -p backend/app
mkdir -p frontend
mkdir -p nginx
mkdir -p logs/backend logs/nginx
mkdir -p data/postgres data/redis
```

### Step 2: Copy Configuration Files

Copy all the provided files into the correct locations:

```
intellirelief/
├── docker-compose.yml           # Root directory
├── .env.example                 # Root directory
├── backend/
│   ├── Dockerfile               # Copy backend-Dockerfile here as "Dockerfile"
│   ├── requirements.txt         # Backend dependencies
│   └── init.sql                 # Database initialization
├── frontend/
│   ├── Dockerfile               # Copy frontend-Dockerfile here as "Dockerfile"
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.ts           # Vite configuration
│   └── tsconfig.json            # TypeScript configuration
└── nginx/
    └── nginx.conf               # Nginx reverse proxy config
```

**File placement commands:**

```bash
# From the directory where you have the generated files:

# Root files
cp docker-compose.yml intellirelief/
cp .env.example intellirelief/

# Backend files
cp backend-Dockerfile intellirelief/backend/Dockerfile
cp requirements.txt intellirelief/backend/
cp init.sql intellirelief/backend/

# Frontend files
cp frontend-Dockerfile intellirelief/frontend/Dockerfile
cp package.json intellirelief/frontend/
cp vite.config.ts intellirelief/frontend/
cp tsconfig.json intellirelief/frontend/

# Nginx files
cp nginx.conf intellirelief/nginx/
```

### Step 3: Create Environment File

```bash
cd intellirelief
cp .env.example .env
```

**Edit `.env` file and update these important values:**

```bash
# Mandatory: Change the secret key
SECRET_KEY=$(openssl rand -hex 32)

# Optional but recommended: Add your API keys
OPENWEATHER_API_KEY=your_actual_api_key_here
VITE_MAPBOX_TOKEN=your_mapbox_token_here

# Email configuration (if you want notifications)
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Step 4: Create Minimal Backend Files

We need a minimal `main.py` to start the backend:

```bash
mkdir -p backend/app/core
```

Create `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="IntelliRelief API",
    description="Disaster Management and Response Platform",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "IntelliRelief API",
        "version": "2.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "IntelliRelief API",
        "docs": "/docs",
        "health": "/health"
    }
```

Create `backend/app/__init__.py`:

```python
# Empty file to make app a package
```

Create `backend/app/core/__init__.py`:

```python
# Empty file to make core a package
```

### Step 5: Create Minimal Frontend Files

Create `frontend/src/main.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

Create `frontend/src/App.tsx`:

```typescript
import React from 'react'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>IntelliRelief</h1>
      <p>Disaster Management Platform</p>
      <p>Status: <span style={{ color: 'green' }}>Environment Ready ✓</span></p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Next Steps:</h2>
        <ul>
          <li>Backend API is running on <a href="http://localhost:8000/docs">http://localhost:8000/docs</a></li>
          <li>Database is initialized with sample data</li>
          <li>Redis cache is ready</li>
          <li>Ready to implement modules!</li>
        </ul>
      </div>
    </div>
  )
}

export default App
```

Create `frontend/src/index.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```

Create `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>IntelliRelief - Disaster Management Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `frontend/src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />
```

### Step 6: Build and Start the Environment

```bash
# Make sure you're in the intellirelief directory
cd intellirelief

# Build and start all services
docker-compose up --build -d

# This will:
# 1. Build the backend Docker image
# 2. Build the frontend Docker image
# 3. Start PostgreSQL database
# 4. Start Redis cache
# 5. Run database initialization
# 6. Start the backend API
# 7. Start the frontend dev server
# 8. Start Nginx reverse proxy
```

**Watch the logs:**

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Step 7: Verify Everything Works

**Check service status:**

```bash
docker-compose ps
```

You should see all services "Up":

```
NAME                        STATUS
intellirelief-backend       Up (healthy)
intellirelief-frontend      Up
intellirelief-postgres      Up (healthy)
intellirelief-redis         Up (healthy)
intellirelief-nginx         Up
```

**Test the endpoints:**

```bash
# Test backend health
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","service":"IntelliRelief API","version":"2.0.0"}

# Test frontend
curl http://localhost:5173

# Test through Nginx
curl http://localhost/api/health
```

**Access the applications:**

- **Frontend:** http://localhost:5173
- **Backend API Docs:** http://localhost:8000/docs
- **Through Nginx:** http://localhost

### Step 8: Verify Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U intellirelief -d intellirelief_db

# Inside psql, run:
\dt                          # List all tables
SELECT * FROM users;         # View seed users
\q                           # Exit
```

You should see 3 default users:
- `admin` (password: `admin123`)
- `operator1` (password: `admin123`)
- `responder1` (password: `admin123`)

---

## 🎯 Common Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend
docker-compose restart frontend

# Rebuild and restart
docker-compose up --build -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Database Management

```bash
# Connect to database
docker-compose exec postgres psql -U intellirelief -d intellirelief_db

# Backup database
docker-compose exec postgres pg_dump -U intellirelief intellirelief_db > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U intellirelief -d intellirelief_db

# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d
```

### Redis Management

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Inside redis-cli:
PING                 # Should return PONG
KEYS *              # List all keys
FLUSHALL            # Clear all data (use carefully!)
exit                # Exit
```

### Development Workflow

```bash
# Backend changes (hot reload enabled)
# Just edit files in backend/app/ - changes reflect automatically

# Frontend changes (hot reload enabled)
# Just edit files in frontend/src/ - changes reflect automatically

# Install new Python package
docker-compose exec backend pip install package-name
# Then add to requirements.txt

# Install new Node package
docker-compose exec frontend npm install package-name
# Then add to package.json
```

---

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :5432   # PostgreSQL
sudo lsof -i :6379   # Redis
sudo lsof -i :8000   # Backend
sudo lsof -i :5173   # Frontend
sudo lsof -i :80     # Nginx

# Kill the process or change ports in docker-compose.yml
```

### Container Won't Start

```bash
# View detailed logs
docker-compose logs backend

# Check container status
docker-compose ps

# Remove and recreate
docker-compose down
docker-compose up --build
```

### Database Connection Issues

```bash
# Check if PostgreSQL is ready
docker-compose exec postgres pg_isready

# Check database logs
docker-compose logs postgres

# Verify credentials in .env file
```

### Frontend Build Errors

```bash
# Clear node_modules and reinstall
docker-compose exec frontend rm -rf node_modules
docker-compose exec frontend npm install

# Or rebuild the container
docker-compose up --build frontend
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] All 5 containers are running (`docker-compose ps`)
- [ ] Backend API responds at http://localhost:8000/health
- [ ] Frontend loads at http://localhost:5173
- [ ] Database has 11 tables (`\dt` in psql)
- [ ] 3 default users exist in database
- [ ] 1 sample shelter exists in database
- [ ] Redis is accessible (`docker-compose exec redis redis-cli ping`)
- [ ] API documentation accessible at http://localhost:8000/docs
- [ ] Nginx reverse proxy works at http://localhost

---

## 🎓 Next Steps

Now that your environment is set up, you're ready to:

1. **Review the Module Interface Specification** - understand the contracts
2. **Implement Core Infrastructure** - EventBus, Auth, Database connections
3. **Build First Module** - Start with AlertModule (backend + frontend)
4. **Add Tests** - Unit and integration tests
5. **Iterate** - Build remaining modules following the same pattern

---

## 📚 Useful Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **React Docs:** https://react.dev/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Docker Docs:** https://docs.docker.com/
- **Vite Docs:** https://vitejs.dev/

---

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify all files are in correct locations
3. Ensure `.env` file exists and is configured
4. Check that all required ports are available
5. Try rebuilding: `docker-compose down && docker-compose up --build`

---

**Environment Setup Complete! 🎉**

You now have a fully functional development environment ready for module implementation.
