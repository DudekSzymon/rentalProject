from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
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
    StripePaymentCreate, StripePaymentResponse, OfflinePaymentApproval, StripeConfigResponse
)
from ..services.auth_service import auth_service
from ..config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

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

def _ensure_stripe_configured():
    if not settings.STRIPE_PUBLISHABLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Stripe nie jest skonfigurowany"
        )

def _get_payment_or_404(payment_id: int, db: Session) -> Payment:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Płatność nie znaleziona")
    return payment

def _get_payment_by_intent_or_404(payment_intent_id: str, user_id: int, db: Session) -> Payment:
    payment = db.query(Payment).filter(
        Payment.external_id == payment_intent_id,
        Payment.user_id == user_id
    ).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Płatność nie znaleziona")
    return payment

def _check_payment_access(payment: Payment, current_user: User):
    if payment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do tej płatności")

def _confirm_rental_if_pending(rental_id: int, db: Session):
    if rental_id:
        rental = db.query(Rental).filter(Rental.id == rental_id).first()
        if rental and rental.status == RentalStatus.PENDING:
            rental.status = RentalStatus.CONFIRMED

def _paginate_payments(query, page: int, size: int, db: Session):
    total = query.count()
    offset = (page - 1) * size
    payments = query.order_by(Payment.created_at.desc()).offset(offset).limit(size).all()
    
    items = [_enrich_payment_response(payment, db) for payment in payments]
    
    return PaymentListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1
    )

def _enrich_payment_response(payment: Payment, db: Session) -> PaymentResponse:
    payment_dict = PaymentResponse.from_orm(payment).dict()
    
    user = db.query(User).filter(User.id == payment.user_id).first()
    payment_dict["user_email"] = user.email if user else None
    
    if payment.rental_id:
        rental = db.query(Rental).filter(Rental.id == payment.rental_id).first()
        if rental:
            equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
            payment_dict["rental_equipment_name"] = equipment.name if equipment else None
    
    return PaymentResponse(**payment_dict)

@router.get("/stripe/config", response_model=StripeConfigResponse)
async def get_stripe_config():
    _ensure_stripe_configured()
    return StripeConfigResponse(publishable_key=settings.STRIPE_PUBLISHABLE_KEY, currency="pln")

@router.get("/stripe/status/{payment_intent_id}")
async def check_payment_status(
    payment_intent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        payment = _get_payment_by_intent_or_404(payment_intent_id, current_user.id, db)
        
        stripe_status_map = {
            'succeeded': PaymentStatus.COMPLETED,
            'processing': PaymentStatus.PROCESSING,
            'requires_payment_method': PaymentStatus.FAILED,
            'requires_confirmation': PaymentStatus.PENDING,
            'requires_action': PaymentStatus.PENDING,
            'canceled': PaymentStatus.CANCELLED
        }
        
        expected_status = stripe_status_map.get(intent.status, PaymentStatus.PENDING)
        
        if payment.status != expected_status:
            payment.status = expected_status
            payment.external_status = intent.status
            
            if expected_status == PaymentStatus.COMPLETED and not payment.processed_at:
                payment.processed_at = datetime.utcnow()
                _confirm_rental_if_pending(payment.rental_id, db)
            
            db.commit()
        
        return {
            "payment_intent_id": payment_intent_id,
            "stripe_status": intent.status,
            "our_status": payment.status,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "created_at": payment.created_at,
            "processed_at": payment.processed_at
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Błąd Stripe: {str(e)}")

@router.post("/stripe/create-payment-intent", response_model=StripePaymentResponse)
async def create_stripe_payment_intent(
    payment_data: StripePaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not stripe.api_key:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Stripe nie jest skonfigurowany")
    
    if payment_data.rental_id:
        existing_payments = db.query(Payment).filter(
            Payment.rental_id == payment_data.rental_id,
            Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.PROCESSING])
        ).all()
        
        for existing_payment in existing_payments:
            existing_payment.status = PaymentStatus.CANCELLED
        
        if existing_payments:
            db.commit()
    
    try:
        metadata = {'user_id': str(current_user.id), 'user_email': current_user.email}
        
        if payment_data.rental_id:
            metadata['rental_id'] = str(payment_data.rental_id)
            rental = db.query(Rental).filter(Rental.id == payment_data.rental_id).first()
            if rental:
                equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
                equipment_name = equipment.name if equipment else "Nieznany sprzęt"
                description = f"Wypożyczenie: {equipment_name} (ID: {payment_data.rental_id})"
            else:
                description = f"Wypożyczenie ID: {payment_data.rental_id}"
        else:
            metadata['type'] = 'test_payment'
            description = f"Płatność testowa - {payment_data.amount} {payment_data.currency.upper()}"
        
        intent = stripe.PaymentIntent.create(
            amount=int(payment_data.amount * 100),
            currency=payment_data.currency.lower(),
            automatic_payment_methods={'enabled': True},
            metadata=metadata,
            description=description
        )
        
        new_payment = Payment(
            user_id=current_user.id,
            rental_id=payment_data.rental_id,
            amount=payment_data.amount,
            currency=payment_data.currency.upper(),
            payment_type=PaymentType.RENTAL,
            payment_method=PaymentMethod.STRIPE,
            status=PaymentStatus.PENDING,
            external_id=intent.id,
            description=description
        )
        
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
        
        return StripePaymentResponse(
            client_secret=intent.client_secret,
            payment_intent_id=intent.id,
            amount=payment_data.amount,
            currency=payment_data.currency,
            payment_id=new_payment.id
        )
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Błąd Stripe: {str(e)}")

@router.post("/stripe/confirm/{payment_intent_id}")
async def confirm_stripe_payment(
    payment_intent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        payment = _get_payment_by_intent_or_404(payment_intent_id, current_user.id, db)
        
        if intent.status == 'succeeded':
            payment.status = PaymentStatus.COMPLETED
            payment.processed_at = datetime.utcnow()
            _confirm_rental_if_pending(payment.rental_id, db)
        
        elif intent.status == 'canceled':
            payment.status = PaymentStatus.CANCELLED
        
        elif intent.status in ['requires_payment_method', 'requires_confirmation']:
            payment.status = PaymentStatus.FAILED
            payment.failure_reason = "Płatność wymaga dodatkowego potwierdzenia"
        
        payment.external_status = intent.status
        db.commit()
        
        return {"message": "Status płatności zaktualizowany", "status": payment.status}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Błąd Stripe: {str(e)}")

@router.post("/offline-approve", response_model=PaymentResponse)
async def approve_payment_offline(
    approval_data: OfflinePaymentApproval,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    payment = _get_payment_or_404(approval_data.payment_id, db)
    
    if payment.status in [PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Płatność już została zatwierdzona")
    
    payment.status = PaymentStatus.OFFLINE_APPROVED
    payment.offline_approved_by = admin_user.id
    payment.offline_approved_at = datetime.utcnow()
    payment.offline_notes = approval_data.notes
    payment.processed_at = datetime.utcnow()
    
    _confirm_rental_if_pending(payment.rental_id, db)
    
    db.commit()
    db.refresh(payment)
    
    return PaymentResponse.from_orm(payment)

@router.post("/create-offline", response_model=PaymentResponse)
async def create_offline_payment(
    payment_data: PaymentCreate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user_id = admin_user.id
    rental = None
    
    if payment_data.rental_id:
        rental = db.query(Rental).filter(Rental.id == payment_data.rental_id).first()
        if not rental:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wypożyczenie nie znalezione")
        user_id = rental.user_id
    
    new_payment = Payment(
        user_id=user_id,
        rental_id=payment_data.rental_id,
        amount=payment_data.amount,
        payment_type=payment_data.payment_type,
        payment_method=payment_data.payment_method,
        status=PaymentStatus.OFFLINE_APPROVED,
        description=payment_data.description,
        offline_approved_by=admin_user.id,
        offline_approved_at=datetime.utcnow(),
        processed_at=datetime.utcnow()
    )
    
    db.add(new_payment)
    _confirm_rental_if_pending(payment_data.rental_id, db)
    
    db.commit()
    db.refresh(new_payment)
    
    return PaymentResponse.from_orm(new_payment)

@router.post("/{payment_id}/cancel", response_model=PaymentResponse)
async def cancel_payment(
    payment_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    payment = _get_payment_or_404(payment_id, db)
    
    if payment.status not in [PaymentStatus.COMPLETED, PaymentStatus.OFFLINE_APPROVED, PaymentStatus.PENDING, PaymentStatus.PROCESSING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Płatność ze statusem {payment.status} nie może być anulowana"
        )
    
    try:
        if payment.payment_method == PaymentMethod.STRIPE and payment.external_id and payment.status == PaymentStatus.COMPLETED:
            try:
                stripe.Refund.create(
                    payment_intent=payment.external_id,
                    metadata={'admin_id': str(admin_user.id), 'reason': 'admin_cancellation'}
                )
                payment.status = PaymentStatus.REFUNDED
                payment.external_status = 'refunded'
            except stripe.error.StripeError as e:
                payment.status = PaymentStatus.CANCELLED
                payment.failure_reason = f"Anulowane przez administratora. Błąd Stripe: {str(e)}"
        else:
            payment.status = PaymentStatus.CANCELLED
        
        payment.failure_reason = f"Anulowane przez administratora {admin_user.email}"
        payment.offline_approved_by = admin_user.id
        payment.offline_approved_at = datetime.utcnow()
        
        if payment.rental_id:
            rental = db.query(Rental).filter(Rental.id == payment.rental_id).first()
            if rental and rental.status in [RentalStatus.CONFIRMED, RentalStatus.PENDING]:
                rental.status = RentalStatus.CANCELLED
                
                if rental.status == RentalStatus.CONFIRMED:
                    equipment = db.query(Equipment).filter(Equipment.id == rental.equipment_id).first()
                    if equipment:
                        equipment.quantity_available += rental.quantity
        
        db.commit()
        db.refresh(payment)
        
        return PaymentResponse.from_orm(payment)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Błąd anulowania płatności: {str(e)}")

@router.get("/admin/all", response_model=PaymentListResponse)
async def get_all_payments_admin(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[PaymentStatus] = None,
    payment_method: Optional[PaymentMethod] = None,
    search: Optional[str] = None,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Payment)
    
    if status:
        query = query.filter(Payment.status == status)
    
    if payment_method:
        query = query.filter(Payment.payment_method == payment_method)
    
    if search:
        search_term = f"%{search}%"
        user_subquery = db.query(User.id).filter(func.lower(User.email).contains(search_term.lower()))
        
        query = query.filter(
            or_(
                Payment.user_id.in_(user_subquery),
                Payment.id.like(search_term),
                Payment.external_id.like(search_term) if Payment.external_id else False
            )
        )
    
    return _paginate_payments(query, page, size, db)

@router.get("", response_model=PaymentListResponse)
async def get_payments(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[PaymentStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Payment)
    
    if current_user.role != "admin":
        query = query.filter(Payment.user_id == current_user.id)
    
    if status:
        query = query.filter(Payment.status == status)
    
    return _paginate_payments(query, page, size, db)

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = _get_payment_or_404(payment_id, db)
    _check_payment_access(payment, current_user)
    return PaymentResponse.from_orm(payment)