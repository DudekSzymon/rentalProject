from decouple import config

class Settings:
    # Database
    DATABASE_URL: str = config("DATABASE_URL", default="sqlite:///./wypozyczalnia.db")
    
    # Security
    SECRET_KEY: str = config("SECRET_KEY", default="super-secret-key-change-me")
    ALGORITHM: str = config("ALGORITHM", default="HS256")
    
    # Token expiration times
    ACCESS_TOKEN_EXPIRE_SECONDS: int = config("ACCESS_TOKEN_EXPIRE_SECONDS", default=30, cast=int)  # 30 sekund
    REFRESH_TOKEN_EXPIRE_MINUTES: int = config("REFRESH_TOKEN_EXPIRE_MINUTES", default=15, cast=int)  # 15 minut
    
    GOOGLE_CLIENT_ID: str = config("GOOGLE_CLIENT_ID", default="").strip()
    GOOGLE_CLIENT_SECRET: str = config("GOOGLE_CLIENT_SECRET", default="").strip()
    
    # Payment Settings
    STRIPE_SECRET_KEY: str = config("STRIPE_SECRET_KEY", default="")
    STRIPE_PUBLISHABLE_KEY: str = config("STRIPE_PUBLISHABLE_KEY", default="")
    STRIPE_WEBHOOK_SECRET: str = config("STRIPE_WEBHOOK_SECRET", default="")
    
    # CORS
    FRONTEND_URL: str = config("FRONTEND_URL", default="http://localhost:5173")

settings = Settings()

# Debug - sprawdź czy Google jest skonfigurowany
if settings.GOOGLE_CLIENT_ID:
    print(f"✅ Google Client ID loaded: {settings.GOOGLE_CLIENT_ID[:20]}...")
else:
    print("❌ Google Client ID not found!")
if settings.STRIPE_SECRET_KEY:
    print("✅ Stripe payments enabled")
else:
    print("❌ Stripe payments KEY not found!")

print(f"✅ Token config: Access={settings.ACCESS_TOKEN_EXPIRE_SECONDS}s, Refresh={settings.REFRESH_TOKEN_EXPIRE_MINUTES}min")