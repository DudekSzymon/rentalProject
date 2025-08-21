from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import math

from ..database import get_db
from ..models.user import User
from ..models.equipment import Equipment, EquipmentStatus, EquipmentCategory
from ..views.equipment_schemas import (
    EquipmentCreate, EquipmentUpdate, EquipmentResponse, 
    EquipmentListResponse, EquipmentCategory, EquipmentStatus
)
from ..services.auth_service import auth_service

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

@router.get("", response_model=EquipmentListResponse)
async def get_equipment_list(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    category: Optional[EquipmentCategory] = None,
    status: Optional[EquipmentStatus] = None,
    search: Optional[str] = None,
    available_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Equipment).filter(Equipment.is_active == True)
    
    if category:
        query = query.filter(Equipment.category == category)
    
    if status:
        query = query.filter(Equipment.status == status)
    elif available_only:
        query = query.filter(Equipment.status == EquipmentStatus.AVAILABLE)
        query = query.filter(Equipment.quantity_available > 0)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            func.lower(Equipment.name).contains(search_term.lower()) |
            func.lower(Equipment.description).contains(search_term.lower()) |
            func.lower(Equipment.brand).contains(search_term.lower())
        )
    
    total = query.count()
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()
    pages = math.ceil(total / size) if total > 0 else 1
    
    return EquipmentListResponse(
        items=[EquipmentResponse.from_orm(item) for item in items],
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(equipment_id: int, db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.is_active == True
    ).first()
    
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprzęt nie znaleziony"
        )
    
    return EquipmentResponse.from_orm(equipment)

@router.post("", response_model=EquipmentResponse)
async def create_equipment(
    equipment_data: EquipmentCreate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    new_equipment = Equipment(
        name=equipment_data.name,
        description=equipment_data.description,
        category=equipment_data.category,
        brand=equipment_data.brand,
        model=equipment_data.model,
        daily_rate=equipment_data.daily_rate,
        weekly_rate=equipment_data.weekly_rate,
        monthly_rate=equipment_data.monthly_rate,
        weight=equipment_data.weight,
        dimensions=equipment_data.dimensions,
        power_consumption=equipment_data.power_consumption,
        quantity_total=equipment_data.quantity_total,
        quantity_available=equipment_data.quantity_total,
        requires_license=equipment_data.requires_license,
        min_age=equipment_data.min_age
    )
    
    db.add(new_equipment)
    db.commit()
    db.refresh(new_equipment)
    
    return EquipmentResponse.from_orm(new_equipment)

@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: int,
    equipment_data: EquipmentUpdate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprzęt nie znaleziony"
        )
    
    for field, value in equipment_data.dict(exclude_unset=True).items():
        setattr(equipment, field, value)
    
    db.commit()
    db.refresh(equipment)
    
    return EquipmentResponse.from_orm(equipment)

@router.delete("/{equipment_id}")
async def delete_equipment(
    equipment_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprzęt nie znaleziony"
        )
    
    equipment.is_active = False
    db.commit()
    
    return {"message": "Sprzęt został usunięty"}