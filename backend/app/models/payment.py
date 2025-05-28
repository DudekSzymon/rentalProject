from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from ..database import Base

class PaymentStatus(str, Enum):
    PENDING = "pending"          # Oczekujące
    PROCESSING = "processing"    # W trakcie przetwarzania
    COMPLETED = "completed"      # Zakończone pomyślnie
    FAILED = "failed"           # Nieudane
    CANCELLED = "cancelled"      # Anulowane
    REFUNDED = "refunded"       # Zwrócone
    OFFLINE_APPROVED = "offline_approved"  # Zatwierdzone offline przez admina

class PaymentMethod(str, Enum):
    STRIPE = "stripe"
    OFFLINE = "offline"          # Płatność gotówką/przelewem zatwierdzona przez admina
    BANK_TRANSFER = "bank_transfer"

class PaymentType(str, Enum):
    RENTAL = "rental"            # Płatność za wypożyczenie
    DEPOSIT = "deposit"          # Kaucja
    LATE_FEE = "late_fee"       # Opłata za opóźnienie
    DAMAGE_FEE = "damage_fee"   # Opłata za uszkodzenie

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Klucze obce
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rental_id = Column(Integer, ForeignKey("rentals.id"), nullable=True)  # Może być null dla kaucji
    
    # Szczegóły płatności
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="PLN")
    payment_type = Column(SQLEnum(PaymentType), default=PaymentType.RENTAL)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Zewnętrzne ID płatności (Stripe, PayPal)
    external_id = Column(String(255), nullable=True)  # np. Stripe Payment Intent ID
    external_status = Column(String(100), nullable=True)
    
    # Metadane
    description = Column(Text, nullable=True)
    failure_reason = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    processed_at = Column(DateTime, nullable=True)
    
    # Offline approval (wymaganie z zadania)
    offline_approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin który zatwierdził
    offline_approved_at = Column(DateTime, nullable=True)
    offline_notes = Column(Text, nullable=True)
    
    # Relacje
    user = relationship("User", foreign_keys=[user_id])
    rental = relationship("Rental", back_populates="payments")
    approved_by_admin = relationship("User", foreign_keys=[offline_approved_by])
    
    @property
    def is_successful(self):
        """Sprawdza czy płatność została pomyślnie zrealizowana"""
        return self.status in [PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED]
    
    @property
    def can_be_refunded(self):
        """Sprawdza czy płatność może być zwrócona"""
        return self.status == PaymentStatus.COMPLETED and self.payment_method == PaymentMethod.STRIPE