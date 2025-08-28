from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum

class RentalStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"

# Schema do tworzenia wypożyczenia - usunięto rental_period (zawsze dzienny)
class RentalCreate(BaseModel):
    equipment_id: int
    start_date: datetime
    end_date: datetime
    quantity: int = 1
    notes: Optional[str] = None
    pickup_address: Optional[str] = None
    return_address: Optional[str] = None
    delivery_required: bool = False
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('Data końca musi być po dacie rozpoczęcia')
        return v
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Ilość musi być większa od 0')
        return v
# Schema odpowiedzi - skrócona (dla list)
class RentalSummary(BaseModel):
    id: int
    equipment_name: str
    start_date: datetime
    end_date: datetime
    status: RentalStatus
    total_price: Decimal
    created_at: datetime

# Schema odpowiedzi - pełna (dla szczegółów) - usunięto nieużywane pola
class RentalResponse(BaseModel):
    id: int
    user_id: int
    equipment_id: int
    start_date: datetime
    end_date: datetime
    actual_return_date: Optional[datetime]
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    deposit_amount: Decimal
    status: RentalStatus
    notes: Optional[str]
    admin_notes: Optional[str]
    pickup_address: Optional[str]
    return_address: Optional[str]
    delivery_required: bool
    condition_before: Optional[str]
    condition_after: Optional[str]
    duration_days: int  # Property z modelu
    created_at: datetime
    updated_at: datetime
    
    # Relacje
    user_email: Optional[str] = None
    equipment_name: Optional[str] = None
    
    class Config:
        from_attributes = True
        
    # Opcjonalnie możesz dodać te pola jako computed
    @property
    def final_amount(self) -> Decimal:
        return self.total_price

# Lista wypożyczeń
class RentalListResponse(BaseModel):
    items: List[RentalSummary]
    total: int
    page: int
    size: int
    pages: int

# Uproszczony preview cennika - tylko dzienny
class RentalPricingPreview(BaseModel):
    equipment_name: str
    equipment_daily_rate: Decimal
    unit_price: Decimal
    billable_units: int  # liczba dni
    quantity: int
    subtotal: Decimal
    deposit_amount: Decimal
    total_price: Decimal
    duration_days: int

class EquipmentAvailabilityCheck(BaseModel):
    available: bool
    equipment_name: Optional[str]
    total_quantity: Optional[int]
    available_quantity: Optional[int]
    requested_quantity: Optional[int]
    error: Optional[str] = None
    conflicts: List[dict] = []
