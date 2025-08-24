from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from datetime import datetime
from ..database import Base

class RentalStatus(str, Enum):
    PENDING = "pending"        # Oczekujące na potwierdzenie
    CONFIRMED = "confirmed"    # Potwierdzone
    ACTIVE = "active"          # Trwające wypożyczenie
    COMPLETED = "completed"    # Zakończone
    CANCELLED = "cancelled"    # Anulowane
    OVERDUE = "overdue"        # Przeterminowane

class Rental(Base):
    __tablename__ = "rentals"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Klucze obce (relacje)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    
    # Szczegóły wypożyczenia - tylko dzienny okres
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    actual_return_date = Column(DateTime, nullable=True)
    
    quantity = Column(Integer, default=1)
    
    # Koszty - usunięte opłaty za uszkodzenia i spóźnienia
    unit_price = Column(Numeric(10, 2), nullable=False)  # Cena za dzień
    total_price = Column(Numeric(10, 2), nullable=False)
    deposit_amount = Column(Numeric(10, 2), default=0)
    
    # Status i notatki
    status = Column(SQLEnum(RentalStatus), default=RentalStatus.PENDING)
    notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Odbiór i zwrot
    pickup_address = Column(String(500), nullable=True)
    return_address = Column(String(500), nullable=True)
    delivery_required = Column(Boolean, default=False)
    
    # Stan sprzętu
    condition_before = Column(Text, nullable=True)  # Stan przed wypożyczeniem
    condition_after = Column(Text, nullable=True)   # Stan po zwrocie
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relacje
    user = relationship("User", back_populates="rentals")
    equipment = relationship("Equipment", back_populates="rentals")
    payments = relationship("Payment", back_populates="rental")
    
    @property
    def duration_days(self):
        """Oblicza liczbę dni wypożyczenia"""
        if self.actual_return_date:
            return (self.actual_return_date - self.start_date).days
        return (self.end_date - self.start_date).days
    
    @property
    def is_overdue(self):
        """Sprawdza czy wypożyczenie jest przeterminowane"""
        return (self.status in [RentalStatus.ACTIVE, RentalStatus.CONFIRMED] 
                and datetime.now() > self.end_date)