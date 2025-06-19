"""
Test jednostkowy - schema UserLogin
"""
import sys
import os

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.views.user_schemas import UserLogin
from tests.utils.test_runner import print_debug

def test_user_login_schema():
    """Test jednostkowy - schema UserLogin"""
    print_debug("JEDNOSTKOWY: Testowanie schematu UserLogin...")
    
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    print_debug(f"Dane logowania: {login_data['email']}")
    
    login = UserLogin(**login_data)
    assert login.email == "test@example.com"
    assert login.password == "password123"
    print_debug("✅ Schema UserLogin działa poprawnie")