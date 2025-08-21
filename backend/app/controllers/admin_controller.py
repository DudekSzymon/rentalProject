from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import math

from ..database import get_db
from ..models.user import User, UserRole
from ..models.equipment import Equipment, EquipmentStatus
from ..models.rental import Rental, RentalStatus
from ..models.payment import Payment, PaymentStatus
from ..views.user_schemas import UserResponse
from ..views.equipment_schemas import EquipmentResponse, EquipmentListResponse
from ..views.rental_schemas import RentalResponse, RentalListResponse
from ..views.payment_schemas import PaymentResponse, PaymentListResponse
from ..services.auth_service import auth_service

router = APIRouter()
security = HTTPBearer()

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

def _enrich_rental_response(rental: Rental, db: Session) -> RentalResponse:
    user = db.query(User).filter(User.id == rental.user_id).first()
    equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
    
    rental_dict = RentalResponse.from_orm(rental).dict()
    rental_dict["user_email"] = user.email if user else None
    rental_dict["equipment_name"] = equipment.name if equipment else None
    
    return RentalResponse(**rental_dict)

def _enrich_payment_response(payment: Payment, db: Session) -> PaymentResponse:
    user = db.query(User).filter(User.id == payment.user_id).first()
    payment_dict = PaymentResponse.from_orm(payment).dict()
    payment_dict["user_email"] = user.email if user else None
    
    if payment.rental_id:
        rental = db.query(Rental).filter(Rental.id == payment.rental_id).first()
        if rental:
            equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
            payment_dict["rental_equipment_name"] = equipment.name if equipment else None
    
    return PaymentResponse(**payment_dict)

@router.get("/dashboard")
async def get_admin_dashboard(
   admin_user: User = Depends(require_admin),
   db: Session = Depends(get_db)
):
   now = datetime.now()
   month_start = now.replace(day=1)
   successful_payments = [PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED]
   
   total_users = db.query(User).filter(User.is_active == True).count()
   new_users_this_month = db.query(User).filter(User.created_at >= month_start).count()
   
   total_equipment = db.query(Equipment).filter(Equipment.is_active == True).count()
   available_equipment = db.query(Equipment).filter(
       and_(Equipment.is_active == True, Equipment.status == EquipmentStatus.AVAILABLE)
   ).count()
   rented_equipment = db.query(Equipment).filter(Equipment.status == EquipmentStatus.RENTED).count()
   
   total_rentals = db.query(Rental).count()
   active_rentals = db.query(Rental).filter(Rental.status == RentalStatus.ACTIVE).count()
   pending_rentals = db.query(Rental).filter(Rental.status == RentalStatus.PENDING).count()
   overdue_rentals = db.query(Rental).filter(
       and_(
           Rental.status.in_([RentalStatus.ACTIVE, RentalStatus.CONFIRMED]),
           Rental.end_date < now
       )
   ).count()
   
   total_revenue = db.query(func.sum(Payment.amount)).filter(
       Payment.status.in_(successful_payments)
   ).scalar() or 0
   
   this_month_revenue = db.query(func.sum(Payment.amount)).filter(
       and_(Payment.status.in_(successful_payments), Payment.processed_at >= month_start)
   ).scalar() or 0
   
   pending_payments = db.query(Payment).filter(Payment.status == PaymentStatus.PENDING).count()
   failed_payments = db.query(Payment).filter(Payment.status == PaymentStatus.FAILED).count()
   
   return {
       "users": {"total": total_users, "new_this_month": new_users_this_month},
       "equipment": {
           "total": total_equipment,
           "available": available_equipment,
           "rented": rented_equipment,
           "utilization_rate": round((rented_equipment / total_equipment * 100) if total_equipment > 0 else 0, 2)
       },
       "rentals": {"total": total_rentals, "active": active_rentals, "pending": pending_rentals, "overdue": overdue_rentals},
       "payments": {
           "total_revenue": float(total_revenue),
           "this_month_revenue": float(this_month_revenue),
           "pending": pending_payments,
           "failed": failed_payments
       }
   }

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
   page: int = Query(1, ge=1),
   size: int = Query(20, ge=1, le=100),
   search: Optional[str] = None,
   role: Optional[UserRole] = None,
   admin_user: User = Depends(require_admin),
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
   
   if role:
       query = query.filter(User.role == role)
   
   users, _, _ = _paginate(query, page, size)
   return [UserResponse.from_orm(user) for user in users]

@router.put("/users/{user_id}/block")
async def block_user(
   user_id: int,
   admin_user: User = Depends(require_admin),
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
   admin_user: User = Depends(require_admin),
   db: Session = Depends(get_db)
):
   user = db.query(User).filter(User.id == user_id).first()
   if not user:
       raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie znaleziony")
   
   user.is_blocked = False
   db.commit()
   
   return {"message": f"Użytkownik {user.email} został odblokowany"}

@router.get("/rentals/pending", response_model=RentalListResponse)
async def get_pending_rentals(
   page: int = Query(1, ge=1),
   size: int = Query(10, ge=1, le=100),
   admin_user: User = Depends(require_admin),
   db: Session = Depends(get_db)
):
   query = db.query(Rental).filter(Rental.status == RentalStatus.PENDING).order_by(Rental.created_at.asc())
   
   rentals, total, pages = _paginate(query, page, size)
   items = [_enrich_rental_response(rental, db) for rental in rentals]
   
   return RentalListResponse(items=items, total=total, page=page, size=size, pages=pages)

@router.get("/payments/pending", response_model=PaymentListResponse)
async def get_pending_payments(
   page: int = Query(1, ge=1),
   size: int = Query(10, ge=1, le=100),
   admin_user: User = Depends(require_admin),
   db: Session = Depends(get_db)
):
   query = db.query(Payment).filter(
       or_(Payment.status == PaymentStatus.PENDING, Payment.status == PaymentStatus.FAILED)
   ).order_by(Payment.created_at.asc())
   
   payments, total, pages = _paginate(query, page, size)
   items = [_enrich_payment_response(payment, db) for payment in payments]
   
   return PaymentListResponse(items=items, total=total, page=page, size=size, pages=pages)
@router.get("/users/count")
async def get_users_count(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    count = db.query(User).filter(User.is_active == True).count()
    return{"count":count}

@router.get("/reports/revenue")
async def get_revenue_report(
   start_date: Optional[datetime] = Query(None),
   end_date: Optional[datetime] = Query(None),
   admin_user: User = Depends(require_admin),
   db: Session = Depends(get_db)
):
   if not start_date:
       start_date = datetime.now().replace(day=1)
   if not end_date:
       end_date = datetime.now()
   
   successful_payments = [PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED]
   base_filter = and_(
       Payment.status.in_(successful_payments),
       Payment.processed_at >= start_date,
       Payment.processed_at <= end_date
   )
   
   revenue_query = db.query(
       func.sum(Payment.amount).label('total'),
       func.count(Payment.id).label('count')
   ).filter(base_filter).first()
   
   total_revenue = float(revenue_query.total or 0)
   total_payments = revenue_query.count or 0
   
   payment_methods = [
       {
           "method": method.payment_method,
           "amount": float(method.amount),
           "count": method.count,
           "percentage": round((float(method.amount) / total_revenue * 100) if total_revenue > 0 else 0, 2)
       }
       for method in db.query(
           Payment.payment_method,
           func.sum(Payment.amount).label('amount'),
           func.count(Payment.id).label('count')
       ).filter(base_filter).group_by(Payment.payment_method).all()
   ]
   
   top_equipment = [
       {
           "name": equipment.name,
           "rental_count": equipment.rental_count,
           "revenue": float(equipment.revenue or 0)
       }
       for equipment in db.query(
           Equipment.name,
           func.count(Rental.id).label('rental_count'),
           func.sum(Payment.amount).label('revenue')
       ).join(Rental, Equipment.id == Rental.equipment_id)\
        .join(Payment, Rental.id == Payment.rental_id)\
        .filter(base_filter)\
        .group_by(Equipment.id, Equipment.name)\
        .order_by(func.count(Rental.id).desc())\
        .limit(10).all()
   ]
   
   return {
       "period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
       "summary": {
           "total_revenue": total_revenue,
           "total_payments": total_payments,
           "average_payment": round(total_revenue / total_payments, 2) if total_payments > 0 else 0
       },
       "payment_methods": payment_methods,
       "top_equipment": top_equipment
   }