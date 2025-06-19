"""
Test funkcjonalny - lista sprzętu z filtrami
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_equipment_filters():
    """Test funkcjonalny - lista sprzętu z filtrami"""
    print_debug("FUNKCJONALNY: Testowanie filtrów sprzętu...")
    
    params = {
        "available_only": True,
        "page": 1,
        "size": 5
    }
    print_debug(f"Parametry filtrów: {params}")
    
    response = client.get("/api/equipment", params=params)
    print_debug(f"Status code: {response.status_code}")
    
    assert response.status_code == 200
    data = response.json()
    print_debug(f"Filtrowana lista - zwrócono {len(data['items'])} pozycji")
    assert data["page"] == 1
    assert data["size"] == 5
    assert len(data["items"]) <= 5
    print_debug("✅ Filtry sprzętu działają")