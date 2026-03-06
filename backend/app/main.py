from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import register_exception_handlers
from app.core.event_bus import event_bus

# ====================================
# Lifespan (startup/ shutdown)
#=====================================
@asynccontextmanager
async def lifespan(app : FastAPI):
    """
    Runs the startup logic before the app starts accepting requests
    Runs the shutdown logic when the app stops.
    """
    # Startup logic
    setup_logging()
    logger.info("Starting intelli-relief API v{}", settings.APP_VERSION)
    logger.info("Environment {}", settings.ENVIRONMENT)
    
    # Log registered event subscriptions
    subs = event_bus.list_subscriptions()
    if subs:
        for event_type, handlers in subs.items():
            logger.info("EventBus | {} -> {}" , event_type, handlers)
    else:
        logger.info("EventBus | No subscriptions registered yet")

    logger.info("IntelliRelief API is ready")
    yield
    logger.info("Shutting down IntelliRelief API")

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description=(
            "Production grade Disaster Management and Response Platform"
            "Coordinates emergency operations betweeen authorities , operators, responders , NGOs and Volunteers"
        ),
        docs_url = "/docs",
        redoc_url = "/redoc",
        openapi_url = "/openapi.json",
        lifespan = lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET" ,"POST" , "PUT" , "PATCH" , "DELETE" , "OPTIONS"],
        allow_headers=["Authorization" , "Content-Type"],
    )

    # Exception Handlers
    register_exception_handlers(app)


    @app.get("/health" , tags =["System"])
    async def health_check():
        """Health check endpoint for docker and load balancer"""
        return {
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT
        }

    @app.get("/ready" , tags=["System"])
    async def readiness_check():
        """
        Readiness check - verified DB and Redis are reachable.
        Used by kubernetes readiness probe
        """
        from app.core.database import engine
        from sqlalchemy import text

        checks = {"database" : False , "api" : True}
        try:
            async with engine.connect() as conn :
                await conn.execute(text("SELECT 1"))
            checks["database"] = True 
        except Exception as e :
            logger.error("Database readiness check failed : {}", e)

        all_ready = all(checks.values())           
        return {
            "ready" : all_ready,
            "checks": checks
        }

# =================================
#   Service Routers 
#   Import and register routers as services are built.
#   Each services adds one line here.
#   
#   from app.services.auth.routes import router as auth_router
#   app.include_router(auth_router , prefix="/api/auth" , tags=["Auth"])
# =================================

    from app.services.auth.routes import router as auth_router
    app.include_router(auth_router , prefix="/api/auth" , tags =["Auth"])
    return app

app = create_app()