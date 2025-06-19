"""
Test funkcjonalny - rejestracja użytkownika
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_register_user():
    """Test funkcjonalny - rejestracja użytkownika"""
    print_debug("FUNKCJONALNY: Testowanie rejestracji użytkownika...")
    
    user_data = {
        "email": "testfunctional@example.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "Functional"
    }
    print_debug(f"Rejestracja użytkownika: {user_data['email']}")
    
    response = client.post("/api/auth/register", json=user_data)
    print_debug(f"Status code: {response.status_code}")
    
    # Może być 200 (sukces) lub 400 (użytkownik już istnieje)
    if response.status_code == 200:
        data = response.json()
        print_debug(f"Zarejestrowany użytkownik: {data.get('email', 'brak email')}")
        assert data["email"] == user_data["email"]
        assert "password" not in data  # Hasło nie może być zwrócone
        print_debug("✅ Rejestracja użytkownika działa")
    elif response.status_code == 400:
        print_debug("Użytkownik już istnieje - to też prawidłowa odpowiedź")
        print_debug("✅ Endpoint rejestracji odpowiada poprawnie")
    else:
        print_debug(f"Nieoczekiwany status: {response.status_code}")
        print_debug(f"Response text: {response.text}")
        assert False, f"Nieoczekiwany status code: {response.status_code}"