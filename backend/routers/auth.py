from fastapi import APIRouter, Depends, HTTPException, Header
from supabase import create_client, Client
from typing import Optional
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import secrets
import string

# Load from .env file if it exists
load_dotenv()

router = APIRouter()

class PairRequest(BaseModel):
    partner_code: str

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

def generate_pairing_code(length: int = 8) -> str:
    """Generate a random pairing code of specified length"""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.split(" ")[1]
        user = supabase.auth.get_user(token)
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/auth/user")
async def get_user(user = Depends(get_current_user)):
    return user.dict()

@router.post("/auth/generate-pairing-code")
async def generate_code(user = Depends(get_current_user)):
    try:
        user_id = user.user.id
        code = generate_pairing_code()

        # First check if profile exists
        profile = supabase.table('profiles').select('*').eq('id', user_id).execute()

        if not profile.data or len(profile.data) == 0:
            # Create profile if it doesn't exist
            profile = supabase.table('profiles').insert({
                'id': user_id,
                'email': user.user.email,
                'pair_code': code,
                'paired': False,
                'points': 0
            }).execute()
        else:
            # Update existing profile
            profile = supabase.table('profiles').update({
                'pair_code': code,
                'paired': False
            }).eq('id', user_id).execute()

        if not profile.data:
            raise HTTPException(status_code=500, detail="Failed to update profile")

        return {"pair_code": code}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/pair")
async def pair_users(request: PairRequest, user = Depends(get_current_user)):
    try:
        user_id = user.user.id

        # Find partner by pairing code
        partner = supabase.table('profiles').select('*').eq('pair_code', request.partner_code).execute()
        
        if not partner.data or len(partner.data) == 0:
            raise HTTPException(status_code=404, detail="Invalid pairing code")

        partner_id = partner.data[0]['id']
        
        if user_id == partner_id:
            raise HTTPException(status_code=400, detail="Cannot pair with yourself")

        # Check if there's already a pending request
        existing_request = supabase.table('pairings') \
            .select('*') \
            .eq('user_id', user_id) \
            .eq('partner_id', partner_id) \
            .execute()

        if not existing_request.data:
            # Check the reverse relationship
            existing_request = supabase.table('pairings') \
                .select('*') \
                .eq('user_id', partner_id) \
                .eq('partner_id', user_id) \
                .execute()

        if existing_request.data and len(existing_request.data) > 0:
            raise HTTPException(status_code=400, detail="A pairing request already exists between these users")

        # Create a pending pairing request
        pairing_data = {
            'user_id': user_id,  # requester
            'partner_id': partner_id,  # target partner
            'status': 'pending'
        }
        
        # Create the pairing request
        supabase.table('pairings').insert(pairing_data).execute()

        return {
            "status": "pending",
            "message": "Pairing request sent. Waiting for partner to accept.",
            "partner_id": partner_id
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/accept-pair")
async def accept_pairing(user = Depends(get_current_user)):
    try:
        user_id = user.user.id

        # Find pending request where this user is the target
        pending = supabase.table('pairings').select('*').eq('partner_id', user_id).eq('status', 'pending').execute()

        if not pending.data or len(pending.data) == 0:
            raise HTTPException(status_code=404, detail="No pending pairing requests found")

        pairing = pending.data[0]
        requester_id = pairing['user_id']

        # Update the pairing status to approved
        supabase.table('pairings').update({
            'status': 'approved'
        }).eq('id', pairing['id']).execute()

        # Update both users' profiles
        supabase.table('profiles').update({'paired': True}).eq('id', user_id).execute()
        supabase.table('profiles').update({'paired': True}).eq('id', requester_id).execute()

        return {
            "status": "success",
            "message": "Pairing request accepted",
            "partner_id": requester_id
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/pending-pair")
async def get_pending_pair(user = Depends(get_current_user)):
    try:
        user_id = user.user.id

        # Check for pending requests where this user is the target
        pending = supabase.table('pairings').select('*,profiles!pairings_user_id_fkey(*)').eq('partner_id', user_id).eq('status', 'pending').execute()

        if not pending.data or len(pending.data) == 0:
            return {"has_pending": False}

        requester = pending.data[0]['profiles']
        return {
            "has_pending": True,
            "requester": {
                "id": requester['id'],
                "email": requester['email']
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 