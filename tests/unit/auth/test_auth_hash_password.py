"""
Test jednostkowy - hashowanie hasła
"""
import sys
import os

# Dodaj backend do path
backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.services.auth_service import AuthService
from tests.utils.test_runner import print_debug

def test_auth_hash_password():
    """Test jednostkowy - hashowanie hasła"""
    print_debug("JEDNOSTKOWY: Testowanie hashowania hasła bcrypt...")
    auth_service = AuthService()
    password = "testpassword123"
    print_debug(f"Hasło wejściowe: {password}")
    
    hashed = auth_service.hash_password(password)
    print_debug(f"Hash wygenerowany: {hashed[:50]}...")
    print_debug(f"Długość hasha: {len(hashed)} znaków")
    
    assert hashed != password, "Hasło nie zostało zahashowane"
    assert len(hashed) > 50, "Hash jest za krótki"
    assert hashed.startswith('$2b$'), "Nieprawidłowy format bcrypt"
    print_debug("✅ Hash bcrypt poprawny")