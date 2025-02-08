from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.user import User
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

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

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get the current authenticated user"""
    try:
        # Get user data from token (this is a sync operation)
        user = supabase.auth.get_user(credentials.credentials)
        if not user or not user.user:
            raise HTTPException(401, "Invalid authentication token")
            
        # Get the user profile (this is async)
        current_user = await User.get_by_id(user.user.id)
        if not current_user:
            raise HTTPException(404, "User profile not found")
            
        return current_user
    except Exception as e:
        print(f"Auth error: {str(e)}")
        raise HTTPException(401, "Invalid authentication token") 