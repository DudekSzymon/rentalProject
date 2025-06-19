"""
Test jednostkowy - property full_name
"""
import sys
import os

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.models.user import User
from tests.utils.test_runner import print_debug

def test_user_full_name():
    """Test jednostkowy - property full_name"""
    print_debug("JEDNOSTKOWY: Testowanie property full_name...")
    user = User()
    user.first_name = "Jan"
    user.last_name = "Kowalski"
    print_debug(f"Imię: {user.first_name}, Nazwisko: {user.last_name}")
    
    full_name = user.full_name
    expected = "Jan Kowalski"
    print_debug(f"Pełna nazwa: '{full_name}'")
    print_debug(f"Oczekiwana: '{expected}'")
    
    assert full_name == expected, f"Nieprawidłowa pełna nazwa: {full_name} != '{expected}'"
    print_debug("✅ Property full_name działa poprawnie")