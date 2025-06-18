from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
import math

from ..database import get_db
from ..models.user import User
from ..models.equipment import Equipment, EquipmentStatus
from ..models.rental import Rental, RentalStatus, RentalPeriod
from ..models.payment import Payment, PaymentStatus
from ..views.rental_schemas import (
    RentalCreate, RentalUpdate, RentalResponse, 
    RentalSummary, RentalListResponse, RentalPricingPreview,
    EquipmentAvailabilityCheck, RentalCalendarEvent, EquipmentCalendarResponse
)
from ..services.auth_service import auth_service
from ..services.rental_service import RentalService

router = APIRouter()
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency do pobierania aktualnego użytkownika"""
    return auth_service.get_current_user(credentials.credentials, db)

def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency wymagające uprawnień administratora"""
    auth_service.require_admin(current_user)
    return current_user

# ========== NOWE ENDPOINTY ==========

@router.get("/pricing-preview")
async def get_rental_pricing_preview(
    equipment_id: int,
    start_date: datetime,
    end_date: datetime,
    quantity: int = 1,
    rental_period: RentalPeriod = RentalPeriod.DAILY,
    db: Session = Depends(get_db)
):
    """Podgląd ceny wypożyczenia bez tworzenia"""
    
    rental_service = RentalService(db)
    
    try:
        pricing = rental_service.get_pricing_preview(
            equipment_id=equipment_id,
            start_date=start_date,
            end_date=end_date,
            quantity=quantity,
            rental_period=rental_period
        )
        
        return {
            "success": True,
            "pricing": pricing,
            "message": "Cennik obliczony pomyślnie"
        }
        
    except HTTPException as e:
        return {
            "success": False,
            "error": e.detail,
            "pricing": None
        }

@router.get("/check-availability")
async def check_equipment_availability(
    equipment_id: int,
    start_date: datetime,
    end_date: datetime,
    quantity: int = 1,
    db: Session = Depends(get_db)
):
    """Sprawdzenie dostępności sprzętu w danym terminie"""
    
    rental_service = RentalService(db)
    
    try:
        equipment = rental_service.check_equipment_availability(
            equipment_id=equipment_id,
            quantity=quantity,
            start_date=start_date,
            end_date=end_date
        )
        
        # Znajdź konflikty dla informacji
        conflicting_rentals = db.query(Rental).filter(
            and_(
                Rental.equipment_id == equipment_id,
                Rental.status.in_([RentalStatus.PENDING, RentalStatus.CONFIRMED, RentalStatus.ACTIVE]),
                or_(
                    and_(Rental.start_date <= start_date, Rental.end_date > start_date),
                    and_(Rental.start_date < end_date, Rental.end_date >= end_date),
                    and_(Rental.start_date >= start_date, Rental.end_date <= end_date),
                    and_(Rental.start_date <= start_date, Rental.end_date >= end_date)
                )
            )
        ).all()
        
        occupied_quantity = sum(rental.quantity for rental in conflicting_rentals)
        available_quantity = equipment.quantity_total - occupied_quantity
        
        return {
            "available": True,
            "equipment_name": equipment.name,
            "total_quantity": equipment.quantity_total,
            "available_quantity": available_quantity,
            "requested_quantity": quantity,
            "conflicts": [
                {
                    "rental_id": rental.id,
                    "start_date": rental.start_date,
                    "end_date": rental.end_date,
                    "quantity": rental.quantity,
                    "status": rental.status
                }
                for rental in conflicting_rentals
            ]
        }
        
    except HTTPException as e:
        return {
            "available": False,
            "error": e.detail,
            "equipment_name": None,
            "conflicts": []
        }

@router.get("/equipment/{equipment_id}/calendar")
async def get_equipment_calendar(
    equipment_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """Kalendarz zajętości sprzętu"""
    
    # Domyślnie pokaż najbliższe 3 miesiące
    if not start_date:
        start_date = datetime.now().date()
    if not end_date:
        end_date = start_date + timedelta(days=90)
    
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.is_active == True
    ).first()
    
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprzęt nie znaleziony"
        )
    
    # Pobierz wszystkie wypożyczenia w tym okresie
    rentals = db.query(Rental).filter(
        and_(
            Rental.equipment_id == equipment_id,
            Rental.status.in_([RentalStatus.PENDING, RentalStatus.CONFIRMED, RentalStatus.ACTIVE]),
            Rental.start_date <= end_date,
            Rental.end_date >= start_date
        )
    ).order_by(Rental.start_date).all()
    
    return {
        "equipment": {
            "id": equipment.id,
            "name": equipment.name,
            "total_quantity": equipment.quantity_total
        },
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "rentals": [
            {
                "id": rental.id,
                "start_date": rental.start_date,
                "end_date": rental.end_date,
                "quantity": rental.quantity,
                "status": rental.status,
                "user_id": rental.user_id
            }
            for rental in rentals
        ]
    }

@router.post("/{rental_id}/confirm")
async def confirm_rental(
    rental_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Potwierdzenie wypożyczenia przez administratora"""
    
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wypożyczenie nie znalezione"
        )
    
    if rental.status != RentalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Wypożyczenie ma status {rental.status}, można potwierdzić tylko PENDING"
        )
    
    # Sprawdź czy płatność została opłacona
    successful_payment = db.query(Payment).filter(
        and_(
            Payment.rental_id == rental_id,
            Payment.status.in_([PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED])
        )
    ).first()
    
    if not successful_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wypożyczenie nie może być potwierdzone - brak opłaconej płatności"
        )
    
    # Ponownie sprawdź dostępność (mogło się coś zmienić)
    rental_service = RentalService(db)
    try:
        rental_service.check_equipment_availability(
            rental.equipment_id,
            rental.quantity,
            rental.start_date,
            rental.end_date,
            exclude_rental_id=rental_id
        )
    except HTTPException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sprzęt nie jest już dostępny: {e.detail}"
        )
    
    # Potwierdź wypożyczenie
    rental.status = RentalStatus.CONFIRMED
    
    # Zaktualizuj dostępność sprzętu
    equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
    equipment.quantity_available -= rental.quantity
    
    db.commit()
    
    return {
        "message": "Wypożyczenie zostało potwierdzone",
        "rental_id": rental_id,
        "new_status": rental.status
    }

# ========== POPRAWIONE ISTNIEJĄCE ENDPOINTY ==========

@router.post("", response_model=RentalResponse)
async def create_rental(
    rental_data: RentalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Utworzenie nowego wypożyczenia z pełną walidacją"""
    
    rental_service = RentalService(db)
    
    try:
        # Użyj service do utworzenia wypożyczenia
        new_rental = rental_service.create_rental(rental_data, current_user)
        
        # Dodaj informacje o użytkowniku i sprzęcie do odpowiedzi
        user = db.query(User).filter(User.id == new_rental.user_id).first()
        equipment = db.query(Equipment).filter(Equipment.id == new_rental.equipment_id).first()
        
        rental_dict = RentalResponse.from_orm(new_rental).dict()
        rental_dict["user_email"] = user.email if user else None
        rental_dict["equipment_name"] = equipment.name if equipment else None
        
        return RentalResponse(**rental_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Nieoczekiwany błąd: {str(e)}"
        )

@router.get("", response_model=RentalListResponse)
async def get_my_rentals(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[RentalStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pobranie moich wypożyczeń"""
    
    query = db.query(Rental).filter(Rental.user_id == current_user.id)
    
    if status:
        query = query.filter(Rental.status == status)
    
    # Paginacja
    total = query.count()
    offset = (page - 1) * size
    rentals = query.order_by(Rental.created_at.desc()).offset(offset).limit(size).all()
    
    # Konwersja na RentalSummary
    items = []
    for rental in rentals:
        equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
        items.append(RentalSummary(
            id=rental.id,
            equipment_name=equipment.name if equipment else "Nieznany",
            start_date=rental.start_date,
            end_date=rental.end_date,
            status=rental.status,
            total_price=rental.total_price,
            created_at=rental.created_at
        ))
    
    pages = math.ceil(total / size) if total > 0 else 1
    
    return RentalListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/{rental_id}", response_model=RentalResponse)
async def get_rental(
    rental_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pobranie szczegółów wypożyczenia"""
    
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wypożyczenie nie znalezione"
        )
    
    # Sprawdzenie uprawnień (własne wypożyczenie lub admin)
    if rental.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do tego wypożyczenia"
        )
    
    # Dodanie informacji o użytkowniku i sprzęcie
    user = db.query(User).filter(User.id == rental.user_id).first()
    equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
    
    rental_dict = RentalResponse.from_orm(rental).dict()
    rental_dict["user_email"] = user.email if user else None
    rental_dict["equipment_name"] = equipment.name if equipment else None
    
    return RentalResponse(**rental_dict)

@router.put("/{rental_id}", response_model=RentalResponse)
async def update_rental(
    rental_id: int,
    rental_data: RentalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aktualizacja wypożyczenia"""
    
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wypożyczenie nie znalezione"
        )
    
    # Sprawdzenie uprawnień
    is_owner = rental.user_id == current_user.id
    is_admin = current_user.role == "admin"
    
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do edycji tego wypożyczenia"
        )
    
    # Ograniczenia dla zwykłych użytkowników
    if is_owner and not is_admin:
        # Użytkownik może edytować tylko niektóre pola przed potwierdzeniem
        if rental.status not in [RentalStatus.PENDING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Można edytować tylko oczekujące wypożyczenia"
            )
        
        # Ograniczone pola dla użytkownika
        allowed_fields = {"notes", "pickup_address", "return_address"}
        update_fields = set(rental_data.dict(exclude_unset=True).keys())
        
        if not update_fields.issubset(allowed_fields):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Można edytować tylko notatki i adresy"
            )
    
    # Aktualizacja pól
    for field, value in rental_data.dict(exclude_unset=True).items():
        setattr(rental, field, value)
    
    # Aktualizacja dostępności sprzętu przy zmianie statusu
    if rental_data.status:
        equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
        
        if rental_data.status == RentalStatus.CONFIRMED and rental.status == RentalStatus.PENDING:
            # Rezerwacja sprzętu
            equipment.quantity_available -= rental.quantity
        elif rental_data.status in [RentalStatus.COMPLETED, RentalStatus.CANCELLED] and rental.status in [RentalStatus.CONFIRMED, RentalStatus.ACTIVE]:
            # Zwrot sprzętu
            equipment.quantity_available += rental.quantity
    
    db.commit()
    db.refresh(rental)
    
    return RentalResponse.from_orm(rental)

@router.delete("/{rental_id}")
async def cancel_rental(
    rental_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Anulowanie wypożyczenia"""
    
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wypożyczenie nie znalezione"
        )
    
    # Sprawdzenie uprawnień
    if rental.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do anulowania tego wypożyczenia"
        )
    
    # Można anulować tylko oczekujące wypożyczenia
    if rental.status not in [RentalStatus.PENDING, RentalStatus.CONFIRMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Można anulować tylko oczekujące lub potwierdzone wypożyczenia"
        )
    
    rental.status = RentalStatus.CANCELLED
    
    # Zwrot dostępności sprzętu jeśli było potwierdzone
    if rental.status == RentalStatus.CONFIRMED:
        equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
        equipment.quantity_available += rental.quantity
    
    db.commit()
    
    return {"message": "Wypożyczenie zostało anulowane"}