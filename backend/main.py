from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import auth, tasks
import os
import logging
import sys
from dotenv import load_dotenv
from typing import List

# Configure logging to output to stdout with more detailed format
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG level
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(pathname)s:%(lineno)d',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

load_dotenv()

def get_allowed_origins() -> List[str]:
    """Get the list of allowed origins from environment or use defaults"""
    try:
        # Try to get from environment variable first
        origins_str = os.getenv("ALLOWED_ORIGINS")
        if origins_str:
            origins = origins_str.split(",")
            logger.debug(f"Loaded origins from environment: {origins}")
            return [origin.strip() for origin in origins]
        
        # Fall back to defaults
        defaults = [
            "https://www.get-toucan.com",
            "https://get-toucan.com",
            "https://toucan.up.railway.app",
            "http://localhost:5173"
        ]
        logger.debug(f"Using default origins: {defaults}")
        return defaults
    except Exception as e:
        logger.error(f"Error setting up origins: {e}")
        return ["https://www.get-toucan.com"]  # Fallback to main production URL

app = FastAPI()

# Debug log before CORS setup
logger.debug("Setting up CORS middleware...")

# Add CORS middleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# Debug log after CORS setup
logger.debug("CORS middleware setup complete")

# Include routers
app.include_router(auth.router)
app.include_router(tasks.router)

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"status": "online"}