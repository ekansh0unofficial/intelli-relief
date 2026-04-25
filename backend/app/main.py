import asyncio
import time
import uuid
from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.core.event_bus import event_bus
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging


# ======================================================
# Lifespan (startup / shutdown)
# ======================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────
    setup_logging()
    logger.info("Starting IntelliRelief API v{}", settings.APP_VERSION)
    logger.info("Environment: {}", settings.ENVIRONMENT)

    # Wire EventBus → Socket.io bridge
    from app.infrastructure.websocket import register_event_handlers
    register_event_handlers()

    # Wire EventBus → audit_log writer (auto-captures all domain events)
    from app.infrastructure.audit import register_audit_handlers
    register_audit_handlers()

    # Wire automation handlers + start stale-alert poller
    from app.infrastructure.automations import register_automations
    automation_task = register_automations()

    # Start USGS seismic poller as background task
    from app.infrastructure.seismic import start_seismic_poller
    seismic_task = asyncio.create_task(start_seismic_poller())

    # Log active EventBus subscriptions
    subs = event_bus.list_subscriptions()
    for event_type, handlers in subs.items():
        logger.info("EventBus | {} → {}", event_type, handlers)

    logger.info("IntelliRelief API is ready")
    yield

    # ── Shutdown ─────────────────────────────────────────
    seismic_task.cancel()
    automation_task.cancel()
    try:
        await asyncio.gather(seismic_task, automation_task, return_exceptions=True)
    except asyncio.CancelledError:
        pass

    from app.infrastructure.cache import cache
    await cache.close()

    logger.info("IntelliRelief API shut down cleanly")


# ======================================================
# App factory
# ======================================================
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description=(
            "Production-grade Disaster Management and Response Platform. "
            "Coordinates emergency operations between authorities, operators, "
            "responders, NGOs, and volunteers."
        ),
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    # ── Exception handlers ────────────────────────────────
    register_exception_handlers(app)

    # ── System endpoints ──────────────────────────────────
    @app.get("/health", tags=["System"])
    async def health_check():
        """Health check for Docker and load balancer."""
        return {
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    @app.get("/ready", tags=["System"])
    async def readiness_check():
        """Readiness probe — verifies DB connectivity."""
        from sqlalchemy import text
        from app.core.database import engine

        checks = {"database": False, "api": True}
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            checks["database"] = True
        except Exception as exc:
            logger.error("DB readiness check failed: {}", exc)

        return {"ready": all(checks.values()), "checks": checks}

    # ── Service routers ───────────────────────────────────
    from app.services.auth.routes import router as auth_router
    from app.services.alert.routes import router as alert_router
    from app.services.assignment.routes import router as assignment_router
    from app.services.shelter.routes import router as shelter_router
    from app.services.volunteer.routes import router as volunteer_router
    from app.services.users.routes import router as users_router
    from app.services.weather.routes import router as weather_router
    from app.services.dashboard.routes import router as dashboard_router
    from app.services.transcribe.routes import router as transcribe_router

    app.include_router(auth_router,        prefix="/api/auth",        tags=["Auth"])
    app.include_router(alert_router,       prefix="/api/alerts",      tags=["Alerts"])
    app.include_router(assignment_router,  prefix="/api/assignments",  tags=["Assignments"])
    app.include_router(shelter_router,     prefix="/api/shelters",     tags=["Shelters"])
    app.include_router(volunteer_router,   prefix="/api/volunteers",   tags=["Volunteers"])
    app.include_router(users_router,       prefix="/api/users",        tags=["Users"])
    app.include_router(weather_router,     prefix="/api/weather",      tags=["Weather"])
    app.include_router(dashboard_router,   prefix="/api/dashboard",    tags=["Dashboard"])
    app.include_router(transcribe_router,  prefix="/api/transcribe",   tags=["Transcribe"])

    return app


# ── Socket.io ASGI mount ──────────────────────────────────
from app.infrastructure.websocket import sio  # noqa: E402

_fastapi_app = create_app()

# Wrap the FastAPI app with Socket.io's ASGI adapter so both share one port.
# Frontend connects to /ws.
app = socketio.ASGIApp(sio, other_asgi_app=_fastapi_app, socketio_path="/ws")
