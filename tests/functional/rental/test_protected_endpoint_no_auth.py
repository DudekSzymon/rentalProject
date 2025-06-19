"""
Test funkcjonalny - chroniony endpoint bez autoryzacji
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_protected_endpoint_no_auth():
    """Test funkcjonalny - chroniony endpoint bez autoryzacji"""
    print_debug("FUNKCJONALNY: Testowanie dostępu bez autoryzacji...")
    
    response = client.get("/api/rentals")
    print_debug(f"Status code: {response.status_code}")
    
    # Powinien zwrócić błąd autoryzacji (403 lub 422)
    assert response.status_code in [403, 422]
    print_debug("✅ Ochrona endpointów działa")