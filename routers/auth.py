from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

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