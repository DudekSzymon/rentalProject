from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from enum import Enum

# Enum dla ról użytkowników - musi być synchronizowany z modelem User
class UserRole(str, Enum):
   ADMIN = "admin"        # Administrator systemu
   CUSTOMER = "customer"  # Zwykły klient

# Enum dla dostawców uwierzytelniania - musi być synchronizowany z modelem User
class AuthProvider(str, Enum):
   LOCAL = "local"    # Konto lokalne (email + hasło)
   GOOGLE = "google"  # Logowanie przez Google OAuth

#(rejestracja)
class UserCreate(BaseModel):
   email: EmailStr              # Email użytkownika (walidowany automatycznie)
   password: str               # Hasło w postaci jawnej (będzie zahashowane)
   first_name: str            # Imię użytkownika
   last_name: str             # Nazwisko użytkownika
   phone: Optional[str] = None # Numer telefonu (opcjonalny)
   
   # Walidator hasła - sprawdza minimalną długość
   @validator('password')
   def validate_password(cls, v):
       if len(v) < 6:
           raise ValueError('Hasło musi mieć co najmniej 6 znaków')
       return v

# Schema do logowania użytkownika
class UserLogin(BaseModel):
   email: EmailStr  # Email użytkownika
   password: str    # Hasło w postaci jawnej

# Schema odpowiedzi z danymi użytkownika (bez wrażliwych danych jak hasło!)
class UserResponse(BaseModel):
   id: int                      # Unikalny identyfikator użytkownika
   email: str                   # Email użytkownika
   first_name: str             # Imię użytkownika
   last_name: str              # Nazwisko użytkownika
   phone: Optional[str]        # Numer telefonu (może być None)
   role: UserRole              # Rola użytkownika w systemie
   auth_provider: AuthProvider # Sposób uwierzytelniania (local/google)
   is_verified: bool           # Czy email został zweryfikowany
   created_at: datetime        # Data utworzenia konta
   
   # Konfiguracja dla SQLAlchemy - pozwala na konwersję z ORM
   class Config:
       from_attributes = True

# Schema odpowiedzi z tokenem JWT po pomyślnym logowaniu
class Token(BaseModel):
   access_token: str           # JWT token dostępu
   token_type: str = "bearer"  # Typ tokenu (zawsze "bearer" dla JWT)
   user: UserResponse          # Dane użytkownika po zalogowaniu