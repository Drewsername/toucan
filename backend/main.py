# backend/main.py

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
import os
import datetime
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Set allowed origins to only the frontend domains.
origins = [
    "https://www.get-toucan.com",  # your Railway frontend custom domain
    "http://localhost:5173"        # local development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTPS enforcement middleware using x-forwarded-proto header.
@app.middleware("http")
async def https_redirect(request: Request, call_next):
    # In production, rely on the x-forwarded-proto header provided by Railway
    # (or your reverse proxy) instead of request.url.scheme.
    forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    if os.environ.get("ENVIRONMENT") == "production" and forwarded_proto != "https":
        url = str(request.url)
        https_url = url.replace("http://", "https://", 1)
        return RedirectResponse(https_url, status_code=301)
    return await call_next(request)

# Include your routers
from routers import auth, tasks
app.include_router(auth.router)
app.include_router(tasks.router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "environment": os.environ.get("ENVIRONMENT", "unknown"),
        "allowed_origins": origins
    }

@app.get("/")
async def root():
    return {"status": "online"}
