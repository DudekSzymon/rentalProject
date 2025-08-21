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
    return auth_service.get_current_user(credentials.credentials, db)

def require_admin(current_user: User = Depends(get_current_user)):
    auth_service.require_admin(current_user)
    return current_user

def _get_rental_or_404(rental_id: int, db: Session) -> Rental:
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wypożyczenie nie znalezione")
    return rental

def _check_rental_access(rental: Rental, current_user: User):
    if rental.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do tego wypożyczenia")

def _get_equipment(equipment_id: int, db: Session) -> Equipment:
    return db.query(Equipment).filter(Equipment.id == equipment_id).first()

def _enrich_rental_response(rental: Rental, db: Session) -> RentalResponse:
    user = db.query(User).filter(User.id == rental.user_id).first()
    equipment = _get_equipment(rental.equipment_id, db)
    
    rental_dict = RentalResponse.from_orm(rental).dict()
    rental_dict["user_email"] = user.email if user else None
    rental_dict["equipment_name"] = equipment.name if equipment else None
    
    return RentalResponse(**rental_dict)

@router.get("/pricing-preview")
async def get_rental_pricing_preview(
    equipment_id: int,
    start_date: datetime,
    end_date: datetime,
    quantity: int = 1,
    rental_period: RentalPeriod = RentalPeriod.DAILY,
    db: Session = Depends(get_db)
):
    try:
        pricing = RentalService(db).get_pricing_preview(equipment_id, start_date, end_date, quantity, rental_period)
        return {"success": True, "pricing": pricing, "message": "Cennik obliczony pomyślnie"}
    except HTTPException as e:
        return {"success": False, "error": e.detail, "pricing": None}

@router.get("/check-availability")
async def check_equipment_availability(
    equipment_id: int,
    start_date: datetime,
    end_date: datetime,
    quantity: int = 1,
    db: Session = Depends(get_db)
):
    try:
        equipment = RentalService(db).check_equipment_availability(equipment_id, quantity, start_date, end_date)
        return {"available": True, "equipment_name": equipment.name}
    except HTTPException as e:
        return {"available": False, "error": e.detail, "equipment_name": None}

@router.get("/equipment/{equipment_id}/calendar")
async def get_equipment_calendar(
    equipment_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = datetime.now().date()
    if not end_date:
        end_date = start_date + timedelta(days=90)
    
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id, Equipment.is_active == True).first()
    if not equipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprzęt nie znaleziony")
    
    rentals = db.query(Rental).filter(
        and_(
            Rental.equipment_id == equipment_id,
            Rental.status.in_([RentalStatus.PENDING, RentalStatus.CONFIRMED, RentalStatus.ACTIVE]),
            Rental.start_date <= end_date,
            Rental.end_date >= start_date
        )
    ).order_by(Rental.start_date).all()
    
    return {
        "equipment": {"id": equipment.id, "name": equipment.name, "total_quantity": equipment.quantity_total},
        "period": {"start_date": start_date, "end_date": end_date},
        "rentals": [
            {"id": r.id, "start_date": r.start_date, "end_date": r.end_date, 
             "quantity": r.quantity, "status": r.status, "user_id": r.user_id}
            for r in rentals
        ]
    }

@router.post("/{rental_id}/confirm")
async def confirm_rental(
    rental_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    rental = _get_rental_or_404(rental_id, db)
    
    if rental.status != RentalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Wypożyczenie ma status {rental.status}, można potwierdzić tylko PENDING"
        )
    
    if not db.query(Payment).filter(
        and_(
            Payment.rental_id == rental_id,
            Payment.status.in_([PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED])
        )
    ).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wypożyczenie nie może być potwierdzone - brak opłaconej płatności"
        )
    
    try:
        RentalService(db).check_equipment_availability(
            rental.equipment_id, rental.quantity, rental.start_date, rental.end_date, exclude_rental_id=rental_id
        )
    except HTTPException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sprzęt nie jest już dostępny: {e.detail}"
        )
    
    rental.status = RentalStatus.CONFIRMED
    equipment = _get_equipment(rental.equipment_id, db)
    equipment.quantity_available -= rental.quantity
    db.commit()
    
    return {"message": "Wypożyczenie zostało potwierdzone", "rental_id": rental_id, "new_status": rental.status}

@router.post("", response_model=RentalResponse)
async def create_rental(
    rental_data: RentalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_rental = RentalService(db).create_rental(rental_data, current_user)
    return _enrich_rental_response(new_rental, db)

@router.get("", response_model=RentalListResponse)
async def get_my_rentals(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[RentalStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Rental).filter(Rental.user_id == current_user.id)
    
    if status:
        query = query.filter(Rental.status == status)
    
    total = query.count()
    offset = (page - 1) * size
    rentals = query.order_by(Rental.created_at.desc()).offset(offset).limit(size).all()
    
    items = [
        RentalSummary(
            id=rental.id,
            equipment_name=_get_equipment(rental.equipment_id, db).name if _get_equipment(rental.equipment_id, db) else "Nieznany",
            start_date=rental.start_date,
            end_date=rental.end_date,
            status=rental.status,
            total_price=rental.total_price,
            created_at=rental.created_at
        )
        for rental in rentals
    ]
    
    return RentalListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1
    )

@router.get("/{rental_id}", response_model=RentalResponse)
async def get_rental(
    rental_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rental = _get_rental_or_404(rental_id, db)
    _check_rental_access(rental, current_user)
    return _enrich_rental_response(rental, db)

@router.put("/{rental_id}", response_model=RentalResponse)
async def update_rental(
    rental_id: int,
    rental_data: RentalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rental = _get_rental_or_404(rental_id, db)
    is_admin = current_user.role == "admin"
    
    if rental.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do edycji tego wypożyczenia")
    
    if rental.user_id == current_user.id and not is_admin:
        if rental.status != RentalStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Można edytować tylko oczekujące wypożyczenia")
        
        allowed_fields = {"notes", "pickup_address", "return_address"}
        if not set(rental_data.dict(exclude_unset=True).keys()).issubset(allowed_fields):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Można edytować tylko notatki i adresy")
    
    for field, value in rental_data.dict(exclude_unset=True).items():
        setattr(rental, field, value)
    
    if rental_data.status:
        equipment = _get_equipment(rental.equipment_id, db)
        
        if rental_data.status == RentalStatus.CONFIRMED and rental.status == RentalStatus.PENDING:
            equipment.quantity_available -= rental.quantity
        elif rental_data.status in [RentalStatus.COMPLETED, RentalStatus.CANCELLED] and rental.status in [RentalStatus.CONFIRMED, RentalStatus.ACTIVE]:
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
    rental = _get_rental_or_404(rental_id, db)
    _check_rental_access(rental, current_user)
    
    if rental.status not in [RentalStatus.PENDING, RentalStatus.CONFIRMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Można anulować tylko oczekujące lub potwierdzone wypożyczenia"
        )
    
    old_status = rental.status
    rental.status = RentalStatus.CANCELLED
    
    if old_status == RentalStatus.CONFIRMED:
        equipment = _get_equipment(rental.equipment_id, db)
        equipment.quantity_available += rental.quantity
    
    db.commit()
    
    return {"message": "Wypożyczenie zostało anulowane"}