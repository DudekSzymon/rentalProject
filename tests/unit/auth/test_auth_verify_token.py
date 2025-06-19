"""
Test jednostkowy - weryfikacja tokenu
"""
import sys
import os

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.services.auth_service import AuthService
from tests.utils.test_runner import print_debug

def test_auth_verify_token():
    """Test jednostkowy - weryfikacja tokenu"""
    print_debug("JEDNOSTKOWY: Testowanie weryfikacji tokenu...")
    auth_service_instance = AuthService()
    data = {"sub": "123"}
    
    token = auth_service_instance.create_access_token(data)
    print_debug(f"Token do weryfikacji: {token[:50]}...")
    
    payload = auth_service_instance.verify_token(token)
    print_debug(f"Zweryfikowany payload: {payload}")
    
    assert payload["sub"] == "123", "Nieprawidłowy payload zweryfikowanego tokenu"
    print_debug("✅ Weryfikacja tokenu działa poprawnie")