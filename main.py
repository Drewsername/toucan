from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth
import os
import logging
import sys
from dotenv import load_dotenv

# Configure logging to output to stdout
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# Get environment variables with detailed logging
try:
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"Using port: {port}")
except ValueError as e:
    logger.error(f"Error parsing PORT environment variable: {e}")
    port = 8000
    logger.info(f"Falling back to default port: {port}")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
railway_domain = os.getenv("RAILWAY_PRIVATE_DOMAIN", "toucan.up.railway.app")

# Log all environment variables for debugging
logger.info("Environment variables:")
for key, value in os.environ.items():
    if not any(secret in key.lower() for secret in ['key', 'password', 'secret', 'token']):
        logger.info(f"{key}: {value}")

# Configure CORS - include all possible domains
origins = [
    frontend_url,
    "http://localhost:5173",  # Local frontend
    "http://localhost:3000",  # Alternative local frontend
    f"https://{railway_domain}",  # Railway domain
    "https://toucan.up.railway.app",  # Railway static URL
    "https://toucan-production.up.railway.app",  # Alternative Railway URL
    "*"  # Temporarily allow all origins for debugging
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

# Log when the application starts
@app.on_event("startup")
async def startup_event():
    logger.info("Application startup complete")
    logger.info(f"Server running on port {port}")
    logger.info(f"Health check endpoint: /health")