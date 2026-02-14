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
