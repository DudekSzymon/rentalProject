from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from google.auth.transport import requests
from google.oauth2 import id_token

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
    """Logowanie przez Google OAuth"""
    
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth nie jest skonfigurowany"
        )
    
    try:
        # Weryfikacja tokenu Google
        idinfo = id_token.verify_oauth2_token(
            google_data.token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Nieprawidłowy issuer.')
        
        google_id = idinfo['sub']
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nieprawidłowy token Google: {str(e)}"
        )
    
    # Sprawdzenie czy użytkownik już istnieje
    user = db.query(User).filter(
        (User.email == email) | 
        ((User.provider_id == google_id) & (User.auth_provider == AuthProvider.GOOGLE))
    ).first()
    
    if not user:
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
    else:
        # Aktualizacja istniejącego użytkownika
        if user.auth_provider == AuthProvider.LOCAL:
            user.auth_provider = AuthProvider.GOOGLE
            user.provider_id = google_id
            user.is_verified = True
        db.commit()
    
    # Generowanie JWT tokenu
    access_token = auth_service.create_access_token({"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
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
    
    """Pobranie danych aktualnie zalogowanego użytkownika"""
    
    user = auth_service.get_current_user(credentials.credentials, db)
    return UserResponse.from_orm(user)

@router.post("/logout")
async def logout():
    """Wylogowanie użytkownika"""
    # W przypadku JWT, logout jest obsłużony po stronie klienta
    return {"message": "Pomyślnie wylogowano"}