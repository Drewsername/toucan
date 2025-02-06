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

# Get frontend URL from environment variable, default to local development URL
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
railway_url = os.getenv("RAILWAY_PUBLIC_DOMAIN")

# Log environment information
logger.info(f"Starting server with:")
logger.info(f"Frontend URL: {frontend_url}")
logger.info(f"Railway URL: {railway_url}")
logger.info(f"Environment: {os.getenv('RAILWAY_ENVIRONMENT', 'development')}")

# Configure CORS
origins = [
    frontend_url,  # Local development frontend
    "https://toucan.up.railway.app",  # Railway deployment URL
]

# Add Railway domain if available
if railway_url:
    origins.append(f"https://{railway_url}")

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
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {
        "status": "online",
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "development"),
        "service": "Toucan API"
    }