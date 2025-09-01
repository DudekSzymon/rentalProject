from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from decimal import Decimal

from ..models.rental import Rental, RentalStatus
from ..models.equipment import Equipment, EquipmentStatus
from ..models.user import User
from ..models.payment import Payment, PaymentStatus, PaymentType
from ..views.rental_schemas import RentalCreate

# ZMIEŃ KONSTRUKTOR
class RentalService:
    def __init__(self):  # ← USUŃ db: Session
        pass  # ← USUŃ self.db = db
    
    def _normalize_datetime(self, dt: datetime) -> datetime:
        return dt.replace(tzinfo=None) if hasattr(dt, 'tzinfo') and dt.tzinfo else dt

    def validate_rental_dates(self, start_date: datetime, end_date: datetime) -> None:
        now = datetime.now()
        duration_days = (end_date - start_date).days

        if duration_days > 90:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maksymalna długość wypożyczenia to 90 dni"
            )
    
    def check_equipment_availability(
        self, 
        equipment_id: int, 
        quantity: int, 
        start_date: datetime, 
        end_date: datetime,
        db: Session  # ← DODAJ db jako parametr
    ) -> Equipment:
        equipment = db.query(Equipment).filter(  # ← ZMIEŃ self.db na db
            Equipment.id == equipment_id,
            Equipment.is_active == True
        ).first()

        if quantity > equipment.quantity_total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dostępne maksymalnie {equipment.quantity_total} sztuk"
            )
        
        conflicting_query = db.query(Rental).filter(  # ← ZMIEŃ self.db na db
            and_(
                Rental.equipment_id == equipment_id,
                Rental.status.in_([RentalStatus.PENDING, RentalStatus.CONFIRMED, RentalStatus.ACTIVE]),
                Rental.start_date < end_date,
                Rental.end_date > start_date
                )
        )
        
        conflicting_rentals = conflicting_query.all()
        occupied_quantity = sum(rental.quantity for rental in conflicting_rentals)
        available_quantity = equipment.quantity_total - occupied_quantity
        
        if quantity > available_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"W wybranym terminie dostępne tylko {available_quantity} sztuk"
            )
        
        return equipment
    
    def calculate_rental_price(
        self, 
        equipment: Equipment, 
        start_date: datetime, 
        end_date: datetime, 
        quantity: int
    ) -> dict:
        duration_days = max(1, (end_date - start_date).days)
        
        # Tylko rozliczenie dzienne
        unit_price = equipment.daily_rate
        
        subtotal = unit_price * duration_days * quantity
        deposit = unit_price * Decimal('0.2') * quantity
        total = subtotal + deposit
        
        return {
            "unit_price": unit_price,
            "quantity": quantity,
            "deposit_amount": deposit,
            "total_price": total,
            "duration_days": duration_days
        }
    
    def validate_user_eligibility(self, user: User, equipment: Equipment, db: Session) -> None:  # ← DODAJ db
        active_rentals = db.query(Rental).filter(  # ← ZMIEŃ self.db na db
            and_(
                Rental.user_id == user.id,
                Rental.status.in_([RentalStatus.PENDING, RentalStatus.CONFIRMED, RentalStatus.ACTIVE])
            )
        ).count()
        
        if active_rentals >= 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maksymalna liczba aktywnych wypożyczeń: 100"
            )
    
    def create_rental(self, rental_data: RentalCreate, user: User, db: Session) -> Rental:  # ← DODAJ db
        start_date = self._normalize_datetime(rental_data.start_date)
        end_date = self._normalize_datetime(rental_data.end_date)
        
        self.validate_rental_dates(start_date, end_date)
        
        equipment = self.check_equipment_availability(
            rental_data.equipment_id,
            rental_data.quantity,
            start_date,
            end_date,
            db  # ← DODAJ db
        )
        
        self.validate_user_eligibility(user, equipment, db)  # ← DODAJ db

        pricing = self.calculate_rental_price(
            equipment,
            start_date,
            end_date,
            rental_data.quantity
        )
        
        new_rental = Rental(
            user_id=user.id,
            equipment_id=rental_data.equipment_id,
            start_date=start_date,
            end_date=end_date,
            quantity=rental_data.quantity,
            unit_price=pricing["unit_price"],
            total_price=pricing["total_price"],
            deposit_amount=pricing["deposit_amount"],
            notes=rental_data.notes,
            status=RentalStatus.PENDING
        )
        
        try:
            db.add(new_rental)  # ← ZMIEŃ self.db na db
            db.commit()  # ← ZMIEŃ self.db na db
            db.refresh(new_rental)  # ← ZMIEŃ self.db na db
            return new_rental
        except Exception as e:
            db.rollback()  # ← ZMIEŃ self.db na db
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Błąd tworzenia wypożyczenia: {str(e)}"
            )
    
    def get_pricing_preview(
        self, 
        equipment_id: int, 
        start_date: datetime, 
        end_date: datetime, 
        quantity: int,
        db: Session  # ← DODAJ db
    ) -> dict:
        start_date = self._normalize_datetime(start_date)
        end_date = self._normalize_datetime(end_date)
        
        self.validate_rental_dates(start_date, end_date)
        
        equipment = self.check_equipment_availability(
            equipment_id, quantity, start_date, end_date, db  # ← DODAJ db
        )
        
        # Tylko dzienny okres rozliczenia
        pricing = self.calculate_rental_price(
            equipment, start_date, end_date, quantity
        )
        
        return {
            "equipment_name": equipment.name,
            "equipment_daily_rate": equipment.daily_rate,
            **pricing
        }

# ← DODAJ SINGLETON NA KOŃCU PLIKU
rental_service = RentalService()