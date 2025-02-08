from fastapi import FastAPI, Request
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

# Add middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {request.headers}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# Configure CORS with debug logging
origins = [
    "https://www.get-toucan.com",
    "https://get-toucan.com",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
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