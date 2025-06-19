"""
Test jednostkowy - walidacja dat wypożyczenia
"""
import sys
import os
from datetime import datetime, timedelta
from unittest.mock import Mock

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.services.rental_service import RentalService
from tests.utils.test_runner import print_debug

def test_rental_validate_dates():
    """Test jednostkowy - walidacja dat wypożyczenia"""
    print_debug("JEDNOSTKOWY: Testowanie walidacji dat...")
    mock_db = Mock()
    rental_service = RentalService(mock_db)
    
    # Test poprawnych dat
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=7)
    print_debug(f"Test dat: {start_date} do {end_date}")
    
    try:
        rental_service.validate_rental_dates(start_date, end_date)
        print_debug("Poprawne daty przeszły walidację")
    except Exception as e:
        print_debug(f"Nieoczekiwany błąd: {e}")
        assert False, "Poprawne daty nie powinny rzucić wyjątku"
    
    # Test daty w przeszłości
    past_date = datetime.now() - timedelta(days=1)
    print_debug(f"Test daty w przeszłości: {past_date}")
    
    try:
        rental_service.validate_rental_dates(past_date, end_date)
        assert False, "Data w przeszłości powinna rzucić wyjątek"
    except Exception as e:
        print_debug(f"Oczekiwany błąd: {e}")
        assert "przeszłości" in str(e)
        print_debug("Data w przeszłości poprawnie odrzucona")
    
    print_debug("✅ Walidacja dat działa poprawnie")