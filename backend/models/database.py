from typing import Optional, List, Dict, Any, Callable
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

class Database:
    _instance: Optional['Database'] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance

    @property
    def client(self):
        return supabase

    async def fetch_one(
        self, 
        table: str, 
        filters: Dict[str, Any],
        extra_checks: Optional[Callable[[Dict[str, Any]], bool]] = None
    ) -> Optional[Dict[str, Any]]:
        """Fetch a single record from the database"""
        try:
            query = self.client.table(table).select("*")
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.execute()
            
            if not result.data:
                return None
                
            # Apply extra validation if provided
            if extra_checks and not extra_checks(result.data[0]):
                return None
                
            return result.data[0]
        except Exception as e:
            print(f"Error fetching from {table}: {e}")
            return None

    async def fetch_many(
        self, 
        table: str, 
        filters: Dict[str, Any],
        extra_checks: Optional[Callable[[Dict[str, Any]], bool]] = None
    ) -> List[Dict[str, Any]]:
        """Fetch multiple records from the database"""
        try:
            query = self.client.table(table).select("*")
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.execute()
            
            if not result.data:
                return []
                
            # Apply extra validation if provided
            if extra_checks:
                return [r for r in result.data if extra_checks(r)]
            return result.data
        except Exception as e:
            print(f"Error fetching from {table}: {e}")
            return []

    async def insert(
        self, 
        table: str, 
        data: Dict[str, Any]
    ) -> Optional[str]:
        """Insert a record and return its ID"""
        try:
            result = self.client.table(table).insert(data).execute()
            if result.data:
                return result.data[0]["id"]
            return None
        except Exception as e:
            print(f"Error inserting into {table}: {e}")
            return None

    async def update(
        self, 
        table: str, 
        filters: Dict[str, Any], 
        data: Dict[str, Any]
    ) -> bool:
        """Update records matching the filters"""
        try:
            query = self.client.table(table)
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.update(data).execute()
            return bool(result.data)
        except Exception as e:
            print(f"Error updating {table}: {e}")
            return False

    async def delete(
        self, 
        table: str, 
        filters: Dict[str, Any]
    ) -> bool:
        """Delete records matching the filters"""
        try:
            # Build the delete query with filters
            delete_query = self.client.from_(table).delete()
            for key, value in filters.items():
                delete_query = delete_query.eq(key, value)
            
            result = delete_query.execute()
            return bool(result.data)
        except Exception as e:
            print(f"Error deleting from {table}: {e}")
            return False 