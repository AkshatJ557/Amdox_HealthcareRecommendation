from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from loguru import logger
import certifi

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB Atlas...")
    print(f"Using URI: {settings.MONGO_URI}")
    try:
        db_instance.client = AsyncIOMotorClient(
            settings.MONGO_URI, 
            tls=True, 
            tlsCAFile=certifi.where()
        )
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        
        # Test the connection mapping a ping
        await db_instance.db.command('ping')
        logger.info("Successfully connected to MongoDB Atlas!")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    logger.info("Closing MongoDB Atlas connection...")
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB Atlas connection closed.")

def get_database():
    return db_instance.db
