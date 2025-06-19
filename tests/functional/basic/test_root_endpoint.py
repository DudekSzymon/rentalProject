"""
Test funkcjonalny - główny endpoint
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_root_endpoint():
    """Test funkcjonalny - główny endpoint"""
    print_debug("FUNKCJONALNY: Testowanie głównego endpointu /...")
    
    response = client.get("/")
    print_debug(f"Status code: {response.status_code}")
    
    assert response.status_code == 200
    data = response.json()
    print_debug(f"Response data: {data}")
    assert "message" in data
    assert data["status"] == "online"
    print_debug("✅ Główny endpoint działa")