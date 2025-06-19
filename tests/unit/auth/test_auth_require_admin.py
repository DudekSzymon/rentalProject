"""
Test jednostkowy - sprawdzanie uprawnień administratora
"""
import sys
import os
from unittest.mock import Mock

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.services.auth_service import AuthService
from tests.utils.test_runner import print_debug

def test_auth_require_admin():
    """Test jednostkowy - sprawdzanie uprawnień administratora"""
    print_debug("JEDNOSTKOWY: Testowanie uprawnień administratora...")
    auth_service_instance = AuthService()
    
    # Test admina
    admin = Mock()
    admin.role = "admin"
    print_debug(f"Test admin z rolą: {admin.role}")
    
    try:
        auth_service_instance.require_admin(admin)
        print_debug("Admin przeszedł kontrolę uprawnień")
    except Exception as e:
        print_debug(f"Nieoczekiwany błąd dla admina: {e}")
        assert False, "Admin powinien mieć uprawnienia"
    
    # Test zwykłego użytkownika
    user = Mock()
    user.role = "customer"
    print_debug(f"Test user z rolą: {user.role}")
    
    try:
        auth_service_instance.require_admin(user)
        assert False, "Zwykły użytkownik nie powinien mieć uprawnień admina"
    except Exception as e:
        print_debug(f"Oczekiwany błąd dla user: {e}")
        assert "Brak uprawnień administratora" in str(e)
        print_debug("Zwykły użytkownik poprawnie odrzucony")
    
    print_debug("✅ Kontrola uprawnień działa poprawnie")