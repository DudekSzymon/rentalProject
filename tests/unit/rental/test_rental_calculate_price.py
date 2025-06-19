"""
Test jednostkowy - obliczanie ceny wypożyczenia
"""
import sys
import os
from datetime import datetime
from decimal import Decimal
from unittest.mock import Mock

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.services.rental_service import RentalService
from backend.app.models.rental import RentalPeriod
from tests.utils.test_runner import print_debug

def test_rental_calculate_price():
    """Test jednostkowy - obliczanie ceny wypożyczenia"""
    print_debug("JEDNOSTKOWY: Testowanie obliczania ceny...")
    mock_db = Mock()
    rental_service = RentalService(mock_db)
    
    # Mock sprzętu
    equipment = Mock()
    equipment.daily_rate = Decimal('100.00')
    equipment.weekly_rate = Decimal('600.00')
    equipment.monthly_rate = Decimal('2000.00')
    print_debug(f"Sprzęt - cena dzienna: {equipment.daily_rate}")
    
    start_date = datetime(2024, 6, 1)
    end_date = datetime(2024, 6, 8)  # 7 dni
    quantity = 2
    print_debug(f"Okres: {start_date} do {end_date}")
    print_debug(f"Ilość: {quantity}")
    
    result = rental_service.calculate_rental_price(
        equipment, start_date, end_date, quantity, RentalPeriod.DAILY
    )
    print_debug(f"Wynik obliczeń: {result}")
    
    expected_total = equipment.daily_rate * 7 * quantity
    print_debug(f"Oczekiwana cena: {expected_total}")
    
    assert result["total_price"] == expected_total, f"Nieprawidłowa cena: {result['total_price']} != {expected_total}"
    assert result["billable_units"] == 7, "Nieprawidłowa liczba dni"
    
    print_debug(f"Obliczona cena: {result['total_price']}")
    print_debug("✅ Obliczanie ceny działa poprawnie")