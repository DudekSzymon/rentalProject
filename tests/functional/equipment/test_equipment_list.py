"""
Test funkcjonalny - lista sprzętu
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_equipment_list():
    """Test funkcjonalny - lista sprzętu"""
    print_debug("FUNKCJONALNY: Testowanie listy sprzętu...")
    
    response = client.get("/api/equipment")
    print_debug(f"Status code: {response.status_code}")
    
    assert response.status_code == 200
    data = response.json()
    print_debug(f"Lista sprzętu - znaleziono {data.get('total', 0)} pozycji")
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert isinstance(data["items"], list)
    print_debug("✅ Lista sprzętu działa")