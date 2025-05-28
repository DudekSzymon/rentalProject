from decouple import config

class Settings:
    # Database
    DATABASE_URL: str = config("DATABASE_URL", default="sqlite:///./wypozyczalnia.db")
    
    # Security
    SECRET_KEY: str = config("SECRET_KEY", default="super-secret-key-change-me")
    ALGORITHM: str = config("ALGORITHM", default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=30, cast=int)
    
    # OAuth Settings
    GOOGLE_CLIENT_ID: str = config("GOOGLE_CLIENT_ID", default="")
    GOOGLE_CLIENT_SECRET: str = config("GOOGLE_CLIENT_SECRET", default="")
    
    # Payment Settings
    STRIPE_SECRET_KEY: str = config("STRIPE_SECRET_KEY", default="")
    
    # CORS
    FRONTEND_URL: str = config("FRONTEND_URL", default="http://localhost:5173")

settings = Settings()