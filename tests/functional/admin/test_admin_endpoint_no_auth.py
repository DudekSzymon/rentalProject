"""
Test funkcjonalny - endpoint admina bez autoryzacji
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_admin_endpoint_no_auth():
    """Test funkcjonalny - endpoint admina bez autoryzacji"""
    print_debug("FUNKCJONALNY: Testowanie endpointu admina bez autoryzacji...")
    
    response = client.get("/api/admin/dashboard")
    print_debug(f"Status code: {response.status_code}")
    
    # Powinien zwrócić błąd autoryzacji
    assert response.status_code in [403, 422]
    print_debug("✅ Ochrona endpointów admina działa")