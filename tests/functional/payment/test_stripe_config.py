"""
Test funkcjonalny - konfiguracja Stripe
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_stripe_config():
    """Test funkcjonalny - konfiguracja Stripe"""
    print_debug("FUNKCJONALNY: Testowanie konfiguracji Stripe...")
    
    response = client.get("/api/payments/stripe/config")
    print_debug(f"Status code: {response.status_code}")
    
    # Może zwrócić 200 (skonfigurowane) lub 501 (nie skonfigurowane)
    assert response.status_code in [200, 501]
    
    if response.status_code == 200:
        data = response.json()
        assert "publishable_key" in data
        print_debug("Stripe skonfigurowany")
    else:
        print_debug("Stripe nie skonfigurowany")
    
    print_debug("✅ Endpoint konfiguracji Stripe działa")