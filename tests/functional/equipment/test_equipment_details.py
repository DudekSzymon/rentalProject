"""
Test funkcjonalny - szczegóły sprzętu
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_equipment_details():
    """Test funkcjonalny - szczegóły sprzętu"""
    print_debug("FUNKCJONALNY: Testowanie szczegółów sprzętu...")
    
    # Najpierw pobierz listę żeby zobaczyć czy jest jakiś sprzęt
    list_response = client.get("/api/equipment?size=1")
    
    if list_response.status_code == 200:
        items = list_response.json()["items"]
        
        if items:
            equipment_id = items[0]["id"]
            print_debug(f"Testowanie szczegółów sprzętu ID: {equipment_id}")
            
            response = client.get(f"/api/equipment/{equipment_id}")
            print_debug(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                assert data["id"] == equipment_id
                assert "name" in data
                print_debug(f"Pobrano szczegóły sprzętu: {data.get('name', 'brak nazwy')}")
                print_debug("✅ Szczegóły sprzętu działają")
            else:
                print_debug(f"Błąd pobierania szczegółów: {response.status_code}")
                assert False, f"Nie można pobrać szczegółów sprzętu: {response.status_code}"
        else:
            print_debug("Brak sprzętu w bazie - pomijam test szczegółów")
            print_debug("✅ Test pominięty (brak danych)")
    else:
        print_debug("Nie można pobrać listy sprzętu")
        assert False, "Lista sprzętu powinna działać"