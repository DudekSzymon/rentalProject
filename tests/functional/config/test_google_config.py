"""
Test funkcjonalny - konfiguracja Google OAuth
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_google_config():
    """Test funkcjonalny - konfiguracja Google OAuth"""
    print_debug("FUNKCJONALNY: Testowanie konfiguracji Google...")
    
    response = client.get("/api/auth/google-config")
    print_debug(f"Status code: {response.status_code}")
    
    # Może zwrócić 200 (skonfigurowane) lub 501 (nie skonfigurowane)
    assert response.status_code in [200, 501]
    
    if response.status_code == 200:
        data = response.json()
        assert "client_id" in data
        print_debug("Google OAuth skonfigurowany")
    else:
        print_debug("Google OAuth nie skonfigurowany")
    
    print_debug("✅ Endpoint konfiguracji Google działa")