from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    MONGO_URI: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_NAME: str = "healthcare_db"

    class Config:
        env_file = "../.env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
