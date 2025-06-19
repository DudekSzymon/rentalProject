"""
Test jednostkowy - schema UserCreate
"""
import sys
import os

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.views.user_schemas import UserCreate
from tests.utils.test_runner import print_debug

def test_user_create_schema():
    """Test jednostkowy - schema UserCreate"""
    print_debug("JEDNOSTKOWY: Testowanie schematu UserCreate...")
    
    # Test poprawnych danych
    user_data = {
        "email": "test@example.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User"
    }
    print_debug(f"Dane użytkownika: {user_data}")
    
    user = UserCreate(**user_data)
    assert user.email == "test@example.com"
    assert user.password == "password123"
    print_debug("Poprawne dane przeszły walidację")
    
    # Test za krótkiego hasła
    user_data["password"] = "123"
    print_debug(f"Test krótkiego hasła: {user_data['password']}")
    
    try:
        UserCreate(**user_data)
        assert False, "Zbyt krótkie hasło powinno rzucić wyjątek"
    except ValueError as e:
        print_debug(f"Oczekiwany błąd walidacji: {e}")
        assert "co najmniej 6 znaków" in str(e)
        print_debug("Krótkie hasło poprawnie odrzucone")
    
    print_debug("✅ Schema UserCreate działa poprawnie")