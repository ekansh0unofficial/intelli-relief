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
