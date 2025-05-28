from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"

class AuthProvider(str, Enum):
    LOCAL = "local"
    GOOGLE = "google"

# Schema do tworzenia użytkownika
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Hasło musi mieć co najmniej 6 znaków')
        return v

# Schema do logowania
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Schema odpowiedzi (bez hasła!)
class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    role: UserRole
    auth_provider: AuthProvider
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Token response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse