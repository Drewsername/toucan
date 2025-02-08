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

app = FastAPI()

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    logger.info(f"Request headers: {dict(request.headers)}")
    # Handle preflight requests
    if request.method == "OPTIONS":
        response = Response()
        response.headers["Access-Control-Allow-Origin"] = "https://www.get-toucan.com"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        logger.info(f"Response headers (OPTIONS): {dict(response.headers)}")
        return response

    # Handle actual requests
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "https://www.get-toucan.com"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    logger.info(f"Response headers: {dict(response.headers)}")
    return response

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