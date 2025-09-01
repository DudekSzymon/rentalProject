from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    OFFLINE_APPROVED = "offline_approved"

class PaymentType(str, Enum):
    RENTAL = "rental"
    DEPOSIT = "deposit"
    LATE_FEE = "late_fee"
    DAMAGE_FEE = "damage_fee"

# Schema do tworzenia płatności
class PaymentCreate(BaseModel):
    rental_id: Optional[int] = None
    amount: Decimal
    payment_type: PaymentType = PaymentType.RENTAL
    description: Optional[str] = None
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Kwota musi być większa od 0')
        return v

# Stripe payment intent
class StripePaymentCreate(BaseModel):
    rental_id: Optional [int] = None
    amount: Decimal
    currency: str = "pln"
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Kwota musi być większa od 0')
        if v < Decimal('0.50'):
            raise ValueError('Minimalna kwota płatności to 0.50')
        return v
    
    @validator('currency')
    def validate_currency(cls, v):
        allowed_currencies = ['pln', 'eur', 'usd', 'gbp']
        if v.lower() not in allowed_currencies:
            raise ValueError(f'Obsługiwane waluty: {", ".join(allowed_currencies)}')
        return v.lower()


# Schema dla offline approval (admin)
class OfflinePaymentApproval(BaseModel):
    payment_id: int
    notes: Optional[str] = None

# Schema odpowiedzi
class PaymentResponse(BaseModel):
    id: int
    user_id: int
    rental_id: Optional[int]
    amount: Decimal
    currency: str
    payment_type: PaymentType
    status: PaymentStatus
    external_id: Optional[str]
    description: Optional[str]
    failure_reason: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]
    offline_approved_by: Optional[int]
    offline_approved_at: Optional[datetime]
    offline_notes: Optional[str]
    is_successful: bool  # Property z modelu
    
    # Relacje
    user_email: Optional[str] = None
    rental_equipment_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Stripe response
class StripePaymentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: Decimal
    currency: str
    payment_id: int

# Lista płatności
class PaymentListResponse(BaseModel):
    items: List[PaymentResponse]
    total: int
    page: int
    size: int
    pages: int

class StripeConfigResponse(BaseModel):
    publishable_key: str
    currency: str = "pln"
    class Config:
        from_attributes = True