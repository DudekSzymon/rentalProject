from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
import math

from ..database import get_db
from ..models.user import User
from ..models.equipment import Equipment
from ..models.rental import Rental, RentalStatus
from ..models.payment import Payment, PaymentStatus
from ..views.rental_schemas import (
    RentalCreate, RentalResponse, 
    RentalSummary, RentalListResponse
    
)
from ..services.auth_service import auth_service
from ..services.rental_service import rental_service

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
    db: Session = Depends(get_db)
):
    try:
        pricing = rental_service.get_pricing_preview(equipment_id, start_date, end_date, quantity, db)       #SPRAWDZIC RentalService(db)
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
        equipment = rental_service.check_equipment_availability(equipment_id, quantity, start_date, end_date, db)
        return {"available": True, "equipment_name": equipment.name}
    except HTTPException as e:
        return {"available": False, "error": e.detail, "equipment_name": None}

@router.post("", response_model=RentalResponse)
async def create_rental(
    rental_data: RentalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_rental = rental_service.create_rental(rental_data, current_user, db)
    return _enrich_rental_response(new_rental, db)

@router.get("", response_model=RentalListResponse)
async def get_my_rentals(
    page: int = Query(1),
    size: int = Query(10),
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
