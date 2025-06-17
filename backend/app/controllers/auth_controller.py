from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from google.auth.transport import requests
from google.oauth2 import id_token
from google.auth import jwt as google_jwt  # Dodany import dla clock skew

from ..database import get_db
from ..models.user import User, AuthProvider, UserRole
from ..views.user_schemas import (
    UserCreate, UserLogin, UserResponse, Token
)
from ..services.auth_service import auth_service
from ..config import settings

router = APIRouter()
security = HTTPBearer()

# Schema dla Google OAuth
from pydantic import BaseModel

class GoogleLoginRequest(BaseModel):
    token: str  # Google ID token

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Rejestracja nowego użytkownika"""
    
    # Sprawdzenie czy email już istnieje
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email już jest zarejestrowany"
        )
    
    # Tworzenie nowego użytkownika
    hashed_password = auth_service.hash_password(user_data.password)
    
    new_user = User(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        password_hash=hashed_password,
        auth_provider=AuthProvider.LOCAL,
        is_verified=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse.from_orm(new_user)

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Logowanie użytkownika (email/hasło)"""
    
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not auth_service.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy email lub hasło"
        )
    
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Konto zostało zablokowane"
        )
    
    # Generowanie JWT tokenu
    access_token = auth_service.create_access_token({"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )

@router.post("/google", response_model=Token)
async def google_login(google_data: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Logowanie przez Google OAuth z obsługą clock skew"""
    
    print(f"🔵 Google login started")
    print(f"🔵 Token received: {google_data.token[:50]}...")
    print(f"🔵 Client ID: {settings.GOOGLE_CLIENT_ID[:20]}...")
    
    if not settings.GOOGLE_CLIENT_ID:
        print("❌ Google Client ID not configured")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth nie jest skonfigurowany"
        )
    
    try:
        print("🔵 Verifying token with Google...")
        
        # ROZWIĄZANIE: Próbuj standardowej weryfikacji, potem z clock skew
        try:
            # Standardowa weryfikacja
            idinfo = id_token.verify_oauth2_token(
                google_data.token, 
                requests.Request(), 
                settings.GOOGLE_CLIENT_ID
            )
            print("✅ Token verified with standard method")
            
        except ValueError as e:
            if "Token used too early" in str(e) or "Token used too late" in str(e):
                print(f"🔄 Clock skew detected: {str(e)}")
                print("🔄 Retrying with clock skew tolerance (60 seconds)...")
                
                try:
                    # Pobierz certyfikaty Google
                    certs_url = "https://www.googleapis.com/oauth2/v1/certs"
                    certs_request = requests.Request()
                    certs = id_token._fetch_certs(certs_request, certs_url)
                    
                    # Dekoduj z tolerancją clock skew
                    idinfo = google_jwt.decode(
                        google_data.token,
                        certs=certs,
                        audience=settings.GOOGLE_CLIENT_ID,
                        clock_skew_in_seconds=60  # Tolerancja 60 sekund
                    )
                    
                    # Sprawdź issuer ręcznie
                    if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                        raise ValueError('Nieprawidłowy issuer.')
                    
                    print("✅ Token verified with clock skew tolerance")
                    
                except Exception as clock_error:
                    print(f"❌ Clock skew verification failed: {str(clock_error)}")
                    raise ValueError(f"Token verification failed even with clock skew: {str(clock_error)}")
            else:
                # Jeśli to nie clock skew, przekaż oryginalny błąd
                raise e
        
        # Sprawdź issuer (jeśli nie było już sprawdzone w clock skew)
        if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Nieprawidłowy issuer.')
        
        google_id = idinfo['sub']
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        
        print(f"🔵 User data: {email}, {first_name} {last_name}")
        
    except ValueError as e:
        print(f"❌ Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nieprawidłowy token Google: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd weryfikacji: {str(e)}"
        )
    
    try:
        print("🔵 Checking for existing user...")
        # Sprawdzenie czy użytkownik już istnieje
        user = db.query(User).filter(
            (User.email == email) | 
            ((User.provider_id == google_id) & (User.auth_provider == AuthProvider.GOOGLE))
        ).first()
        
        if not user:
            print("🔵 Creating new user...")
            # Tworzenie nowego użytkownika z Google
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                auth_provider=AuthProvider.GOOGLE,
                provider_id=google_id,
                is_verified=True  # Google już zweryfikował email
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ New user created: {user.id}")
        else:
            print(f"✅ User found: {user.id}")
            # Aktualizacja istniejącego użytkownika
            if user.auth_provider == AuthProvider.LOCAL:
                user.auth_provider = AuthProvider.GOOGLE
                user.provider_id = google_id
                user.is_verified = True
            db.commit()
    
        if user.is_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Konto zostało zablokowane"
            )
    
        # Generowanie JWT tokenu
        access_token = auth_service.create_access_token({"sub": str(user.id)})
        print("✅ JWT token generated")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.from_orm(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd bazy danych: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Pobranie danych aktualnie zalogowanego użytkownika"""
    print(f"DEBUG: Received token: {credentials.credentials[:20]}...")
    
    try:
        user = auth_service.get_current_user(credentials.credentials, db)
        print(f"DEBUG: User found: {user.email}")
        return UserResponse.from_orm(user)
    except Exception as e:
        print(f"DEBUG: Error: {str(e)}")
        raise e

@router.post("/logout")
async def logout():
    """Wylogowanie użytkownika"""
    # W przypadku JWT, logout jest obsłużony po stronie klienta
    return {"message": "Pomyślnie wylogowano"}

@router.get("/google-config")
async def get_google_config():
    """Pobierz konfigurację Google OAuth dla frontendu"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth nie jest skonfigurowany"
        )
    
    return {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "enabled": True
    }