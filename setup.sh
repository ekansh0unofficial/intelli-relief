#!/bin/bash

# IntelliRelief - Automated Setup Script
# This script creates the complete project structure and minimal boilerplate

set -e  # Exit on error

echo "=================================================="
echo "IntelliRelief - Automated Environment Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Check prerequisites
print_info "Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { print_error "Docker is not installed. Please install Docker first."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { print_error "Docker Compose is not installed. Please install Docker Compose first."; exit 1; }
command -v node >/dev/null 2>&1 || { print_error "Node.js is not installed. Please install Node.js 18+ first."; exit 1; }
command -v python3 >/dev/null 2>&1 || { print_error "Python 3 is not installed. Please install Python 3.11+ first."; exit 1; }

print_status "All prerequisites found!"
echo ""

# Create project root
PROJECT_ROOT="intellirelief"
print_info "Creating project structure in: $PROJECT_ROOT"

mkdir -p $PROJECT_ROOT
cd $PROJECT_ROOT

# Create directory structure
print_info "Creating directories..."

mkdir -p backend/app/core
mkdir -p backend/app/services/{alert,assignment,shelter,volunteer,weather,users}
mkdir -p backend/app/services/alert/tests
mkdir -p backend/app/infrastructure
mkdir -p backend/app/migrations/versions
mkdir -p backend/tests

mkdir -p frontend/src/modules/{auth,alerts,assignments,shelters,weather,map,users,dashboard,volunteers}
mkdir -p frontend/src/{services,store,routes,types,utils,components/common}
mkdir -p frontend/public

mkdir -p nginx
mkdir -p logs/{backend,nginx}
mkdir -p data/{postgres,redis}

print_status "Directory structure created!"

# Create Python __init__.py files
print_info "Creating Python package files..."

touch backend/app/__init__.py
touch backend/app/core/__init__.py
touch backend/app/infrastructure/__init__.py
touch backend/app/services/alert/__init__.py
touch backend/app/services/assignment/__init__.py
touch backend/app/services/shelter/__init__.py
touch backend/app/services/volunteer/__init__.py
touch backend/app/services/weather/__init__.py
touch backend/app/services/users/__init__.py

print_status "Python packages initialized!"

# Create backend/app/main.py
print_info "Creating backend main.py..."

cat > backend/app/main.py << 'EOF'
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
    allow_origins=["*"],
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
EOF

print_status "Backend main.py created!"

# Create frontend files
print_info "Creating frontend files..."

# index.html
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>IntelliRelief - Disaster Management Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# src/main.tsx
cat > frontend/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# src/App.tsx
cat > frontend/src/App.tsx << 'EOF'
import React from 'react'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚨 IntelliRelief</h1>
      <p>Disaster Management Platform</p>
      <p>Status: <span style={{ color: 'green', fontWeight: 'bold' }}>Environment Ready ✓</span></p>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>🎯 System Status:</h2>
        <ul style={{ lineHeight: '2' }}>
          <li>✅ Backend API running on <a href="http://localhost:8000/docs" target="_blank">http://localhost:8000/docs</a></li>
          <li>✅ Database initialized with sample data</li>
          <li>✅ Redis cache ready</li>
          <li>✅ Development environment configured</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h2>📋 Next Steps:</h2>
        <ol style={{ lineHeight: '2' }}>
          <li>Review Module Interface Specification</li>
          <li>Implement Core Infrastructure (EventBus, Auth)</li>
          <li>Build AlertModule (first complete module)</li>
          <li>Add tests and iterate</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
        <p><strong>Default Users:</strong></p>
        <ul>
          <li>Admin: username=<code>admin</code>, password=<code>admin123</code></li>
          <li>Operator: username=<code>operator1</code>, password=<code>admin123</code></li>
          <li>Responder: username=<code>responder1</code>, password=<code>admin123</code></li>
        </ul>
        <p style={{ color: 'red', fontSize: '12px' }}>⚠️ Change passwords in production!</p>
      </div>
    </div>
  )
}

export default App
EOF

# src/index.css
cat > frontend/src/index.css << 'EOF'
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
  background-color: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
}

a {
  color: #1976d2;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
EOF

# src/vite-env.d.ts
cat > frontend/src/vite-env.d.ts << 'EOF'
/// <reference types="vite/client" />
EOF

print_status "Frontend files created!"

# Create .gitignore
print_info "Creating .gitignore..."

cat > .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.production

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
dist/
build/

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Docker
data/

# Testing
.coverage
htmlcov/
.pytest_cache/

# Database
*.db
*.sqlite
EOF

print_status ".gitignore created!"

# Create README
print_info "Creating README.md..."

cat > README.md << 'EOF'
# IntelliRelief - Disaster Management Platform

Version 2.0 - Production-Grade Event-Driven Architecture

## Quick Start

```bash
# Copy environment file
cp .env.example .env

# Edit .env and update SECRET_KEY and API keys

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/docs
- **Nginx Proxy:** http://localhost

## Default Users

- Admin: `admin` / `admin123`
- Operator: `operator1` / `admin123`
- Responder: `responder1` / `admin123`

⚠️ **Change all passwords immediately in production!**

## Documentation

- See `SETUP_GUIDE.md` for detailed setup instructions
- See `MODULE_INTERFACE_SPECIFICATION.md` for API contracts
- See `IntelliRelief_System_Design_Document_v2.md` for architecture

## Tech Stack

- **Backend:** FastAPI (Python 3.11+)
- **Frontend:** React 18 + TypeScript + Vite
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Reverse Proxy:** Nginx

## Development

```bash
# Backend hot reload enabled - edit files in backend/app/
# Frontend hot reload enabled - edit files in frontend/src/

# Install new Python package
docker-compose exec backend pip install package-name

# Install new Node package
docker-compose exec frontend npm install package-name
```

## License

Proprietary - All Rights Reserved
EOF

print_status "README.md created!"

echo ""
echo "=================================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "📁 Project created in: $(pwd)"
echo ""
echo "📋 Next steps:"
echo "  1. cd $PROJECT_ROOT"
echo "  2. Copy configuration files (docker-compose.yml, .env, etc.)"
echo "  3. Edit .env file with your settings"
echo "  4. Run: docker-compose up --build -d"
echo "  5. Access frontend at: http://localhost:5173"
echo ""
echo "📖 See SETUP_GUIDE.md for detailed instructions"
echo ""
