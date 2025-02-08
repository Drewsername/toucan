from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from routers import auth, tasks
import os
import logging
import sys
from dotenv import load_dotenv
import traceback
import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Create FastAPI app instance
app = FastAPI()

# Define allowed origins
origins = [
    "https://www.get-toucan.com",
    "https://get-toucan.com",
    "https://toucan.up.railway.app",
    "http://localhost:5173",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Force HTTPS in production
@app.middleware("http")
async def force_https(request: Request, call_next):
    if os.environ.get("ENVIRONMENT") == "production":
        # Force HTTPS for all production requests
        if request.url.scheme != "https":
            https_url = str(request.url).replace("http://", "https://", 1)
            return RedirectResponse(https_url, status_code=301)
        
        # Also check the X-Forwarded-Proto header (used by Railway)
        forwarded_proto = request.headers.get("x-forwarded-proto")
        if forwarded_proto and forwarded_proto != "https":
            https_url = f"https://{request.url.netloc}{request.url.path}"
            if request.url.query:
                https_url += f"?{request.url.query}"
            return RedirectResponse(https_url, status_code=301)
            
    response = await call_next(request)
    # Add HSTS header in production
    if os.environ.get("ENVIRONMENT") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Include routers
app.include_router(auth.router)
app.include_router(tasks.router)

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "environment": os.environ.get("ENVIRONMENT", "unknown"),
            "allowed_origins": origins
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.get("/")
async def root():
    return {"status": "online"}