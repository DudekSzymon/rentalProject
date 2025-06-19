"""
Test funkcjonalny - dodatkowy test Stripe
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_payment_stripe_config():
    """Test funkcjonalny - dodatkowy test Stripe"""
    print_debug("FUNKCJONALNY: Dodatkowy test konfiguracji Stripe...")
    
    response = client.get("/api/payments/stripe/config")
    print_debug(f"Status code: {response.status_code}")
    
    # Test czy endpoint odpowiada poprawnie
    assert response.status_code in [200, 501]
    print_debug("✅ Stripe endpoint odpowiada")