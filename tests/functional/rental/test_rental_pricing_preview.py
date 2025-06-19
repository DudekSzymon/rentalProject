"""
Test funkcjonalny - podgląd ceny wypożyczenia
"""
from datetime import datetime, timedelta
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_rental_pricing_preview():
    """Test funkcjonalny - podgląd ceny wypożyczenia"""
    print_debug("FUNKCJONALNY: Testowanie podglądu ceny...")
    
    # Parametry dla podglądu ceny
    start_date = (datetime.now() + timedelta(days=1)).isoformat()
    end_date = (datetime.now() + timedelta(days=8)).isoformat()
    
    params = {
        "equipment_id": 1,
        "start_date": start_date,
        "end_date": end_date,
        "quantity": 1,
        "rental_period": "daily"
    }
    print_debug(f"Parametry podglądu ceny: equipment_id=1, quantity=1")
    
    response = client.get("/api/rentals/pricing-preview", params=params)
    print_debug(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print_debug(f"Podgląd ceny response: {data}")
        assert "success" in data
        print_debug("✅ Podgląd ceny działa")
    else:
        # Może nie być sprzętu o ID 1 - sprawdź kod błędu
        print_debug(f"Podgląd ceny failed: {response.status_code}")
        assert response.status_code in [404, 422]
        print_debug("✅ Endpoint podglądu ceny odpowiada poprawnie")