from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum

class EquipmentCategory(str, Enum):
    EXCAVATION = "excavation"
    CONCRETE = "concrete"
    LIFTING = "lifting"
    CUTTING = "cutting"
    DRILLING = "drilling"
    POWER_TOOLS = "power_tools"
    HAND_TOOLS = "hand_tools"
    SAFETY = "safety"

class EquipmentStatus(str, Enum):
    AVAILABLE = "available"
    RENTED = "rented"
    MAINTENANCE = "maintenance"
    DAMAGED = "damaged"
    RETIRED = "retired"

# Schema do tworzenia sprzętu (admin)
class EquipmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: EquipmentCategory
    brand: Optional[str] = None
    model: Optional[str] = None
    daily_rate: Decimal
    weekly_rate: Optional[Decimal] = None
    monthly_rate: Optional[Decimal] = None
    weight: Optional[Decimal] = None
    dimensions: Optional[str] = None
    power_consumption: Optional[str] = None
    quantity_total: int = 1
    requires_license: bool = False
    min_age: int = 18
    
    @validator('daily_rate')
    def validate_daily_rate(cls, v):
        if v <= 0:
            raise ValueError('Cena dzienna musi być większa od 0')
        return v

# Schema do aktualizacji sprzętu
class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[EquipmentCategory] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    daily_rate: Optional[Decimal] = None
    weekly_rate: Optional[Decimal] = None
    monthly_rate: Optional[Decimal] = None
    status: Optional[EquipmentStatus] = None
    quantity_total: Optional[int] = None
    quantity_available: Optional[int] = None

# Schema odpowiedzi
class EquipmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: EquipmentCategory
    brand: Optional[str]
    model: Optional[str]
    daily_rate: Decimal
    weekly_rate: Optional[Decimal]
    monthly_rate: Optional[Decimal]
    weight: Optional[Decimal]
    dimensions: Optional[str]
    power_consumption: Optional[str]
    status: EquipmentStatus
    quantity_total: int
    quantity_available: int
    image_url: Optional[str]
    requires_license: bool
    min_age: int
    is_available: bool  # Property z modelu
    created_at: datetime
    
    class Config:
        from_attributes = True

# Lista sprzętu z paginacją
class EquipmentListResponse(BaseModel):
    items: List[EquipmentResponse]
    total: int
    page: int
    size: int
    pages: int