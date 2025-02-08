from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
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

# Add TrustedHostMiddleware to trust headers like X-Forwarded-Proto
# This must be added before other middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Add HTTPSRedirectMiddleware to force HTTPS in production
if os.environ.get("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# Define allowed origins
origins = [
    "https://www.get-toucan.com",
    "https://get-toucan.com",
    "https://backend.get-toucan.com",
    "https://api.get-toucan.com",
    "https://*.get-toucan.com",  # Allow all subdomains
    "https://toucan.up.railway.app",
    "http://localhost:5173",
    # Allow internal Railway DNS
    "http://toucan.railway.internal",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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