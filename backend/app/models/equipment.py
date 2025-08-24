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
    RETIRED = "retired"

class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(EquipmentCategory), nullable=False)
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    
    # Tylko cena dzienna
    daily_rate = Column(Numeric(10, 2), nullable=False)
    
    # Status i dostępność
    status = Column(SQLEnum(EquipmentStatus), default=EquipmentStatus.AVAILABLE)
    quantity_total = Column(Integer, default=1)
    quantity_available = Column(Integer, default=1)
    
    # Tylko zdjęcie - usunięto manual_url
    image_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relacje
    rentals = relationship("Rental", back_populates="equipment")
    
    @property
    def is_available(self):
        return self.status == EquipmentStatus.AVAILABLE and self.quantity_available > 0