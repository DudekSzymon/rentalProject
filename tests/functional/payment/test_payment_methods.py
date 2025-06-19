"""
Test funkcjonalny - endpoint płatności
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_payment_methods():
    """Test funkcjonalny - endpoint płatności"""
    print_debug("FUNKCJONALNY: Testowanie endpointu płatności...")
    
    response = client.get("/api/payments")
    print_debug(f"Status code: {response.status_code}")
    
    # Powinien wymagać autoryzacji
    assert response.status_code in [403, 422]
    print_debug("✅ Endpoint płatności wymaga autoryzacji")