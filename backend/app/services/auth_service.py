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
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_seconds = settings.ACCESS_TOKEN_EXPIRE_SECONDS
        self.refresh_token_expire_minutes = settings.REFRESH_TOKEN_EXPIRE_MINUTES
    
    def hash_password(self, password: str) -> str:
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password or "")
    
    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()
    
    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy() #zapisanie kopi przekazanych danych
        expire = datetime.utcnow() + timedelta(seconds=self.access_token_expire_seconds) # wyliczanie czasu tokena
        to_encode.update({"exp": expire, "type": "access"}) #kiedy token traci ważnośc
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm) #zakodowanie danych w token
    
    def create_refresh_token(self, user_id: int, db: Session) -> str:
        refresh_token = secrets.token_urlsafe(32)
        token_hash = self._hash_token(refresh_token)
        expires_at = datetime.utcnow() + timedelta(minutes=self.refresh_token_expire_minutes)
        
        db_refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(db_refresh_token)
        db.commit()
        
        return refresh_token
    
    def create_token_pair(self, user_id: int, db: Session) -> Tuple[str, str]:
        access_token = self.create_access_token({"sub": str(user_id)})
        refresh_token = self.create_refresh_token(user_id, db)
        return access_token, refresh_token
    
    def create_access_token_only(self, user_id: int) -> str:
        return self.create_access_token({"sub": str(user_id)})
    
    def verify_refresh_token(self, refresh_token: str, db: Session) -> Optional[User]:
        token_hash = self._hash_token(refresh_token)
        
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()
        
        if not db_token or not db_token.is_valid:
            return None
        
        user = db.query(User).filter(User.id == db_token.user_id).first()
        if not user or user.is_blocked:
            return None
        
        return user
    
    def revoke_refresh_token(self, refresh_token: str, db: Session):
        token_hash = self._hash_token(refresh_token)
        
        db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).update({"is_revoked": True})
        
        db.commit()
    
    def verify_token(self, token: str):
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nieprawidłowy token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def get_current_user(self, token: str, db: Session) -> User:
        payload = self.verify_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nieprawidłowy token"
            )
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Użytkownik nie znaleziony"
            )
        
        if user.is_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Konto zostało zablokowane"
            )
        
        return user
    
    def require_admin(self, user: User):
        if user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Brak uprawnień administratora"
            )

auth_service = AuthService()