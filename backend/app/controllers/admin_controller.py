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

# Router dla endpointów administratora
router = APIRouter()
# Schemat bezpieczeństwa dla tokenów Bearer
security = HTTPBearer()

def require_admin(
   credentials: HTTPAuthorizationCredentials = Depends(security),
   db: Session = Depends(get_db)
) -> User:
   """Dependency wymagające uprawnień administratora - sprawdza czy użytkownik jest adminem"""
   user = auth_service.get_current_user(credentials.credentials, db)
   auth_service.require_admin(user)  # Rzuca wyjątek jeśli nie admin
   return user

@router.get("/dashboard")
async def get_admin_dashboard(
   admin_user: User = Depends(require_admin),
   db: Session = Depends(get_db)
):
   """Panel administratora - statystyki i kluczowe metryki systemu"""
   
   # Statystyki użytkowników
   total_users = db.query(User).filter(User.is_active == True).count()  # Wszyscy aktywni użytkownicy
   new_users_this_month = db.query(User).filter(
       User.created_at >= datetime.now().replace(day=1)  # Od pierwszego dnia bieżącego miesiąca
   ).count()
   
   # Statystyki sprzętu
   total_equipment = db.query(Equipment).filter(Equipment.is_active == True).count()  # Cały aktywny sprzęt
   available_equipment = db.query(Equipment).filter(
       and_(Equipment.is_active == True, Equipment.status == EquipmentStatus.AVAILABLE)
   ).count()  # Sprzęt dostępny do wypożyczenia
   rented_equipment = db.query(Equipment).filter(
       Equipment.status == EquipmentStatus.RENTED
   ).count()  # Sprzęt aktualnie wypożyczony
   
   # Statystyki wypożyczeń
   total_rentals = db.query(Rental).count()  # Wszystkie wypożyczenia w historii
   active_rentals = db.query(Rental).filter(
       Rental.status == RentalStatus.ACTIVE
   ).count()  # Aktywne wypożyczenia
   pending_rentals = db.query(Rental).filter(
       Rental.status == RentalStatus.PENDING
   ).count()  # Wypożyczenia oczekujące na zatwierdzenie
   overdue_rentals = db.query(Rental).filter(
       and_(
           Rental.status.in_([RentalStatus.ACTIVE, RentalStatus.CONFIRMED]),
           Rental.end_date < datetime.now()  # Data zwrotu minęła
       )
   ).count()  # Wypożyczenia po terminie
   
   # Statystyki płatności
   total_revenue = db.query(func.sum(Payment.amount)).filter(
       Payment.status.in_([PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED])
   ).scalar() or 0  # Suma wszystkich udanych płatności
   
   pending_payments = db.query(Payment).filter(
       Payment.status == PaymentStatus.PENDING
   ).count()  # Płatności oczekujące na zatwierdzenie
   
   failed_payments = db.query(Payment).filter(
       Payment.status == PaymentStatus.FAILED
   ).count()  # Nieudane płatności
   
   # Przychody z bieżącego miesiąca
   this_month_revenue = db.query(func.sum(Payment.amount)).filter(
       and_(
           Payment.status.in_([PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED]),
           Payment.processed_at >= datetime.now().replace(day=1)  # Od początku miesiąca
       )
   ).scalar() or 0
   
   # Zwrócenie zgrupowanych statystyk
   return {
       "users": {
           "total": total_users,
           "new_this_month": new_users_this_month
       },
       "equipment": {
           "total": total_equipment,
           "available": available_equipment,
           "rented": rented_equipment,
           "utilization_rate": round((rented_equipment / total_equipment * 100) if total_equipment > 0 else 0, 2)  # Procent wykorzystania sprzętu
       },
       "rentals": {
           "total": total_rentals,
           "active": active_rentals,
           "pending": pending_rentals,
           "overdue": overdue_rentals
       },
       "payments": {
           "total_revenue": float(total_revenue),
           "this_month_revenue": float(this_month_revenue),
           "pending": pending_payments,
           "failed": failed_payments
       }
   }

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
   page: int = Query(1, ge=1),                    # Numer strony (minimum 1)
   size: int = Query(20, ge=1, le=100),           # Rozmiar strony (1-100 elementów)
   search: Optional[str] = None,                  # Opcjonalne wyszukiwanie po tekście
   role: Optional[UserRole] = None,               # Opcjonalne filtrowanie po roli
   admin_user: User = Depends(require_admin),
   db: Session = Depends(get_db)
):
   """Lista wszystkich użytkowników z paginacją i filtrami"""
   
   # Bazowe zapytanie - tylko aktywni użytkownicy
   query = db.query(User).filter(User.is_active == True)
   
   # Filtr wyszukiwania po imieniu, nazwisku lub emailu
   if search:
       search_term = f"%{search}%"  # Wzorzec dla LIKE
       query = query.filter(
           or_(
               func.lower(User.first_name).contains(search_term.lower()),
               func.lower(User.last_name).contains(search_term.lower()),
               func.lower(User.email).contains(search_term.lower())
           )
       )
   
   # Filtr po roli użytkownika
   if role:
       query = query.filter(User.role == role)
   
   # Paginacja - obliczenie offset i pobranie odpowiedniej ilości rekordów
   offset = (page - 1) * size
   users = query.offset(offset).limit(size).all()
   
   # Konwersja do schema odpowiedzi
   return [UserResponse.from_orm(user) for user in users]

@router.put("/users/{user_id}/block")
async def block_user(
   user_id: int,
   admin_user: User = Depends(require_admin),
   db: Session = Depends(get_db)
):
   """Blokowanie użytkownika - uniemożliwia mu logowanie"""
   
   # Wyszukanie użytkownika do zablokowania
   user = db.query(User).filter(User.id == user_id).first()
   if not user:
       raise HTTPException(
           status_code=status.HTTP_404_NOT_FOUND,
           detail="Użytkownik nie znaleziony"
       )
   
   # Zabezpieczenie - nie można zablokować administratora
   if user.role == UserRole.ADMIN:
       raise HTTPException(
           status_code=status.HTTP_400_BAD_REQUEST,
           detail="Nie można zablokować administratora"
       )
   
   # Ustawienie flagi blokady i zapis do bazy
   user.is_blocked = True
   db.commit()
   
   return {"message": f"Użytkownik {user.email} został zablokowany"}

@router.put("/users/{user_id}/unblock")
async def unblock_user(
   user_id: int,
   admin_user: User = Depends(require_admin),
   db: Session = Depends(get_db)
):
   """Odblokowanie użytkownika - przywraca możliwość logowania"""
   
   # Wyszukanie użytkownika do odblokowania
   user = db.query(User).filter(User.id == user_id).first()
   if not user:
       raise HTTPException(
           status_code=status.HTTP_404_NOT_FOUND,
           detail="Użytkownik nie znaleziony"
       )
   
   # Usunięcie flagi blokady i zapis do bazy
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
   """Lista oczekujących wypożyczeń do zatwierdzenia przez administratora"""
   
   # Zapytanie o wypożyczenia oczekujące na zatwierdzenie
   query = db.query(Rental).filter(Rental.status == RentalStatus.PENDING)
   
   # Obliczenie całkowitej liczby rekordów dla paginacji
   total = query.count()
   offset = (page - 1) * size
   rentals = query.order_by(Rental.created_at.asc()).offset(offset).limit(size).all()  # Najstarsze pierwsze
   
   # Wzbogacenie danych o informacje o użytkowniku i sprzęcie
   items = []
   for rental in rentals:
       rental_dict = RentalResponse.from_orm(rental).dict()
       
       # Dodanie emaila użytkownika
       user = db.query(User).filter(User.id == rental.user_id).first()
       equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
       
       rental_dict["user_email"] = user.email if user else None
       rental_dict["equipment_name"] = equipment.name if equipment else None
       
       items.append(RentalResponse(**rental_dict))
   
   # Obliczenie liczby stron
   pages = math.ceil(total / size) if total > 0 else 1
   
   return RentalListResponse(
       items=items,
       total=total,
       page=page,
       size=size,
       pages=pages
   )

@router.get("/payments/pending", response_model=PaymentListResponse)
async def get_pending_payments(
   page: int = Query(1, ge=1),
   size: int = Query(10, ge=1, le=100),
   admin_user: User = Depends(require_admin),
   db: Session = Depends(get_db)
):
   """Lista oczekujących płatności do ręcznego zatwierdzenia (płatności offline)"""
   
   # Zapytanie o płatności oczekujące lub nieudane (do ponownej próby)
   query = db.query(Payment).filter(
       or_(
           Payment.status == PaymentStatus.PENDING,
           Payment.status == PaymentStatus.FAILED
       )
   )
   
   # Paginacja
   total = query.count()
   offset = (page - 1) * size
   payments = query.order_by(Payment.created_at.asc()).offset(offset).limit(size).all()  # Najstarsze pierwsze
   
   # Wzbogacenie danych o informacje kontekstowe
   items = []
   for payment in payments:
       payment_dict = PaymentResponse.from_orm(payment).dict()
       
       # Dodanie emaila użytkownika
       user = db.query(User).filter(User.id == payment.user_id).first()
       payment_dict["user_email"] = user.email if user else None
       
       # Dodanie nazwy sprzętu jeśli płatność związana z wypożyczeniem
       if payment.rental_id:
           rental = db.query(Rental).filter(Rental.id == payment.rental_id).first()
           if rental:
               equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
               payment_dict["rental_equipment_name"] = equipment.name if equipment else None
       
       items.append(PaymentResponse(**payment_dict))
   
   pages = math.ceil(total / size) if total > 0 else 1
   
   return PaymentListResponse(
       items=items,
       total=total,
       page=page,
       size=size,
       pages=pages
   )

@router.get("/reports/revenue")
async def get_revenue_report(
   start_date: Optional[datetime] = Query(None),  # Opcjonalna data początkowa
   end_date: Optional[datetime] = Query(None),    # Opcjonalna data końcowa
   admin_user: User = Depends(require_admin),
   db: Session = Depends(get_db)
):
   """Raport przychodów z analizą w określonym okresie"""
   
   # Domyślny okres - od początku bieżącego miesiąca do dziś
   if not start_date:
       start_date = datetime.now().replace(day=1)  # Pierwszy dzień miesiąca
   
   if not end_date:
       end_date = datetime.now()
   
   # Zapytanie o przychody w okresie - suma i liczba płatności
   revenue_query = db.query(
       func.sum(Payment.amount).label('total'),
       func.count(Payment.id).label('count')
   ).filter(
       and_(
           Payment.status.in_([PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED]),
           Payment.processed_at >= start_date,
           Payment.processed_at <= end_date
       )
   ).first()
   
   total_revenue = float(revenue_query.total or 0)
   total_payments = revenue_query.count or 0
   
   # Analiza metod płatności - podział przychodów według sposobu płatności
   payment_methods = db.query(
       Payment.payment_method,
       func.sum(Payment.amount).label('amount'),
       func.count(Payment.id).label('count')
   ).filter(
       and_(
           Payment.status.in_([PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED]),
           Payment.processed_at >= start_date,
           Payment.processed_at <= end_date
       )
   ).group_by(Payment.payment_method).all()
   
   # Analiza najczęściej wypożyczanego sprzętu - top 10 według liczby wypożyczeń
   top_equipment = db.query(
       Equipment.name,
       func.count(Rental.id).label('rental_count'),
       func.sum(Payment.amount).label('revenue')
   ).join(Rental, Equipment.id == Rental.equipment_id)\
    .join(Payment, Rental.id == Payment.rental_id)\
    .filter(
       and_(
           Payment.status.in_([PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED]),
           Payment.processed_at >= start_date,
           Payment.processed_at <= end_date
       )
   ).group_by(Equipment.id, Equipment.name)\
    .order_by(func.count(Rental.id).desc())\
    .limit(10).all()
   
   # Zwrócenie kompletnego raportu
   return {
       "period": {
           "start_date": start_date.isoformat(),
           "end_date": end_date.isoformat()
       },
       "summary": {
           "total_revenue": total_revenue,
           "total_payments": total_payments,
           "average_payment": round(total_revenue / total_payments, 2) if total_payments > 0 else 0  # Średnia wartość płatności
       },
       "payment_methods": [
           {
               "method": method.payment_method,
               "amount": float(method.amount),
               "count": method.count,
               "percentage": round((float(method.amount) / total_revenue * 100) if total_revenue > 0 else 0, 2)  # Procent udziału w przychodach
           }
           for method in payment_methods
       ],
       "top_equipment": [
           {
               "name": equipment.name,
               "rental_count": equipment.rental_count,
               "revenue": float(equipment.revenue or 0)
           }
           for equipment in top_equipment
       ]
   }