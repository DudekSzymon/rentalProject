from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import math

from ..database import get_db
from ..models.user import User
from ..models.equipment import Equipment, EquipmentStatus
from ..models.rental import Rental, RentalStatus, RentalPeriod
from ..views.rental_schemas import (
    RentalCreate, RentalUpdate, RentalResponse, 
    RentalSummary, RentalListResponse
)
from ..services.auth_service import auth_service

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

@router.post("", response_model=RentalResponse)
async def create_rental(
    rental_data: RentalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Utworzenie nowego wypożyczenia"""
    
    # Sprawdzenie czy sprzęt istnieje i jest dostępny
    equipment = db.query(Equipment).filter(
        Equipment.id == rental_data.equipment_id,
        Equipment.is_active == True
    ).first()
    
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprzęt nie znaleziony"
        )
    
    if equipment.quantity_available < rental_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dostępne tylko {equipment.quantity_available} sztuk"
        )
    
    if equipment.status != EquipmentStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sprzęt nie jest dostępny do wypożyczenia"
        )
    
    # Obliczenie ceny
    duration_days = (rental_data.end_date - rental_data.start_date).days
    
    if rental_data.rental_period == RentalPeriod.DAILY:
        unit_price = equipment.daily_rate
        total_price = unit_price * duration_days * rental_data.quantity
    elif rental_data.rental_period == RentalPeriod.WEEKLY:
        weeks = math.ceil(duration_days / 7)
        unit_price = equipment.weekly_rate or equipment.daily_rate * 7
        total_price = unit_price * weeks * rental_data.quantity
    else:  # MONTHLY
        months = math.ceil(duration_days / 30)
        unit_price = equipment.monthly_rate or equipment.daily_rate * 30
        total_price = unit_price * months * rental_data.quantity
    
    # Tworzenie wypożyczenia
    new_rental = Rental(
        user_id=current_user.id,
        equipment_id=rental_data.equipment_id,
        start_date=rental_data.start_date,
        end_date=rental_data.end_date,
        quantity=rental_data.quantity,
        rental_period=rental_data.rental_period,
        unit_price=unit_price,
        total_price=total_price,
        deposit_amount=unit_price * 0.2,  # 20% kaucji
        notes=rental_data.notes,
        pickup_address=rental_data.pickup_address,
        return_address=rental_data.return_address,
        delivery_required=rental_data.delivery_required,
        status=RentalStatus.PENDING
    )
    
    db.add(new_rental)
    db.commit()
    db.refresh(new_rental)
    
    return RentalResponse.from_orm(new_rental)

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