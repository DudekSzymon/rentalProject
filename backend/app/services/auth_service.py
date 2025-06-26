from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.user import User
from ..config import settings

class AuthService:
   """Serwis uwierzytelniania - obsługuje hashowanie haseł, JWT tokeny i autoryzację"""
   
   def __init__(self):
       # Konfiguracja hashowania haseł z użyciem bcrypt
       self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
       # Konfiguracja JWT z ustawień aplikacji
       self.secret_key = settings.SECRET_KEY
       self.algorithm = settings.ALGORITHM
       self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
   
   def hash_password(self, password: str) -> str:
       """Hashowanie hasła przy użyciu bcrypt"""
       return self.pwd_context.hash(password)
   
   def verify_password(self, plain_password: str, hashed_password: str) -> bool:
       """Weryfikacja hasła - porównuje hasło w postaci jawnej z zahashowanym"""
       if not hashed_password:
           return False  # Brak zahashowanego hasła (np. dla kont Google)
       return self.pwd_context.verify(plain_password, hashed_password)
   
   def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
       """Tworzenie JWT tokenu dostępu z opcjonalnym czasem wygaśnięcia"""
       to_encode = data.copy()  # Kopia danych do zakodowania
       
       # Ustawienie czasu wygaśnięcia tokenu
       if expires_delta:
           expire = datetime.utcnow() + expires_delta
       else:
          
           expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
       
       
       to_encode.update({"exp": expire, "type": "access"})
       # Kodowanie JWT z kluczem i algorytmem
       encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
       return encoded_jwt
   
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