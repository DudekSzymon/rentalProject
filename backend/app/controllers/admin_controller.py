from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
import math

from ..database import get_db
from ..models.user import User, UserRole
from ..models.equipment import Equipment
from ..models.rental import Rental
from ..models.payment import Payment, PaymentStatus
from ..views.user_schemas import UserResponse
from ..views.payment_schemas import PaymentResponse, PaymentListResponse
from ..services.auth_service import auth_service

router = APIRouter()
security = HTTPBearer() #pozwala uwierzytelniać przesłany token

def require_admin(
   credentials: HTTPAuthorizationCredentials = Depends(security),
   db: Session = Depends(get_db)
) -> User:
   user = auth_service.get_current_user(credentials.credentials, db)
   auth_service.require_admin(user)
   return user

def _paginate(query, page: int, size: int):
    total = query.count()
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()
    pages = math.ceil(total / size) if total > 0 else 1
    return items, total, pages

def _enrich_payment_response(payment: Payment, db: Session) -> PaymentResponse: #dodatkowo dodaje nazwe uzytkownika i przedmiotu po id
    user = db.query(User).filter(User.id == payment.user_id).first()
    payment_dict = PaymentResponse.from_orm(payment).dict()
    payment_dict["user_email"] = user.email if user else None
    
    if payment.rental_id:
        rental = db.query(Rental).filter(Rental.id == payment.rental_id).first()
        if rental:
            equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
            payment_dict["rental_equipment_name"] = equipment.name if equipment else None
    
    return PaymentResponse(**payment_dict)

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
   search: Optional[str] = None,
   db: Session = Depends(get_db)
):
   query = db.query(User).filter(User.is_active == True)
   
   if search:
       search_term = f"%{search}%"
       query = query.filter(
           or_(
               func.lower(User.first_name).contains(search_term.lower()),
               func.lower(User.last_name).contains(search_term.lower()),
               func.lower(User.email).contains(search_term.lower())
           )
       )
   
   users= query.all()
   return [UserResponse.from_orm(user) for user in users]

@router.put("/users/{user_id}/block")
async def block_user(
   user_id: int,
   db: Session = Depends(get_db)
):
   user = db.query(User).filter(User.id == user_id).first()
   if not user:
       raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie znaleziony")
   
   if user.role == UserRole.ADMIN:
       raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nie można zablokować administratora")
   
   user.is_blocked = True
   db.commit()
   
   return {"message": f"Użytkownik {user.email} został zablokowany"}

@router.put("/users/{user_id}/unblock")
async def unblock_user(
   user_id: int,
   db: Session = Depends(get_db)
):
   user = db.query(User).filter(User.id == user_id).first()
   if not user:
       raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie znaleziony")
   
   user.is_blocked = False
   db.commit()
   
   return {"message": f"Użytkownik {user.email} został odblokowany"}

@router.get("/payments/pending", response_model=PaymentListResponse)
async def get_pending_payments(
   page: int = Query(1),
   size: int = Query(10),
   db: Session = Depends(get_db)
):
   query = db.query(Payment).filter(
       or_(Payment.status == PaymentStatus.PENDING, Payment.status == PaymentStatus.FAILED)
   ).order_by(Payment.created_at.asc())
   
   payments, total, pages = _paginate(query, page, size)
   items = [_enrich_payment_response(payment, db) for payment in payments]
   
   return PaymentListResponse(items=items, total=total, page=page, size=size, pages=pages)