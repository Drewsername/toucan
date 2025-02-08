from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.user import User
from lib.supabase_client import get_client

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get the current authenticated user"""
    try:
        # Get user data from token (this is a sync operation)
        user = get_client().auth.get_user(credentials.credentials)
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