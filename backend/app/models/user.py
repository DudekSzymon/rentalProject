from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from ..database import Base

class UserRole(str, Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"

class AuthProvider(str, Enum):
    LOCAL = "local"
    GOOGLE = "google"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=True)  # Nullable dla social login
    
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER)
    auth_provider = Column(SQLEnum(AuthProvider), default=AuthProvider.LOCAL)
    provider_id = Column(String(255), nullable=True)  # ID z Google
    
    is_verified = Column(Boolean, default=False)
    is_blocked = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacje
    rentals = relationship("Rental", back_populates="user")
    payments = relationship("Payment", back_populates="user", foreign_keys="Payment.user_id")
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"