from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.user import User
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()

# Get environment variables with error handling
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    error_msg = (
        "Missing required environment variables. "
        "Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    )
    logger.error(error_msg)
    raise RuntimeError(error_msg)

# Initialize Supabase client
try:
    logger.info(f"Initializing Supabase client with URL: {supabase_url}")
    supabase: Client = create_client(supabase_url, supabase_key)
    logger.info("Supabase client initialized successfully")
except Exception as e:
    error_msg = f"Failed to initialize Supabase client: {str(e)}"
    logger.error(error_msg, exc_info=True)
    raise RuntimeError(error_msg)

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get the current authenticated user"""
    try:
        logger.info("Attempting to authenticate user")
        # Get user data from token (this is a sync operation)
        user = supabase.auth.get_user(credentials.credentials)
        if not user or not user.user:
            logger.warning("Invalid authentication token - no user data found")
            raise HTTPException(401, "Invalid authentication token")
            
        logger.info(f"User authenticated with ID: {user.user.id}")
            
        # Get the user profile (this is async)
        current_user = await User.get_by_id(user.user.id)
        if not current_user:
            logger.warning(f"No profile found for authenticated user {user.user.id}")
            raise HTTPException(404, "User profile not found")
            
        logger.info(f"Successfully retrieved profile for user {user.user.id}")
        return current_user
    except Exception as e:
        error_msg = f"Auth error: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(401, "Invalid authentication token") 