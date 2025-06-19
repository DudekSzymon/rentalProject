"""
Test jednostkowy - sprawdzanie dostępności sprzętu
"""
import sys
import os
from datetime import datetime, timedelta
from unittest.mock import Mock

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.services.rental_service import RentalService
from tests.utils.test_runner import print_debug

def test_rental_check_availability():
    """Test jednostkowy - sprawdzanie dostępności sprzętu"""
    print_debug("JEDNOSTKOWY: Testowanie sprawdzania dostępności...")
    mock_db = Mock()
    rental_service = RentalService(mock_db)
    
    # Mock - sprzęt nie znaleziony
    rental_service.db.query.return_value.filter.return_value.first.return_value = None
    print_debug("Mock bazy: sprzęt nie znaleziony")
    
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=7)
    equipment_id = 999
    quantity = 2
    
    try:
        rental_service.check_equipment_availability(equipment_id, quantity, start_date, end_date)
        assert False, "Nieistniejący sprzęt powinien rzucić wyjątek"
    except Exception as e:
        print_debug(f"Oczekiwany błąd: {e}")
        assert "nie znaleziony" in str(e)
        print_debug("Sprawdzanie nieistniejącego sprzętu działa poprawnie")
    
    print_debug("✅ Sprawdzanie dostępności działa poprawnie")