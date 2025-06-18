#!/usr/bin/env python3
"""
Test script dla rental endpointów
Uruchom: python test_rental_endpoints.py
"""

import requests
import json
from datetime import datetime, timedelta
from pprint import pprint

# Konfiguracja
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# Kolory dla outputu
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")

def get_auth_token():
    """Logowanie i pobranie tokenu"""
    print_info("🔐 Logowanie...")
    
    login_data = {
        "email": "user@example.com",
        "password": "string"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", json=login_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            print_success("Logowanie udane!")
            return token
        else:
            print_error(f"Błąd logowania: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print_error(f"Błąd połączenia: {e}")
        return None

def test_health_check():
    """Test podstawowego endpointu"""
    print_info("🏥 Test health check...")
    
    try:
        response = requests.get(f"{API_BASE}/health")
        if response.status_code == 200:
            print_success("Health check OK")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Health check error: {e}")
        return False

def create_test_equipment(token):
    """Utworzenie testowego sprzętu"""
    print_info("🔨 Tworzenie testowego sprzętu...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    equipment_data = {
        "name": "Wiertarka Test",
        "description": "Testowa wiertarka do wypożyczenia",
        "category": "drilling",
        "brand": "TestBrand",
        "model": "TEST-100",
        "daily_rate": 50.00,
        "weekly_rate": 300.00,
        "monthly_rate": 1000.00,
        "quantity_total": 5,
        "requires_license": False,
        "min_age": 18
    }
    
    try:
        response = requests.post(f"{API_BASE}/equipment", json=equipment_data, headers=headers)
        if response.status_code == 200:
            equipment = response.json()
            print_success(f"Sprzęt utworzony: ID {equipment['id']}")
            return equipment["id"]
        else:
            print_error(f"Błąd tworzenia sprzętu: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print_error(f"Błąd: {e}")
        return None

def test_pricing_preview(equipment_id):
    """Test podglądu ceny"""
    print_info("💰 Test podglądu ceny...")
    
    # Daty testowe - od jutro na 7 dni
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=7)
    
    params = {
        "equipment_id": equipment_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "quantity": 2,
        "rental_period": "daily"
    }
    
    try:
        response = requests.post(f"{API_BASE}/rentals/pricing-preview", params=params)
        if response.status_code == 200:
            result = response.json()
            if result["success"]:
                pricing = result["pricing"]
                print_success("Podgląd ceny działa!")
                print(f"  • Sprzęt: {pricing['equipment_name']}")
                print(f"  • Cena całkowita: {pricing['total_price']} PLN")
                print(f"  • Kaucja: {pricing['deposit_amount']} PLN")
                print(f"  • Dni: {pricing['duration_days']}")
                return True
            else:
                print_error(f"Błąd w response: {result['error']}")
                return False
        else:
            print_error(f"HTTP error: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print_error(f"Błąd: {e}")
        return False

def test_availability_check(equipment_id):
    """Test sprawdzania dostępności"""
    print_info("📅 Test sprawdzania dostępności...")
    
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=3)
    
    params = {
        "equipment_id": equipment_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "quantity": 1
    }
    
    try:
        response = requests.post(f"{API_BASE}/rentals/check-availability", params=params)
        if response.status_code == 200:
            result = response.json()
            if result["available"]:
                print_success("Sprzęt dostępny!")
                print(f"  • Dostępna ilość: {result['available_quantity']}/{result['total_quantity']}")
                return True
            else:
                print_warning(f"Sprzęt niedostępny: {result.get('error', 'Nieznany błąd')}")
                return False
        else:
            print_error(f"HTTP error: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Błąd: {e}")
        return False

def test_create_rental(equipment_id, token):
    """Test tworzenia wypożyczenia"""
    print_info("📝 Test tworzenia wypożyczenia...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=3)
    
    rental_data = {
        "equipment_id": equipment_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "quantity": 1,
        "rental_period": "daily",
        "notes": "Test wypożyczenia",
        "pickup_address": "Warszawa, ul. Testowa 1",
        "return_address": "Warszawa, ul. Testowa 1",
        "delivery_required": False
    }
    
    try:
        response = requests.post(f"{API_BASE}/rentals", json=rental_data, headers=headers)
        if response.status_code == 200:
            rental = response.json()
            print_success(f"Wypożyczenie utworzone: ID {rental['id']}")
            print(f"  • Status: {rental['status']}")
            print(f"  • Cena: {rental['total_price']} PLN")
            print(f"  • Kaucja: {rental['deposit_amount']} PLN")
            return rental["id"]
        else:
            print_error(f"Błąd tworzenia wypożyczenia: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print_error(f"Błąd: {e}")
        return None

def test_get_equipment_calendar(equipment_id):
    """Test kalendarza sprzętu"""
    print_info("📆 Test kalendarza sprzętu...")
    
    try:
        response = requests.get(f"{API_BASE}/rentals/equipment/{equipment_id}/calendar")
        if response.status_code == 200:
            calendar_data = response.json()
            print_success("Kalendarz pobrany!")
            print(f"  • Sprzęt: {calendar_data['equipment']['name']}")
            print(f"  • Wypożyczenia: {len(calendar_data['rentals'])}")
            return True
        else:
            print_error(f"Błąd pobierania kalendarza: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Błąd: {e}")
        return False

def test_get_my_rentals(token):
    """Test pobierania moich wypożyczeń"""
    print_info("📋 Test pobierania moich wypożyczeń...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_BASE}/rentals", headers=headers)
        if response.status_code == 200:
            rentals = response.json()
            print_success(f"Pobrano {rentals['total']} wypożyczeń")
            if rentals['items']:
                for rental in rentals['items'][:3]:  # Pokaż pierwsze 3
                    print(f"  • ID {rental['id']}: {rental['equipment_name']} - {rental['status']}")
            return True
        else:
            print_error(f"Błąd pobierania wypożyczeń: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Błąd: {e}")
        return False

def main():
    """Główna funkcja testowa"""
    print("=" * 60)
    print("🧪 TEST RENTAL ENDPOINTÓW")
    print("=" * 60)
    
    # 1. Health check
    if not test_health_check():
        print_error("Serwer nie odpowiada!")
        return
    
    # 2. Logowanie
    token = get_auth_token()
    if not token:
        print_error("Nie można się zalogować!")
        return
    
    # 3. Utworzenie testowego sprzętu (tylko admin może)
    print_warning("Uwaga: Tworzenie sprzętu wymaga uprawnień admin!")
    equipment_id = create_test_equipment(token)
    
    if not equipment_id:
        print_warning("Używam istniejącego sprzętu (ID=1)")
        equipment_id = 1
    
    # 4. Testy bez autoryzacji
    print("\n" + "="*40)
    print("📊 TESTY PUBLICZNE")
    print("="*40)
    
    test_pricing_preview(equipment_id)
    test_availability_check(equipment_id)
    test_get_equipment_calendar(equipment_id)
    
    # 5. Testy z autoryzacją
    print("\n" + "="*40)
    print("🔐 TESTY Z AUTORYZACJĄ")
    print("="*40)
    
    rental_id = test_create_rental(equipment_id, token)
    test_get_my_rentals(token)
    
    print("\n" + "="*60)
    print("🎉 TESTY ZAKOŃCZONE!")
    print("="*60)
    
    if rental_id:
        print_success(f"Utworzono wypożyczenie ID: {rental_id}")
        print_info("Możesz teraz przetestować płatności dla tego wypożyczenia!")

if __name__ == "__main__":
    main()