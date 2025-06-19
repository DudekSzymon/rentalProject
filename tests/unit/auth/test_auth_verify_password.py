"""
Test jednostkowy - weryfikacja hasła
"""
import sys
import os

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.services.auth_service import AuthService
from tests.utils.test_runner import print_debug

def test_auth_verify_password():
    """Test jednostkowy - weryfikacja hasła"""
    print_debug("JEDNOSTKOWY: Testowanie weryfikacji hasła...")
    auth_service_instance = AuthService()
    password = "testpassword123"
    
    hashed = auth_service_instance.hash_password(password)
    result_correct = auth_service_instance.verify_password(password, hashed)
    result_incorrect = auth_service_instance.verify_password("wrongpassword", hashed)
    
    print_debug(f"Weryfikacja poprawnego hasła: {result_correct}")
    print_debug(f"Weryfikacja niepoprawnego hasła: {result_incorrect}")
    
    assert result_correct is True, "Weryfikacja poprawnego hasła nie powiodła się"
    assert result_incorrect is False, "Weryfikacja niepoprawnego hasła powinna zwrócić False"
    print_debug("✅ Weryfikacja hasła działa poprawnie")