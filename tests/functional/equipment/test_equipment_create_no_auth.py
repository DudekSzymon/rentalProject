"""
Test funkcjonalny - tworzenie sprzętu bez autoryzacji
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_equipment_create_no_auth():
    """Test funkcjonalny - tworzenie sprzętu bez autoryzacji"""
    print_debug("FUNKCJONALNY: Testowanie tworzenia sprzętu bez autoryzacji...")
    
    equipment_data = {
        "name": "Test Equipment",
        "category": "drilling",
        "daily_rate": 50.00
    }
    
    response = client.post("/api/equipment", json=equipment_data)
    print_debug(f"Status code: {response.status_code}")
    
    # Powinien wymagać autoryzacji admin
    assert response.status_code in [403, 422]
    print_debug("✅ Tworzenie sprzętu wymaga autoryzacji admin")