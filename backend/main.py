from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, tasks
import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# Get environment variables
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
railway_domain = os.getenv("RAILWAY_PRIVATE_DOMAIN", "toucan-backend-production.up.railway.app")
production_domain = os.getenv("PRODUCTION_DOMAIN", "get-toucan.com")
port = int(os.getenv("PORT", "8000"))  # Convert to int for uvicorn

# Log environment information
logger.info("Starting server with:")
logger.info(f"Frontend URL: {frontend_url}")
logger.info(f"Railway domain: {railway_domain}")
logger.info(f"Production domain: {production_domain}")
logger.info(f"Port: {port}")
logger.info(f"Project: {os.getenv('RAILWAY_PROJECT_NAME', 'local')}")
logger.info(f"Environment: {os.getenv('RAILWAY_ENVIRONMENT_NAME', 'development')}")

# Configure CORS with explicit origins
allowed_origins = [
    frontend_url,  # Development frontend
    "https://toucan-backend-production.up.railway.app",  # Explicit Railway domain
    "https://www.get-toucan.com",  # Production www
    "https://get-toucan.com",  # Production apex
    "https://healthcheck.railway.app",  # Railway healthcheck
]

# Add localhost for development
if os.getenv("RAILWAY_ENVIRONMENT_NAME") != "production":
    allowed_origins.extend([
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ])

# Log allowed origins for debugging
logger.info("Allowed CORS origins:")
for origin in allowed_origins:
    logger.info(f"  - {origin}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Added to expose all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(auth.router)
app.include_router(tasks.router)

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    return {
        "status": "healthy",
        "port": port,
        "domain": railway_domain,
        "project": os.getenv("RAILWAY_PROJECT_NAME", "local"),
        "environment": os.getenv("RAILWAY_ENVIRONMENT_NAME", "development")
    }

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Toucan API",
        "port": port,
        "domain": railway_domain,
        "project": os.getenv("RAILWAY_PROJECT_NAME", "local"),
        "environment": os.getenv("RAILWAY_ENVIRONMENT_NAME", "development")
    }