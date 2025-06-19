"""
Test jednostkowy - tworzenie tokenu JWT
"""
import sys
import os

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.services.auth_service import AuthService
from jose import jwt
from tests.utils.test_runner import print_debug

def test_auth_create_token():
    """Test jednostkowy - tworzenie tokenu JWT"""
    print_debug("JEDNOSTKOWY: Testowanie tworzenia tokenu JWT...")
    auth_service_instance = AuthService()
    data = {"sub": "123"}
    print_debug(f"Dane do tokenu: {data}")
    
    token = auth_service_instance.create_access_token(data)
    print_debug(f"Token wygenerowany: {token[:50]}...")
    print_debug(f"Długość tokenu: {len(token)} znaków")
    
    assert isinstance(token, str), "Token powinien być stringiem"
    assert len(token) > 100, "Token JWT jest za krótki"
    
    # Dekoduj token i sprawdź payload
    payload = jwt.decode(token, auth_service_instance.secret_key, algorithms=[auth_service_instance.algorithm])
    print_debug(f"Dekodowany payload: {payload}")
    assert payload["sub"] == "123", "Nieprawidłowy payload tokenu"
    assert "exp" in payload, "Brak czasu wygaśnięcia"
    print_debug("✅ Token JWT utworzony poprawnie")