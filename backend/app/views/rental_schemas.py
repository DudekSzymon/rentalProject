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

class RentalPeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

# Schema do tworzenia wypożyczenia
class RentalCreate(BaseModel):
    equipment_id: int
    start_date: datetime
    end_date: datetime
    quantity: int = 1
    rental_period: RentalPeriod = RentalPeriod.DAILY
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

# Schema do aktualizacji wypożyczenia (admin/user)
class RentalUpdate(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[RentalStatus] = None
    notes: Optional[str] = None
    admin_notes: Optional[str] = None
    pickup_address: Optional[str] = None
    return_address: Optional[str] = None
    condition_before: Optional[str] = None
    condition_after: Optional[str] = None
    late_fee: Optional[Decimal] = None
    damage_fee: Optional[Decimal] = None

# Schema odpowiedzi - skrócona (dla list)
class RentalSummary(BaseModel):
    id: int
    equipment_name: str
    start_date: datetime
    end_date: datetime
    status: RentalStatus
    total_price: Decimal
    created_at: datetime

# Schema odpowiedzi - pełna (dla szczegółów)
class RentalResponse(BaseModel):
    id: int
    user_id: int
    equipment_id: int
    start_date: datetime
    end_date: datetime
    actual_return_date: Optional[datetime]
    quantity: int
    rental_period: RentalPeriod
    unit_price: Decimal
    total_price: Decimal
    deposit_amount: Decimal
    late_fee: Decimal
    damage_fee: Decimal
    status: RentalStatus
    notes: Optional[str]
    admin_notes: Optional[str]
    pickup_address: Optional[str]
    return_address: Optional[str]
    delivery_required: bool
    condition_before: Optional[str]
    condition_after: Optional[str]
    duration_days: int  # Property z modelu
    final_amount: Decimal  # Property z modelu
    created_at: datetime
    updated_at: datetime
    
    # Relacje
    user_email: Optional[str] = None
    equipment_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Lista wypożyczeń
class RentalListResponse(BaseModel):
    items: List[RentalSummary]
    total: int
    page: int
    size: int
    pages: int
    # Dodaj te schemas na końcu pliku rental_schemas.py (po istniejących)

class RentalPricingPreview(BaseModel):
    equipment_name: str
    equipment_daily_rate: Decimal
    unit_price: Decimal
    billable_units: int
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

class RentalCalendarEvent(BaseModel):
    id: int
    start_date: datetime
    end_date: datetime
    quantity: int
    status: RentalStatus
    user_id: int

class EquipmentCalendarResponse(BaseModel):
    equipment: dict
    period: dict
    rentals: List[RentalCalendarEvent]