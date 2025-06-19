"""
Test jednostkowy - walidacja uprawnień użytkownika
"""
import sys
import os
from unittest.mock import Mock

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.services.rental_service import RentalService
from tests.utils.test_runner import print_debug

def test_rental_validate_user():
    """Test jednostkowy - walidacja uprawnień użytkownika"""
    print_debug("JEDNOSTKOWY: Testowanie walidacji użytkownika...")
    mock_db = Mock()
    rental_service = RentalService(mock_db)
    
    # Mock zablokowanego użytkownika
    user = Mock()
    user.is_blocked = True
    user.email = "blocked@example.com"
    print_debug(f"Test zablokowanego użytkownika: {user.email}")
    
    equipment = Mock()
    equipment.name = "Test Equipment"
    
    try:
        rental_service.validate_user_eligibility(user, equipment)
        assert False, "Zablokowany użytkownik powinien rzucić wyjątek"
    except Exception as e:
        print_debug(f"Oczekiwany błąd: {e}")
        assert "zablokowane" in str(e)
        print_debug("Walidacja zablokowanego użytkownika działa poprawnie")
    
    print_debug("✅ Walidacja użytkownika działa poprawnie")