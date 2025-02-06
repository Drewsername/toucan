from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth
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
railway_domain = os.getenv("RAILWAY_PRIVATE_DOMAIN", "toucan.up.railway.app")
port = int(os.getenv("PORT", "8000"))  # Convert to int for uvicorn

# Log environment information
logger.info("Starting server with:")
logger.info(f"Frontend URL: {frontend_url}")
logger.info(f"Railway domain: {railway_domain}")
logger.info(f"Port: {port}")
logger.info(f"Project: {os.getenv('RAILWAY_PROJECT_NAME', 'local')}")
logger.info(f"Environment: {os.getenv('RAILWAY_ENVIRONMENT_NAME', 'development')}")

# Configure CORS - include all possible domains
origins = [
    frontend_url,
    "http://localhost:5173",  # Local frontend
    "http://localhost:3000",  # Alternative local frontend
    f"https://{railway_domain}",  # Railway domain
    "https://toucan.up.railway.app",  # Railway static URL
    "https://toucan-production.up.railway.app"  # Alternative Railway URL
]

logger.info(f"Configured CORS origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)

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