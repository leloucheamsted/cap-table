import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Cap Table"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+mysqlconnector://root:password@localhost:3306/captable")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS = ["http://localhost:3000"]

settings = Settings()
