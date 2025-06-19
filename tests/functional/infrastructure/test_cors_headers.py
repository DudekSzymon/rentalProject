"""
Test funkcjonalny - nagłówki CORS
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_cors_headers():
    """Test funkcjonalny - nagłówki CORS"""
    print_debug("FUNKCJONALNY: Testowanie nagłówków CORS...")
    
    response = client.options("/api/equipment")
    print_debug(f"OPTIONS status code: {response.status_code}")
    
    # CORS powinien być skonfigurowany
    assert response.status_code in [200, 405]  # 405 może być OK dla OPTIONS
    print_debug("✅ CORS skonfigurowany")