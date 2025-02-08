from typing import Optional, Dict, Any
from pydantic import BaseModel
from models.database import Database

class Profile(BaseModel):
    id: str
    email: str
    pair_code: Optional[str] = None
    paired: bool = False
    points: int = 0
    created_at: str

class User:
    def __init__(self, id: str, profile: Profile):
        self.id = id
        self.profile = profile
        self._db = Database()
        self._partner: Optional[User] = None

    @classmethod
    async def get_by_id(cls, user_id: str) -> Optional['User']:
        """Get a user by their ID"""
        db = Database()
        profile_data = await db.fetch_one(
            "profiles",
            {"id": user_id}
        )
        
        if not profile_data:
            return None
            
        return cls(
            id=user_id,
            profile=Profile(**profile_data)
        )

    async def get_partner(self) -> Optional['User']:
        """Get the user's paired partner"""
        if self._partner:
            return self._partner
            
        # Check for approved pairing
        pairing = await self._db.fetch_one(
            "pairings",
            {"status": "approved"},
            extra_checks=lambda p: (
                p["user_id"] == self.id or 
                p["partner_id"] == self.id
            )
        )
        
        if not pairing:
            return None
            
        # Get partner's ID
        partner_id = (
            pairing["partner_id"] 
            if pairing["user_id"] == self.id 
            else pairing["user_id"]
        )
        
        # Get partner's profile
        self._partner = await User.get_by_id(partner_id)
        return self._partner

    def is_paired_with(self, other: 'User') -> bool:
        """Check if this user is paired with another user"""
        return (
            self.profile.paired and 
            other.profile.paired and 
            self._partner and 
            self._partner.id == other.id
        )

    async def add_points(self, points: int) -> bool:
        """Add points to the user's balance"""
        try:
            new_points = self.profile.points + points
            result = await self._db.update(
                "profiles",
                {"id": self.id},
                {"points": new_points}
            )
            
            if result:
                self.profile.points = new_points
                
            return result
        except Exception as e:
            print(f"Error adding points: {e}")
            return False 