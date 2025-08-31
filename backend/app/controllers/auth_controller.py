from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from google.auth.transport import requests
from google.oauth2 import id_token
from google.auth import jwt as google_jwt
from pydantic import BaseModel

from ..database import get_db
from ..models.user import User, AuthProvider
from ..views.user_schemas import (
    UserCreate, UserLogin, UserResponse, Token, 
    RefreshTokenRequest, RefreshTokenResponse
)
from ..services.auth_service import auth_service
from ..config import settings

router = APIRouter() #klasa routera fast api która przechowuje w jednym miescju endpointy
security = HTTPBearer() #sluzy do obslugi uwierzytelnienia httpbearer i wyciąga automatycznie token z headera i parsuje go i zwraca httpauthorization w credentials

class GoogleLoginRequest(BaseModel):
    token: str

def _ensure_google_configured():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth nie jest skonfigurowany"
        )

def _check_user_access(user: User):
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Konto zostało zablokowane"
        )

def _create_token_response(user: User, db: Session) -> Token:
    access_token, refresh_token = auth_service.create_token_pair(user.id, db)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )

def _verify_google_token(token: str) -> dict:
    try:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)
    except ValueError as e:
        if "Token used too early" in str(e) or "Token used too late" in str(e):
            certs_url = "https://www.googleapis.com/oauth2/v1/certs"
            certs_request = requests.Request()
            certs = id_token._fetch_certs(certs_request, certs_url)
            
            idinfo = google_jwt.decode(
                token,
                certs=certs,
                audience=settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=60
            )
        else:
            raise e
    
    if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
        raise ValueError('Nieprawidłowy issuer.')
    
    return idinfo       #zwracamy informacje o użytkowniku

def _get_or_create_google_user(email: str, google_id: str, first_name: str, last_name: str, db: Session) -> User:
    user = db.query(User).filter(
        (User.email == email) | 
        ((User.provider_id == google_id) & (User.auth_provider == AuthProvider.GOOGLE))
    ).first()
    
    if not user:
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            auth_provider=AuthProvider.GOOGLE,
            provider_id=google_id,
            is_verified=True
        )
        db.add(user)
    else:
        if user.auth_provider == AuthProvider.LOCAL:
            user.auth_provider = AuthProvider.GOOGLE
            user.provider_id = google_id
            user.is_verified = True
    
    db.commit()
    db.refresh(user)
    return user

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email już jest zarejestrowany"
        )
    
    new_user = User(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        password_hash=auth_service.hash_password(user_data.password),
        auth_provider=AuthProvider.LOCAL,
        is_verified=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse.from_orm(new_user)

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not auth_service.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy email lub hasło"
        )
    
    _check_user_access(user)
    return _create_token_response(user, db)

@router.post("/google", response_model=Token)
async def google_login(google_data: GoogleLoginRequest, db: Session = Depends(get_db)):
    _ensure_google_configured()
    
    try:
        idinfo = _verify_google_token(google_data.token)
        
        google_id = idinfo['sub']
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nieprawidłowy token Google: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd weryfikacji: {str(e)}"
        )
    
    try:
        user = _get_or_create_google_user(email, google_id, first_name, last_name, db)
        _check_user_access(user)
        return _create_token_response(user, db)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd bazy danych: {str(e)}"
        )

@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    user = auth_service.verify_refresh_token(refresh_data.refresh_token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy lub wygasły refresh token"
        )
    
    access_token = auth_service.create_access_token_only(user.id)
    
    return RefreshTokenResponse(
        access_token=access_token,
        refresh_token=refresh_data.refresh_token,
        token_type="bearer"
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = auth_service.get_current_user(credentials.credentials, db)
    return UserResponse.from_orm(user)

@router.post("/logout")
async def logout(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    try:
        auth_service.revoke_refresh_token(refresh_data.refresh_token, db)
    except Exception:
        pass
    return {"message": "Pomyślnie wylogowano"}

@router.get("/google-config")
async def get_google_config():
    _ensure_google_configured()
    return {"client_id": settings.GOOGLE_CLIENT_ID, "enabled": True}