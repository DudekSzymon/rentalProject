from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from ..database import Base

# Enum dla ról użytkowników w systemie
class UserRole(str, Enum):
   ADMIN = "admin"        # Administrator - pełny dostęp do systemu
   CUSTOMER = "customer"  # Klient - może wypożyczać samochody

# Enum dla dostawców uwierzytelniania
class AuthProvider(str, Enum):
   LOCAL = "local"    # Lokalne konto (email + hasło)
   GOOGLE = "google"  # Logowanie przez Google OAuth

class User(Base):
   __tablename__ = "users"
   
   # Podstawowe informacje o użytkowniku
   id = Column(Integer, primary_key=True, index=True)  # Unikalny identyfikator użytkownika
   email = Column(String(255), unique=True, index=True, nullable=False)  # Email - musi być unikalny
   first_name = Column(String(100), nullable=False)  # Imię użytkownika
   last_name = Column(String(100), nullable=False)   # Nazwisko użytkownika
   phone = Column(String(20), nullable=True)         # Numer telefonu (opcjonalny)
   password_hash = Column(String(255), nullable=True)  # Hash hasła (nullable dla OAuth)
   
   # Ustawienia konta
   role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER)  # Rola użytkownika (domyślnie klient)
   auth_provider = Column(SQLEnum(AuthProvider), default=AuthProvider.LOCAL)  # Sposób logowania
   provider_id = Column(String(255), nullable=True)  # ID użytkownika z zewnętrznego dostawcy (np. Google)
   
   # Statusy konta
   is_verified = Column(Boolean, default=False)  # Czy email został zweryfikowany
   is_blocked = Column(Boolean, default=False)   # Czy konto jest zablokowane przez admina
   is_active = Column(Boolean, default=True)     # Czy konto jest aktywne
   
   # Znaczniki czasowe
   created_at = Column(DateTime(timezone=True), server_default=func.now())  # Data utworzenia konta
   updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())  # Data ostatniej aktualizacji
   
   # Relacje z innymi tabelami
   rentals = relationship("Rental", back_populates="user")  # Wypożyczenia tego użytkownika
   payments = relationship("Payment", back_populates="user", foreign_keys="Payment.user_id")  # Płatności użytkownika
   
   # Właściwość obliczana - pełne imię i nazwisko
   @property
   def full_name(self):
       return f"{self.first_name} {self.last_name}"