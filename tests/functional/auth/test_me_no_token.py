"""
Test funkcjonalny - endpoint /me bez tokenu
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_me_no_token():
    """Test funkcjonalny - endpoint /me bez tokenu"""
    print_debug("FUNKCJONALNY: Testowanie /me bez tokenu...")
    
    response = client.get("/api/auth/me")
    print_debug(f"Status code: {response.status_code}")
    
    # Powinien zwrócić błąd autoryzacji
    assert response.status_code in [403, 422]
    print_debug("✅ Endpoint /me wymaga autoryzacji")