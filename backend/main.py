from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import auth, tasks
import os
import logging
import sys
from dotenv import load_dotenv

# Configure logging to output to stdout with more detailed format
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(pathname)s:%(lineno)d',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# Debug log before CORS setup
logger.debug("Setting up CORS middleware...")

# Hardcode allowed origins as a single string and split it
ALLOWED_ORIGINS_STR = "https://www.get-toucan.com https://get-toucan.com https://toucan.up.railway.app http://localhost:5173"
allowed_origins = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split()]
logger.debug(f"Configured allowed origins: {allowed_origins}")

# Add CORS middleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Added to expose all headers
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