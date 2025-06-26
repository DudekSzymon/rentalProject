# Importy niezbędne do obsługi API, autoryzacji i bazy danych
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import math

# Importy wewnętrzne aplikacji
from ..database import get_db
from ..models.user import User
from ..models.equipment import Equipment, EquipmentStatus, EquipmentCategory
from ..views.equipment_schemas import (
    EquipmentCreate, EquipmentUpdate, EquipmentResponse, 
    EquipmentListResponse, EquipmentCategory, EquipmentStatus
)
from ..services.auth_service import auth_service

# Utworzenie routera dla endpointów sprzętu
router = APIRouter()
# Konfiguracja bezpieczeństwa - wymaganie Bearer token w nagłówku Authorization
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency do pobierania aktualnego użytkownika na podstawie JWT tokenu.
    
    Args:
        credentials: Dane autoryzacyjne z nagłówka Authorization
        db: Sesja bazy danych
        
    Returns:
        User: Obiekt użytkownika jeśli token jest prawidłowy
        
    Raises:
        HTTPException: Jeśli token jest nieprawidłowy lub użytkownik nie istnieje
    """
    return auth_service.get_current_user(credentials.credentials, db)

def require_admin(current_user: User = Depends(get_current_user)):
    """
    Dependency wymagające uprawnień administratora.
    
    Args:
        current_user: Aktualnie zalogowany użytkownik
        
    Returns:
        User: Użytkownik jeśli ma uprawnienia administratora
        
    Raises:
        HTTPException: Jeśli użytkownik nie ma uprawnień administratora
    """
    auth_service.require_admin(current_user)
    return current_user

@router.get("", response_model=EquipmentListResponse)
async def get_equipment_list(
    page: int = Query(1, ge=1),  # Numer strony (minimum 1)
    size: int = Query(10, ge=1, le=100),  # Rozmiar strony (1-100 elementów)
    category: Optional[EquipmentCategory] = None,  # Filtr kategorii (opcjonalny)
    status: Optional[EquipmentStatus] = None,  # Filtr statusu (opcjonalny)
    search: Optional[str] = None,  # Wyszukiwanie tekstowe (opcjonalne)
    available_only: bool = Query(False),  # Tylko dostępny sprzęt
    db: Session = Depends(get_db)  # Sesja bazy danych
):
    """
    Pobranie listy sprzętu z paginacją i filtrami (publiczny endpoint).
    
    Endpoint nie wymaga autoryzacji - może być używany przez niezalogowanych użytkowników
    do przeglądania katalogu sprzętu.
    
    Args:
        page: Numer strony dla paginacji
        size: Liczba elementów na stronie
        category: Filtrowanie po kategorii sprzętu
        status: Filtrowanie po statusie sprzętu
        search: Wyszukiwanie w nazwie, opisie i marce
        available_only: Czy pokazać tylko dostępny sprzęt
        db: Sesja bazy danych
        
    Returns:
        EquipmentListResponse: Lista sprzętu z informacjami o paginacji
    """
    
    # Podstawowe zapytanie - tylko aktywny sprzęt
    query = db.query(Equipment).filter(Equipment.is_active == True)
    
    # Aplikowanie filtrów
    if category:
        query = query.filter(Equipment.category == category)
    
    # Filtrowanie po statusie lub tylko dostępny sprzęt
    if status:
        query = query.filter(Equipment.status == status)
    elif available_only:
        # Tylko dostępny sprzęt z ilością > 0
        query = query.filter(Equipment.status == EquipmentStatus.AVAILABLE)
        query = query.filter(Equipment.quantity_available > 0)
    
    # Wyszukiwanie tekstowe w nazwie, opisie i marce (case-insensitive)
    if search:
        search_term = f"%{search}%"  # Dodanie wildcardów dla LIKE
        query = query.filter(
            func.lower(Equipment.name).contains(search_term.lower()) |
            func.lower(Equipment.description).contains(search_term.lower()) |
            func.lower(Equipment.brand).contains(search_term.lower())
        )
    
    # Obliczenie całkowitej liczby wyników (przed paginacją)
    total = query.count()
    
    # Aplikowanie paginacji
    offset = (page - 1) * size  # Obliczenie przesunięcia
    items = query.offset(offset).limit(size).all()
    
    # Obliczenie liczby stron
    pages = math.ceil(total / size) if total > 0 else 1
    
    # Zwrócenie odpowiedzi z metadanymi paginacji
    return EquipmentListResponse(
        items=[EquipmentResponse.from_orm(item) for item in items],
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(equipment_id: int, db: Session = Depends(get_db)):
    """
    Pobranie szczegółów konkretnego sprzętu (publiczny endpoint).
    
    Args:
        equipment_id: ID sprzętu do pobrania
        db: Sesja bazy danych
        
    Returns:
        EquipmentResponse: Szczegółowe informacje o sprzęcie
        
    Raises:
        HTTPException 404: Jeśli sprzęt nie istnieje lub jest nieaktywny
    """
    
    # Wyszukanie sprzętu po ID (tylko aktywny)
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.is_active == True
    ).first()
    
    # Sprawdzenie czy sprzęt istnieje
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprzęt nie znaleziony"
        )
    
    return EquipmentResponse.from_orm(equipment)

@router.post("", response_model=EquipmentResponse)
async def create_equipment(
    equipment_data: EquipmentCreate,  # Dane nowego sprzętu
    admin_user: User = Depends(require_admin),  # Wymagane uprawnienia administratora
    db: Session = Depends(get_db)
):
    """
    Dodanie nowego sprzętu do systemu (tylko administratorzy).
    
    Args:
        equipment_data: Dane nowego sprzętu (nazwa, kategoria, ceny, etc.)
        admin_user: Użytkownik z uprawnieniami administratora
        db: Sesja bazy danych
        
    Returns:
        EquipmentResponse: Utworzony sprzęt z przypisanym ID
    """
    
    # Utworzenie nowego obiektu sprzętu z przekazanych danych
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
        # Na początku cała ilość jest dostępna
        quantity_available=equipment_data.quantity_total,
        requires_license=equipment_data.requires_license,
        min_age=equipment_data.min_age
    )
    
    # Zapisanie do bazy danych
    db.add(new_equipment)
    db.commit()  # Potwierdzenie transakcji
    db.refresh(new_equipment)  # Odświeżenie obiektu (pobranie ID)
    
    return EquipmentResponse.from_orm(new_equipment)

@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: int,  # ID sprzętu do aktualizacji
    equipment_data: EquipmentUpdate,  # Nowe dane (opcjonalne pola)
    admin_user: User = Depends(require_admin),  # Wymagane uprawnienia administratora
    db: Session = Depends(get_db)
):
    """
    Aktualizacja istniejącego sprzętu (tylko administratorzy).
    
    Funkcja pozwala na częściową aktualizację - można przekazać tylko te pola,
    które mają zostać zmienione.
    
    Args:
        equipment_id: ID sprzętu do aktualizacji
        equipment_data: Nowe dane (tylko zmieniane pola)
        admin_user: Użytkownik z uprawnieniami administratora
        db: Sesja bazy danych
        
    Returns:
        EquipmentResponse: Zaktualizowany sprzęt
        
    Raises:
        HTTPException 404: Jeśli sprzęt nie istnieje
    """
    
    # Wyszukanie sprzętu do aktualizacji
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprzęt nie znaleziony"
        )
    
    # Aktualizacja tylko przekazanych pól (exclude_unset=True)
    # Pozwala to na częściową aktualizację bez nadpisywania wszystkich pól
    for field, value in equipment_data.dict(exclude_unset=True).items():
        setattr(equipment, field, value)
    
    # Zapisanie zmian
    db.commit()
    db.refresh(equipment)  # Odświeżenie obiektu
    
    return EquipmentResponse.from_orm(equipment)

@router.delete("/{equipment_id}")
async def delete_equipment(
    equipment_id: int,  # ID sprzętu do usunięcia
    admin_user: User = Depends(require_admin),  # Wymagane uprawnienia administratora
    db: Session = Depends(get_db)
):
    """
    Usunięcie sprzętu z systemu (soft delete - tylko administratorzy).
    
    Funkcja wykonuje "soft delete" - nie usuwa fizycznie rekordu z bazy danych,
    ale ustawia flagę is_active=False. Dzięki temu zachowane są dane historyczne
    o wypożyczeniach tego sprzętu.
    
    Args:
        equipment_id: ID sprzętu do usunięcia
        admin_user: Użytkownik z uprawnieniami administratora
        db: Sesja bazy danych
        
    Returns:
        dict: Komunikat o pomyślnym usunięciu
        
    Raises:
        HTTPException 404: Jeśli sprzęt nie istnieje
    """
    
    # Wyszukanie sprzętu do usunięcia
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprzęt nie znaleziony"
        )
    
    # Soft delete - oznaczenie jako nieaktywny
    equipment.is_active = False
    db.commit()
    
    return {"message": "Sprzęt został usunięty"}