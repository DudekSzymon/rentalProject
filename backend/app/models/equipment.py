from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from ..database import Base

class EquipmentCategory(str, Enum):
    EXCAVATION = "excavation"    # Kopanie (koparki, łopaty)
    CONCRETE = "concrete"        # Betonowanie (mieszalki, wibratory)
    LIFTING = "lifting"          # Podnoszenie (dźwigi, wciągarki)
    CUTTING = "cutting"          # Cięcie (piły, szlifierki)
    DRILLING = "drilling"        # Wiercenie (wiertarki, młoty)
    POWER_TOOLS = "power_tools"  # Narzędzia elektryczne
    HAND_TOOLS = "hand_tools"    # Narzędzia ręczne
    SAFETY = "safety"            # Bezpieczeństwo (rusztowania, hełmy)

class EquipmentStatus(str, Enum):
    AVAILABLE = "available"
    RENTED = "rented" 
    MAINTENANCE = "maintenance"
    DAMAGED = "damaged"
    RETIRED = "retired"

class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(EquipmentCategory), nullable=False)
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    
    # Ceny wypożyczenia
    daily_rate = Column(Numeric(10, 2), nullable=False)  # Cena za dzień
    weekly_rate = Column(Numeric(10, 2), nullable=True)  # Cena za tydzień
    monthly_rate = Column(Numeric(10, 2), nullable=True) # Cena za miesiąc
    
    # Szczegóły techniczne
    weight = Column(Numeric(8, 2), nullable=True)      # Waga w kg
    dimensions = Column(String(100), nullable=True)     # Wymiary
    power_consumption = Column(String(50), nullable=True) # Pobór mocy
    
    # Status i dostępność
    status = Column(SQLEnum(EquipmentStatus), default=EquipmentStatus.AVAILABLE)
    quantity_total = Column(Integer, default=1)
    quantity_available = Column(Integer, default=1)
    
    # Zdjęcia i dokumenty
    image_url = Column(String(500), nullable=True)
    manual_url = Column(String(500), nullable=True)  # Link do instrukcji
    
    # Wymagania bezpieczeństwa
    requires_license = Column(Boolean, default=False)
    min_age = Column(Integer, default=18)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relacje
    rentals = relationship("Rental", back_populates="equipment")
    
    @property
    def is_available(self):
        return self.status == EquipmentStatus.AVAILABLE and self.quantity_available > 0