from typing import Optional, List, Dict, Any, Callable
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
            logger.info(f"Fetching one record from {table} with filters: {filters}")
            query = self.client.table(table).select("*")
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.execute()
            
            if not result.data:
                logger.info(f"No records found in {table} with filters: {filters}")
                return None
                
            # Apply extra validation if provided
            if extra_checks and not extra_checks(result.data[0]):
                logger.info("Record found but failed extra validation checks")
                return None
                
            logger.info("Successfully fetched one record")
            return result.data[0]
        except Exception as e:
            error_msg = f"Error fetching from {table}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

    async def fetch_many(
        self, 
        table: str, 
        filters: Dict[str, Any],
        extra_checks: Optional[Callable[[Dict[str, Any]], bool]] = None
    ) -> List[Dict[str, Any]]:
        """Fetch multiple records from the database"""
        try:
            logger.info(f"Fetching records from {table} with filters: {filters}")
            query = self.client.table(table).select("*")
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.execute()
            
            if not result.data:
                logger.info(f"No records found in {table} with filters: {filters}")
                return []
                
            # Apply extra validation if provided
            if extra_checks:
                filtered_data = [r for r in result.data if extra_checks(r)]
                logger.info(f"Found {len(filtered_data)} records after validation")
                return filtered_data
            
            logger.info(f"Found {len(result.data)} records")
            return result.data
        except Exception as e:
            error_msg = f"Error fetching from {table}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

    async def insert(
        self, 
        table: str, 
        data: Dict[str, Any]
    ) -> Optional[str]:
        """Insert a record and return its ID"""
        try:
            logger.info(f"Inserting record into {table}")
            result = self.client.table(table).insert(data).execute()
            if result.data:
                logger.info(f"Successfully inserted record with ID: {result.data[0]['id']}")
                return result.data[0]["id"]
            logger.warning(f"Insert into {table} returned no data")
            return None
        except Exception as e:
            error_msg = f"Error inserting into {table}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

    async def update(
        self, 
        table: str, 
        filters: Dict[str, Any], 
        data: Dict[str, Any]
    ) -> bool:
        """Update records matching the filters"""
        try:
            logger.info(f"Updating records in {table} with filters: {filters}")
            query = self.client.table(table)
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.update(data).execute()
            success = bool(result.data)
            if success:
                logger.info(f"Successfully updated records in {table}")
            else:
                logger.warning(f"Update in {table} affected no records")
            return success
        except Exception as e:
            error_msg = f"Error updating {table}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

    async def delete(
        self, 
        table: str, 
        filters: Dict[str, Any]
    ) -> bool:
        """Delete records matching the filters"""
        try:
            logger.info(f"Deleting records from {table} with filters: {filters}")
            # Build the delete query with filters
            delete_query = self.client.from_(table).delete()
            for key, value in filters.items():
                delete_query = delete_query.eq(key, value)
            
            result = delete_query.execute()
            success = bool(result.data)
            if success:
                logger.info(f"Successfully deleted records from {table}")
            else:
                logger.warning(f"Delete from {table} affected no records")
            return success
        except Exception as e:
            error_msg = f"Error deleting from {table}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg) 