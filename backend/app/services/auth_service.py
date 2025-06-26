from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import secrets
import hashlib

from ..models.user import User
from ..models.refresh_token import RefreshToken
from ..config import settings

class AuthService:
    """Serwis uwierzytelniania - obsługuje hashowanie haseł, JWT tokeny i autoryzację"""
    
    def __init__(self):
        # Konfiguracja hashowania haseł z użyciem bcrypt
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        # Konfiguracja JWT z ustawień aplikacji
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_seconds = settings.ACCESS_TOKEN_EXPIRE_SECONDS
        self.refresh_token_expire_minutes = settings.REFRESH_TOKEN_EXPIRE_MINUTES
    
    def hash_password(self, password: str) -> str:
        """Hashowanie hasła przy użyciu bcrypt"""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Weryfikacja hasła - porównuje hasło w postaci jawnej z zahashowanym"""
        if not hashed_password:
            return False  # Brak zahashowanego hasła (np. dla kont Google)
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def _hash_token(self, token: str) -> str:
        """Hashuje token do przechowywania w bazie danych"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Tworzenie JWT tokenu dostępu z opcjonalnym czasem wygaśnięcia"""
        to_encode = data.copy()
        
        # Ustawienie czasu wygaśnięcia tokenu
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(seconds=self.access_token_expire_seconds)
        
        to_encode.update({"exp": expire, "type": "access"})
        # Kodowanie JWT z kluczem i algorytmem
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(self, user_id: int, db: Session) -> str:
        """Tworzenie refresh tokenu i zapisanie go w bazie danych"""
        # Generuj losowy token
        refresh_token = secrets.token_urlsafe(32)
        token_hash = self._hash_token(refresh_token)
        
        # Oblicz czas wygaśnięcia
        expires_at = datetime.utcnow() + timedelta(minutes=self.refresh_token_expire_minutes)
        
        # ⚠️  USUNIĘTE: Nie unieważniaj starych tokenów przy każdym tworzeniu
        # Stare tokeny będą unieważniane tylko przy logout lub gdy faktycznie wygasną
        
        # Zapisz nowy refresh token w bazie
        db_refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(db_refresh_token)
        db.commit()
        
        return refresh_token
    
    def create_token_pair(self, user_id: int, db: Session) -> Tuple[str, str]:
        """Tworzy parę access token + refresh token
        UWAGA: Używać tylko przy login! Przy refresh używaj create_access_token_only"""
        access_token = self.create_access_token({"sub": str(user_id)})
        refresh_token = self.create_refresh_token(user_id, db)
        return access_token, refresh_token
    
    def create_access_token_only(self, user_id: int) -> str:
        """Tworzy TYLKO nowy access token (bez zmiany refresh tokenu)"""
        return self.create_access_token({"sub": str(user_id)})
    
    def verify_refresh_token(self, refresh_token: str, db: Session) -> Optional[User]:
        """Weryfikuje refresh token i zwraca użytkownika"""
        token_hash = self._hash_token(refresh_token)
        
        # Znajdź token w bazie danych
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()
        
        if not db_token or not db_token.is_valid:
            return None
        
        # Pobierz użytkownika
        user = db.query(User).filter(User.id == db_token.user_id).first()
        if not user or user.is_blocked:
            return None
        
        return user
    
    def revoke_refresh_token(self, refresh_token: str, db: Session) -> bool:
        """Unieważnia refresh token"""
        token_hash = self._hash_token(refresh_token)
        
        result = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).update({"is_revoked": True})
        
        db.commit()
        return result > 0
    
    def verify_token(self, token: str):
        """Weryfikacja JWT tokenu - dekoduje i sprawdza ważność"""
        try:
            # Oczyszczenie tokenu z prefiksu "Bearer " jeśli istnieje
            if token.startswith("Bearer "):
                token = token[7:]  # Usuń pierwsze 7 znaków ("Bearer ")
            
            # Logi debugowe do śledzenia procesu weryfikacji
            print(f"DEBUG: Clean token: {token[:50]}...")
            print(f"DEBUG: Secret key: {self.secret_key}")
            print(f"DEBUG: Algorithm: {self.algorithm}")
            
            # Dekodowanie JWT z weryfikacją podpisu i czasu wygaśnięcia
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            print(f"DEBUG: Token decoded successfully: {payload}")
            return payload
        except JWTError as e:
            # Szczegółowe logowanie błędów JWT
            print(f"DEBUG: JWT Error type: {type(e)}")
            print(f"DEBUG: JWT Error message: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nieprawidłowy token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def get_current_user(self, token: str, db: Session) -> User:
        """Pobranie aktualnie zalogowanego użytkownika na podstawie JWT tokenu"""
        try:
            # Weryfikacja tokenu i wyciągnięcie payload
            payload = self.verify_token(token)
            user_id: str = payload.get("sub")  # "sub" (subject) zawiera ID użytkownika
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Nieprawidłowy token"
                )
        except JWTError:
            # Obsługa błędów JWT
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nieprawidłowy token"
            )
        
        # Wyszukanie użytkownika w bazie danych
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Użytkownik nie znaleziony"
            )
        
        # Sprawdzenie czy konto nie jest zablokowane
        if user.is_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Konto zostało zablokowane"
            )
        
        return user
    
    def require_admin(self, user: User):
        """Sprawdzenie czy użytkownik ma uprawnienia administratora"""
        if user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Brak uprawnień administratora"
            )

# Globalna instancja serwisu uwierzytelniania - singleton do użycia w całej aplikacji
auth_service = AuthService()