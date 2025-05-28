from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import stripe
import math

from ..database import get_db
from ..models.user import User
from ..models.equipment import Equipment
from ..models.rental import Rental, RentalStatus
from ..models.payment import Payment, PaymentStatus, PaymentMethod, PaymentType
from ..views.payment_schemas import (
    PaymentCreate, PaymentResponse, PaymentListResponse,
    StripePaymentCreate, StripePaymentResponse, OfflinePaymentApproval
)
from ..services.auth_service import auth_service
from ..config import settings

# Konfiguracja Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

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

@router.post("/stripe/create-payment-intent", response_model=StripePaymentResponse)
async def create_stripe_payment_intent(
    payment_data: StripePaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Utworzenie Stripe Payment Intent"""
    
    if not stripe.api_key:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Stripe nie jest skonfigurowany"
        )
    
    # Sprawdzenie czy wypożyczenie istnieje i należy do użytkownika
    rental = db.query(Rental).filter(Rental.id == payment_data.rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wypożyczenie nie znalezione"
        )
    
    if rental.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do tego wypożyczenia"
        )
    
    try:
        # Utworzenie Payment Intent w Stripe
        intent = stripe.PaymentIntent.create(
            amount=int(payment_data.amount * 100),  # Stripe używa groszy
            currency=payment_data.currency,
            metadata={
                'rental_id': payment_data.rental_id,
                'user_id': current_user.id,
                'user_email': current_user.email
            }
        )
        
        # Zapisanie płatności w bazie danych
        new_payment = Payment(
            user_id=current_user.id,
            rental_id=payment_data.rental_id,
            amount=payment_data.amount,
            currency=payment_data.currency,
            payment_type=PaymentType.RENTAL,
            payment_method=PaymentMethod.STRIPE,
            status=PaymentStatus.PENDING,
            external_id=intent.id,
            description=f"Płatność za wypożyczenie #{payment_data.rental_id}"
        )
        
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
        
        return StripePaymentResponse(
            client_secret=intent.client_secret,
            payment_intent_id=intent.id,
            amount=payment_data.amount,
            currency=payment_data.currency
        )
        
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Błąd Stripe: {str(e)}"
        )

@router.post("/stripe/confirm/{payment_intent_id}")
async def confirm_stripe_payment(
    payment_intent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Potwierdzenie płatności Stripe"""
    
    try:
        # Pobranie Payment Intent z Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        # Znalezienie płatności w bazie
        payment = db.query(Payment).filter(
            Payment.external_id == payment_intent_id,
            Payment.user_id == current_user.id
        ).first()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Płatność nie znaleziona"
            )
        
        # Aktualizacja statusu płatności
        if intent.status == 'succeeded':
            payment.status = PaymentStatus.COMPLETED
            payment.processed_at = datetime.utcnow()
            
            # Aktualizacja statusu wypożyczenia
            rental = db.query(Rental).filter(Rental.id == payment.rental_id).first()
            if rental and rental.status == RentalStatus.PENDING:
                rental.status = RentalStatus.CONFIRMED
        
        elif intent.status == 'canceled':
            payment.status = PaymentStatus.CANCELLED
        
        elif intent.status in ['requires_payment_method', 'requires_confirmation']:
            payment.status = PaymentStatus.FAILED
            payment.failure_reason = "Płatność wymaga dodatkowego potwierdzenia"
        
        payment.external_status = intent.status
        db.commit()
        
        return {"message": "Status płatności zaktualizowany", "status": payment.status}
        
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Błąd Stripe: {str(e)}"
        )

@router.post("/offline-approve", response_model=PaymentResponse)
async def approve_payment_offline(
    approval_data: OfflinePaymentApproval,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Zatwierdzenie płatności offline przez administratora (WYMAGANIE!)"""
    
    payment = db.query(Payment).filter(Payment.id == approval_data.payment_id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Płatność nie znaleziona"
        )
    
    if payment.status in [PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Płatność już została zatwierdzona"
        )
    
    # Zatwierdzenie offline
    payment.status = PaymentStatus.OFFLINE_APPROVED
    payment.offline_approved_by = admin_user.id
    payment.offline_approved_at = datetime.utcnow()
    payment.offline_notes = approval_data.notes
    payment.processed_at = datetime.utcnow()
    
    # Aktualizacja statusu wypożyczenia
    if payment.rental_id:
        rental = db.query(Rental).filter(Rental.id == payment.rental_id).first()
        if rental and rental.status == RentalStatus.PENDING:
            rental.status = RentalStatus.CONFIRMED
    
    db.commit()
    db.refresh(payment)
    
    return PaymentResponse.from_orm(payment)

@router.post("/create-offline", response_model=PaymentResponse)
async def create_offline_payment(
    payment_data: PaymentCreate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Utworzenie płatności offline (gotówka, przelew)"""
    
    # Sprawdzenie wypożyczenia
    if payment_data.rental_id:
        rental = db.query(Rental).filter(Rental.id == payment_data.rental_id).first()
        if not rental:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wypożyczenie nie znalezione"
            )
        user_id = rental.user_id
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="rental_id jest wymagane"
        )
    
    # Tworzenie płatności offline
    new_payment = Payment(
        user_id=user_id,
        rental_id=payment_data.rental_id,
        amount=payment_data.amount,
        payment_type=payment_data.payment_type,
        payment_method=payment_data.payment_method,
        status=PaymentStatus.OFFLINE_APPROVED,  # Od razu zatwierdzona
        description=payment_data.description,
        offline_approved_by=admin_user.id,
        offline_approved_at=datetime.utcnow(),
        processed_at=datetime.utcnow()
    )
    
    db.add(new_payment)
    
    # Aktualizacja statusu wypożyczenia
    if rental.status == RentalStatus.PENDING:
        rental.status = RentalStatus.CONFIRMED
    
    db.commit()
    db.refresh(new_payment)
    
    return PaymentResponse.from_orm(new_payment)

@router.get("", response_model=PaymentListResponse)
async def get_payments(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[PaymentStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pobranie listy płatności"""
    
    query = db.query(Payment)
    
    # Ograniczenie dla zwykłych użytkowników
    if current_user.role != "admin":
        query = query.filter(Payment.user_id == current_user.id)
    
    if status:
        query = query.filter(Payment.status == status)
    
    # Paginacja
    total = query.count()
    offset = (page - 1) * size
    payments = query.order_by(Payment.created_at.desc()).offset(offset).limit(size).all()
    
    # Dodanie informacji o użytkownikach i wypożyczeniach
    items = []
    for payment in payments:
        payment_dict = PaymentResponse.from_orm(payment).dict()
        
        user = db.query(User).filter(User.id == payment.user_id).first()
        payment_dict["user_email"] = user.email if user else None
        
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

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pobranie szczegółów płatności"""
    
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Płatność nie znaleziona"
        )
    
    # Sprawdzenie uprawnień
    if payment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do tej płatności"
        )
    
    return PaymentResponse.from_orm(payment)