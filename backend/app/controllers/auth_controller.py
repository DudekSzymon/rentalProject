from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from google.auth.transport import requests
from google.oauth2 import id_token
from google.auth import jwt as google_jwt  # Import dla obsługi clock skew w tokenach Google

from ..database import get_db
from ..models.user import User, AuthProvider, UserRole
from ..views.user_schemas import (
   UserCreate, UserLogin, UserResponse, Token
)
from ..services.auth_service import auth_service
from ..config import settings

# Router dla endpointów uwierzytelniania
router = APIRouter()
# Schemat bezpieczeństwa dla tokenów Bearer
security = HTTPBearer()

# Schema dla logowania przez Google OAuth
from pydantic import BaseModel

class GoogleLoginRequest(BaseModel):
   token: str  # Token ID otrzymany z Google OAuth

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
   """Rejestracja nowego użytkownika w systemie lokalnym"""
   
   # Sprawdzenie czy użytkownik z tym emailem już istnieje
   existing_user = db.query(User).filter(User.email == user_data.email).first()
   if existing_user:
       raise HTTPException(
           status_code=status.HTTP_400_BAD_REQUEST,
           detail="Email już jest zarejestrowany"
       )
   
   # Hashowanie hasła i tworzenie nowego użytkownika
   hashed_password = auth_service.hash_password(user_data.password)
   
   new_user = User(
       email=user_data.email,
       first_name=user_data.first_name,
       last_name=user_data.last_name,
       phone=user_data.phone,
       password_hash=hashed_password,
       auth_provider=AuthProvider.LOCAL,  # Konto lokalne
       is_verified=False  # Wymaga weryfikacji emaila
   )
   
   # Zapis do bazy danych
   db.add(new_user)
   db.commit()
   db.refresh(new_user)
   
   return UserResponse.from_orm(new_user)

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
   """Logowanie użytkownika za pomocą email i hasło"""
   
   # Wyszukanie użytkownika po emailu
   user = db.query(User).filter(User.email == login_data.email).first()
   
   # Weryfikacja użytkownika i hasła
   if not user or not auth_service.verify_password(login_data.password, user.password_hash):
       raise HTTPException(
           status_code=status.HTTP_401_UNAUTHORIZED,
           detail="Nieprawidłowy email lub hasło"
       )
   
   # Sprawdzenie czy konto nie jest zablokowane
   if user.is_blocked:
       raise HTTPException(
           status_code=status.HTTP_403_FORBIDDEN,
           detail="Konto zostało zablokowane"
       )
   
   # Generowanie JWT tokenu dostępu
   access_token = auth_service.create_access_token({"sub": str(user.id)})
   # Wysyłamy token na front
   return Token(
       access_token=access_token,
       token_type="bearer",
       user=UserResponse.from_orm(user)
   )

@router.post("/google", response_model=Token)
async def google_login(google_data: GoogleLoginRequest, db: Session = Depends(get_db)):
   """Logowanie przez Google OAuth z obsługą problemów synchronizacji czasu"""
   
   # Logi debugowe dla śledzenia procesu
   print(f"🔵 Google login started")
   print(f"🔵 Token received: {google_data.token[:50]}...")
   print(f"🔵 Client ID: {settings.GOOGLE_CLIENT_ID[:20]}...")
   
   # Sprawdzenie czy Google OAuth jest skonfigurowany
   if not settings.GOOGLE_CLIENT_ID:
       print("❌ Google Client ID not configured")
       raise HTTPException(
           status_code=status.HTTP_501_NOT_IMPLEMENTED,
           detail="Google OAuth nie jest skonfigurowany"
       )
   
   try:
       print("🔵 Verifying token with Google...")
       
       try:
           # weryfikacja tokenu
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
            
                   certs_url = "https://www.googleapis.com/oauth2/v1/certs"
                   certs_request = requests.Request()
                   certs = id_token._fetch_certs(certs_request, certs_url)
                   
                  
                   idinfo = google_jwt.decode(
                       google_data.token,
                       certs=certs,
                       audience=settings.GOOGLE_CLIENT_ID,
                       clock_skew_in_seconds=60  
                   )
                   
                   # Ręczna weryfikacja wydawcy tokenu
                   if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                       raise ValueError('Nieprawidłowy issuer.')
                   
                   print("✅ Token verified with clock skew tolerance")
                   
               except Exception as clock_error:
                   print(f"❌ Clock skew verification failed: {str(clock_error)}")
                   raise ValueError(f"Token verification failed even with clock skew: {str(clock_error)}")
           else:
               raise e
       
      
       if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
           raise ValueError('Nieprawidłowy issuer.')
       
       # Wyciągnięcie danych użytkownika z tokenu Google
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
       # Wyszukanie użytkownika po emailu lub Google ID
       user = db.query(User).filter(
           (User.email == email) | 
           ((User.provider_id == google_id) & (User.auth_provider == AuthProvider.GOOGLE))
       ).first()
       
       if not user:
           print("🔵 Creating new user...")
           user = User(
               email=email,
               first_name=first_name,
               last_name=last_name,
               auth_provider=AuthProvider.GOOGLE,
               provider_id=google_id,
               is_verified=True 
           )
           db.add(user)
           db.commit()
           db.refresh(user)
           print(f"✅ New user created: {user.id}")
       else:
           print(f"✅ User found: {user.id}")
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
   
       # Generowanie JWT aplikacji (a nie Google)
       access_token = auth_service.create_access_token({"sub": str(user.id)})
       print("✅ JWT token generated")
       
       return Token(
           access_token=access_token,
           token_type="bearer",
           user=UserResponse.from_orm(user)
       )
       
   except HTTPException:
       # Przekaż HTTPException bez zmian
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
   """Pobranie danych aktualnie zalogowanego użytkownika na podstawie JWT tokenu"""
   print(f"DEBUG: Received token: {credentials.credentials[:20]}...")
   
   try:
       # Weryfikacja tokenu i pobranie danych użytkownika
       user = auth_service.get_current_user(credentials.credentials, db)
       print(f"DEBUG: User found: {user.email}")
       return UserResponse.from_orm(user)
   except Exception as e:
       print(f"DEBUG: Error: {str(e)}")
       raise e

@router.post("/logout")
async def logout():
   """Wylogowanie użytkownika (w przypadku JWT obsługiwane po stronie klienta)"""
   # JWT to bezstanowe tokeny - logout polega na usunięciu tokenu z frontendu
   return {"message": "Pomyślnie wylogowano"}

@router.get("/google-config")
async def get_google_config():
   """Endpoint dla frontendu do pobrania konfiguracji Google OAuth"""
   if not settings.GOOGLE_CLIENT_ID:
       raise HTTPException(
           status_code=status.HTTP_501_NOT_IMPLEMENTED,
           detail="Google OAuth nie jest skonfigurowany"
       )
   
   # Zwrócenie Client ID potrzebnego do inicjalizacji Google OAuth na frontendzie
   return {
       "client_id": settings.GOOGLE_CLIENT_ID,
       "enabled": True
   }