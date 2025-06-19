from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from decimal import Decimal

from ..models.rental import Rental, RentalStatus, RentalPeriod
from ..models.equipment import Equipment, EquipmentStatus
from ..models.user import User
from ..models.payment import Payment, PaymentStatus, PaymentType
from ..views.rental_schemas import RentalCreate

class RentalService:
    """Service class for rental business logic"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_rental_dates(self, start_date: datetime, end_date: datetime) -> None:
        """Walidacja dat wypożyczenia"""
        now = datetime.now()
        
        # Data rozpoczęcia nie może być w przeszłości (z tolerancją 1 godzina)
        if start_date.date() < now.date():  # Porównuj tylko daty, bez godzin
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data rozpoczęcia nie może być w przeszłości"
    )
        
        # Data zakończenia musi być po dacie rozpoczęcia
        if end_date <= start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Data zakończenia musi być późniejsza niż data rozpoczęcia"
            )
        
        # Minimalna długość wypożyczenia: 1 dzień
        if (end_date - start_date).days < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Minimalna długość wypożyczenia to 1 dzień"
            )
        
        # Maksymalna długość wypożyczenia: 90 dni
        if (end_date - start_date).days > 90:
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
        exclude_rental_id: Optional[int] = None
    ) -> Equipment:
        """Sprawdzenie dostępności sprzętu w danym terminie"""
        
        equipment = self.db.query(Equipment).filter(
            Equipment.id == equipment_id,
            Equipment.is_active == True
        ).first()
        
        if not equipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sprzęt nie znaleziony"
            )
        
        if equipment.status != EquipmentStatus.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sprzęt jest w statusie: {equipment.status}"
            )
        
        if quantity > equipment.quantity_total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dostępne maksymalnie {equipment.quantity_total} sztuk"
            )
        
        # Sprawdź konflikty z istniejącymi wypożyczeniami
        conflicting_query = self.db.query(Rental).filter(
            and_(
                Rental.equipment_id == equipment_id,
                Rental.status.in_([
                    RentalStatus.PENDING, 
                    RentalStatus.CONFIRMED, 
                    RentalStatus.ACTIVE
                ]),
                or_(
                    # Nowe wypożyczenie rozpoczyna się podczas istniejącego
                    and_(Rental.start_date <= start_date, Rental.end_date > start_date),
                    # Nowe wypożyczenie kończy się podczas istniejącego
                    and_(Rental.start_date < end_date, Rental.end_date >= end_date),
                    # Istniejące wypożyczenie jest w środku nowego
                    and_(Rental.start_date >= start_date, Rental.end_date <= end_date),
                    # Nowe wypożyczenie jest w środku istniejącego
                    and_(Rental.start_date <= start_date, Rental.end_date >= end_date)
                )
            )
        )
        
        if exclude_rental_id:
            conflicting_query = conflicting_query.filter(Rental.id != exclude_rental_id)
        
        conflicting_rentals = conflicting_query.all()
        
        # Oblicz zajętą ilość w konflikcie czasowym
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
        quantity: int, 
        rental_period: RentalPeriod
    ) -> dict:
        """Obliczenie ceny wypożyczenia"""
        
        duration_days = (end_date - start_date).days
        if duration_days == 0:
            duration_days = 1  # Minimum 1 dzień
        
        # Wybór odpowiedniej stawki
        if rental_period == RentalPeriod.DAILY:
            unit_price = equipment.daily_rate
            billable_units = duration_days
            
        elif rental_period == RentalPeriod.WEEKLY:
            unit_price = equipment.weekly_rate or (equipment.daily_rate * 7)
            billable_units = max(1, (duration_days + 6) // 7)  # Zaokrąglenie w górę
            
        elif rental_period == RentalPeriod.MONTHLY:
            unit_price = equipment.monthly_rate or (equipment.daily_rate * 30)
            billable_units = max(1, (duration_days + 29) // 30)  # Zaokrąglenie w górę
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nieprawidłowy okres rozliczeniowy"
            )
        
        # Obliczenia
        subtotal = unit_price * billable_units * quantity
        deposit = unit_price * Decimal('0.2')  # 20% kaucji od ceny jednostkowej
        total_price = subtotal
        
        return {
            "unit_price": unit_price,
            "billable_units": billable_units,
            "quantity": quantity,
            "subtotal": subtotal,
            "deposit_amount": deposit * quantity,
            "total_price": total_price,
            "duration_days": duration_days
        }
    
    def validate_user_eligibility(self, user: User, equipment: Equipment) -> None:
        """Sprawdzenie uprawnień użytkownika do wypożyczenia"""
        print(f"🔧 VALIDATING USER: {user.email}, verified: {user.is_verified}, blocked: {user.is_blocked}")
        
        if user.is_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Konto użytkownika zostało zablokowane"
            )
        
        # Sprawdź limity wypożyczeń użytkownika
        active_rentals = self.db.query(Rental).filter(
            and_(
                Rental.user_id == user.id,
                Rental.status.in_([RentalStatus.PENDING, RentalStatus.CONFIRMED, RentalStatus.ACTIVE])
            )
        ).count()
        
        MAX_ACTIVE_RENTALS = 100  # Maksymalnie 5 aktywnych wypożyczeń
        if active_rentals >= MAX_ACTIVE_RENTALS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maksymalna liczba aktywnych wypożyczeń: {MAX_ACTIVE_RENTALS}"
            )
    
    def create_rental(self, rental_data: RentalCreate, user: User) -> Rental:
        """Główna metoda tworzenia wypożyczenia"""
        start_date = rental_data.start_date
        end_date = rental_data.end_date
        if hasattr(start_date, 'tzinfo') and start_date.tzinfo:
            start_date = start_date.replace(tzinfo=None)
        if hasattr(end_date, 'tzinfo') and end_date.tzinfo:
            end_date = end_date.replace(tzinfo=None)
        
        # 1. Walidacja dat
        self.validate_rental_dates(start_date, end_date)
        
        # 2. Sprawdzenie dostępności sprzętu
        equipment = self.check_equipment_availability(
            rental_data.equipment_id,
            rental_data.quantity,
            start_date,
            end_date
        )
        
        # 3. Walidacja uprawnień użytkownika
        self.validate_user_eligibility(user, equipment)
        
        # 4. Obliczenie ceny
        pricing = self.calculate_rental_price(
            equipment,
            start_date,
            end_date,
            rental_data.quantity,
            rental_data.rental_period
        )
        
        # 5. Utworzenie wypożyczenia
        new_rental = Rental(
            user_id=user.id,
            equipment_id=rental_data.equipment_id,
            start_date=start_date,
            end_date=end_date,
            quantity=rental_data.quantity,
            rental_period=rental_data.rental_period,
            unit_price=pricing["unit_price"],
            total_price=pricing["total_price"],
            deposit_amount=pricing["deposit_amount"],
            notes=rental_data.notes,
            pickup_address=rental_data.pickup_address,
            return_address=rental_data.return_address,
            delivery_required=rental_data.delivery_required,
            status=RentalStatus.PENDING
        )
        
        try:
            self.db.add(new_rental)
            self.db.commit()
            self.db.refresh(new_rental)
            
            return new_rental
            
        except Exception as e:
            self.db.rollback()
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
        rental_period: RentalPeriod
    ) -> dict:
        """Podgląd ceny bez tworzenia wypożyczenia"""
        if hasattr(start_date, 'tzinfo') and start_date.tzinfo:
            start_date = start_date.replace(tzinfo=None)
        if hasattr(end_date, 'tzinfo') and end_date.tzinfo:
            end_date = end_date.replace(tzinfo=None)
        
        self.validate_rental_dates(start_date, end_date)
        
        equipment = self.check_equipment_availability(
            equipment_id, quantity, start_date, end_date
        )
        
        pricing = self.calculate_rental_price(
            equipment, start_date, end_date, quantity, rental_period
        )
        
        return {
            "equipment_name": equipment.name,
            "equipment_daily_rate": equipment.daily_rate,
            **pricing
        }