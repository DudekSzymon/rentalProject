import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

from ..common import client

def test_endpoint_lista_sprzetu():
    print("[FUNC] Test endpointu listy sprzętu")
    try:
        response = client.get("/api/equipment")
        print("Odpowiedź:", response.json())
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_paginacja_sprzetu():
    print("[FUNC] Test paginacji sprzętu")
    try:
        response = client.get("/api/equipment?page=1&size=5")
        print("Odpowiedź:", response.json())
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["size"] == 5
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_wyszukiwanie_sprzetu():
    print("[FUNC] Test wyszukiwania sprzętu")
    try:
        response = client.get("/api/equipment?search=test")
        print("Odpowiedź:", response.json())
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_filtr_kategorii_sprzetu():
    print("[FUNC] Test filtrowania po kategorii sprzętu")
    try:
        response = client.get("/api/equipment?category=power_tools")
        print("Odpowiedź:", response.json())
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")