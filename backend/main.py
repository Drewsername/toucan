from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import auth, tasks
import os
import logging
import sys
from dotenv import load_dotenv

# Configure logging to output to stdout
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(
    title="Toucan API",
    description="Task management API for Toucan",
    version="0.1.0"
)

# Get environment variables with proper defaults for Railway
frontend_url = os.getenv("FRONTEND_URL", "https://www.get-toucan.com")
railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN", "toucan-backend-production.up.railway.app")
port = int(os.getenv("PORT", "8080"))  # Railway uses 8080 by default

# Log startup information
logger.info("Starting server with:")
logger.info(f"Frontend URL: {frontend_url}")
logger.info(f"Railway domain: {railway_domain}")
logger.info(f"Port: {port}")
logger.info(f"Project: {os.getenv('RAILWAY_PROJECT_NAME', 'local')}")
logger.info(f"Environment: {os.getenv('RAILWAY_ENVIRONMENT_NAME', 'development')}")

# Add middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response headers: {dict(response.headers)}")
        return response
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

# Configure CORS with production and development origins
origins = [
    "https://www.get-toucan.com",
    f"https://{railway_domain}",
    "https://toucan-backend-production.up.railway.app"
]

# Add development origins if not in production
if os.getenv("RAILWAY_ENVIRONMENT_NAME") != "production":
    origins.extend([
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ])

logger.info(f"Configuring CORS with origins: {origins}")

# Add CORS middleware first
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With"
    ],
    expose_headers=["*"],
    max_age=3600,
)

# Error handler for uncaught exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Uncaught exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Global OPTIONS handler
@app.options("/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    """Handle all OPTIONS requests"""
    logger.info(f"Handling OPTIONS request for path: {full_path}")
    logger.info(f"Request headers: {dict(request.headers)}")
    
    # Get the origin from the request
    origin = request.headers.get("origin")
    if origin not in origins:
        logger.warning(f"Received request from unauthorized origin: {origin}")
        return Response(status_code=403)
        
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Max-Age"] = "3600"
    
    logger.info(f"Sending OPTIONS response with headers: {dict(response.headers)}")
    return response

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
        "version": "0.1.0",
        "port": port,
        "domain": railway_domain,
        "project": os.getenv("RAILWAY_PROJECT_NAME", "local"),
        "environment": os.getenv("RAILWAY_ENVIRONMENT_NAME", "development")
    }