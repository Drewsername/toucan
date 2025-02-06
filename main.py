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
railway_url = os.getenv("RAILWAY_STATIC_URL", "toucan.up.railway.app")
port = os.getenv("PORT", "8000")

# Log environment information
logger.info(f"Starting server with:")
logger.info(f"Frontend URL: {frontend_url}")
logger.info(f"Railway URL: {railway_url}")
logger.info(f"Port: {port}")
logger.info(f"Environment: {os.getenv('RAILWAY_ENVIRONMENT', 'development')}")

# Configure CORS
origins = [
    frontend_url,
    "http://localhost:5173",
    f"https://{railway_url}",
    "https://toucan.up.railway.app"
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
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "development")
    }

@app.get("/")
async def root():
    return {
        "status": "online",
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "development"),
        "service": "Toucan API",
        "port": port
    }