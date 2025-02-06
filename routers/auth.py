from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client
from typing import Optional
import os
from dotenv import load_dotenv

# Load from .env file if it exists
load_dotenv()

router = APIRouter()

# Get environment variables with error handling
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    raise RuntimeError(
        "Missing required environment variables. "
        "Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    )

# Initialize Supabase client
try:
    supabase: Client = create_client(supabase_url, supabase_key)
except Exception as e:
    raise RuntimeError(f"Failed to initialize Supabase client: {str(e)}")

@router.get("/auth/user")
async def get_user(access_token: Optional[str] = None):
    if not access_token:
        raise HTTPException(status_code=401, detail="No access token provided")
    
    try:
        # Verify the JWT token with Supabase
        user = supabase.auth.get_user(access_token)
        return user.dict()
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e)) 