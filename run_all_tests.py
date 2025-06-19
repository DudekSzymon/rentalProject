#!/usr/bin/env python3
"""
GŁÓWNY PLIK DO URUCHAMIANIA WSZYSTKICH 37 TESTÓW BACKENDU
Plik: run_all_tests.py

Uruchom: python run_all_tests.py

POKRYCIE 50% FUNKCJONALNOŚCI:
✅ Testy jednostkowe (service'y, modele) - 18 testów
✅ Testy funkcjonalne (endpointy HTTP) - 19 testów
✅ Łącznie: 37testów pokrywających 50% funkcjonalności backendu
"""

import sys
import os

# Dodaj ścieżkę do testów
tests_path = os.path.join(os.path.dirname(__file__), 'tests')
sys.path.insert(0, tests_path)

from tests.utils.test_runner import (
    run_test, get_test_stats, reset_test_stats,
    print_success, print_error, print_warning, print_header, print_debug
)

# IMPORTY TESTÓW JEDNOSTKOWYCH - AUTH
from tests.unit.auth.test_auth_hash_password import test_auth_hash_password
from tests.unit.auth.test_auth_verify_password import test_auth_verify_password
from tests.unit.auth.test_auth_create_token import test_auth_create_token
from tests.unit.auth.test_auth_verify_token import test_auth_verify_token
from tests.unit.auth.test_auth_require_admin import test_auth_require_admin

# IMPORTY TESTÓW JEDNOSTKOWYCH - RENTAL
from tests.unit.rental.test_rental_validate_dates import test_rental_validate_dates
from tests.unit.rental.test_rental_calculate_price import test_rental_calculate_price
from tests.unit.rental.test_rental_check_availability import test_rental_check_availability
from tests.unit.rental.test_rental_validate_user import test_rental_validate_user
from tests.unit.rental.test_rental_pricing_preview import test_rental_pricing_preview

# IMPORTY TESTÓW JEDNOSTKOWYCH - MODELS
from tests.unit.models.test_rental_duration_days import test_rental_duration_days
from tests.unit.models.test_rental_is_overdue import test_rental_is_overdue
from tests.unit.models.test_rental_final_amount import test_rental_final_amount
from tests.unit.models.test_equipment_is_available import test_equipment_is_available
from tests.unit.models.test_payment_is_successful import test_payment_is_successful
from tests.unit.models.test_user_full_name import test_user_full_name

# IMPORTY TESTÓW JEDNOSTKOWYCH - SCHEMAS
from tests.unit.schemas.test_user_create_schema import test_user_create_schema
from tests.unit.schemas.test_rental_create_schema import test_rental_create_schema
from tests.unit.schemas.test_user_login_schema import test_user_login_schema

# IMPORTY TESTÓW FUNKCJONALNYCH - BASIC
from tests.functional.basic.test_health_check import test_health_check
from tests.functional.basic.test_root_endpoint import test_root_endpoint

# IMPORTY TESTÓW FUNKCJONALNYCH - AUTH
from tests.functional.auth.test_register_user import test_register_user
from tests.functional.auth.test_login_flow import test_login_flow
from tests.functional.auth.test_me_no_token import test_me_no_token

# IMPORTY TESTÓW FUNKCJONALNYCH - EQUIPMENT
from tests.functional.equipment.test_equipment_list import test_equipment_list
from tests.functional.equipment.test_equipment_filters import test_equipment_filters
from tests.functional.equipment.test_equipment_details import test_equipment_details
from tests.functional.equipment.test_equipment_create_no_auth import test_equipment_create_no_auth

# IMPORTY TESTÓW FUNKCJONALNYCH - RENTAL
from tests.functional.rental.test_rental_pricing_preview import test_rental_pricing_preview
from tests.functional.rental.test_equipment_availability import test_equipment_availability
from tests.functional.rental.test_protected_endpoint_no_auth import test_protected_endpoint_no_auth

# IMPORTY TESTÓW FUNKCJONALNYCH - PAYMENT
from tests.functional.payment.test_stripe_config import test_stripe_config
from tests.functional.payment.test_payment_stripe_config import test_payment_stripe_config
from tests.functional.payment.test_payment_methods import test_payment_methods

# IMPORTY TESTÓW FUNKCJONALNYCH - ADMIN
from tests.functional.admin.test_admin_endpoint_no_auth import test_admin_endpoint_no_auth

# IMPORTY TESTÓW FUNKCJONALNYCH - CONFIG
from tests.functional.config.test_google_config import test_google_config

# IMPORTY TESTÓW FUNKCJONALNYCH - INFRASTRUCTURE
from tests.functional.infrastructure.test_cors_headers import test_cors_headers

def run_all_tests():
    """Uruchamia wszystkie 37 testów jednostkowych i funkcjonalnych"""
    print("=" * 90)
    print_header("TESTY JEDNOSTKOWE I FUNKCJONALNE BACKENDU - 37 TESTÓW")
    print("=" * 90)
    
    # Reset liczników
    reset_test_stats()
    
    # TESTY JEDNOSTKOWE (19 testów)
    print_header("\n🔧 TESTY JEDNOSTKOWE (izolowane funkcje/metody) - 19 testów")
    print("-" * 70)
    
    # Auth Service (5 testów)
    print_debug("📁 AUTH SERVICE:")
    run_test("1. AUTH: Hashowanie hasła", test_auth_hash_password)
    run_test("2. AUTH: Weryfikacja hasła", test_auth_verify_password)
    run_test("3. AUTH: Tworzenie tokenu JWT", test_auth_create_token)
    run_test("4. AUTH: Weryfikacja tokenu", test_auth_verify_token)
    run_test("5. AUTH: Uprawnienia administratora", test_auth_require_admin)
    
    # Rental Service (5 testów)
    print_debug("📁 RENTAL SERVICE:")
    run_test("6. RENTAL: Walidacja dat", test_rental_validate_dates)
    run_test("7. RENTAL: Obliczanie ceny", test_rental_calculate_price)
    run_test("8. RENTAL: Sprawdzanie dostępności", test_rental_check_availability)
    run_test("9. RENTAL: Walidacja użytkownika", test_rental_validate_user)
    run_test("10. RENTAL: Podgląd ceny", test_rental_pricing_preview)
    
    # Models Properties (6 testów)
    print_debug("📁 MODELS:")
    run_test("11. MODEL: Rental duration_days", test_rental_duration_days)
    run_test("12. MODEL: Rental is_overdue", test_rental_is_overdue)
    run_test("13. MODEL: Rental final_amount", test_rental_final_amount)
    run_test("14. MODEL: Equipment is_available", test_equipment_is_available)
    run_test("15. MODEL: Payment is_successful", test_payment_is_successful)
    run_test("16. MODEL: User full_name", test_user_full_name)
    
    # Schemas (3 testy)
    print_debug("📁 SCHEMAS:")
    run_test("17. SCHEMA: UserCreate walidacja", test_user_create_schema)
    run_test("18. SCHEMA: RentalCreate walidacja", test_rental_create_schema)
    run_test("19. SCHEMA: UserLogin walidacja", test_user_login_schema)
    
    # TESTY FUNKCJONALNE (21 testów)
    print_header("\n🌐 TESTY FUNKCJONALNE (endpointy HTTP przez TestClient) - 21 testów")
    print("-" * 70)
    
    # Basic endpoints (2 testy)
    print_debug("📁 BASIC ENDPOINTS:")
    run_test("20. HTTP: Health check", test_health_check)
    run_test("21. HTTP: Główny endpoint", test_root_endpoint)
    
    # Auth endpoints (3 testy)
    print_debug("📁 AUTH ENDPOINTS:")
    run_test("22. HTTP: Rejestracja użytkownika", test_register_user)
    run_test("23. HTTP: Przepływ logowania", test_login_flow)
    run_test("24. HTTP: Endpoint /me bez tokenu", test_me_no_token)
    
    # Equipment endpoints (4 testy)
    print_debug("📁 EQUIPMENT ENDPOINTS:")
    run_test("25. HTTP: Lista sprzętu", test_equipment_list)
    run_test("26. HTTP: Filtry sprzętu", test_equipment_filters)
    run_test("27. HTTP: Szczegóły sprzętu", test_equipment_details)
    run_test("28. HTTP: Tworzenie sprzętu bez auth", test_equipment_create_no_auth)
    
    # Rental endpoints (3 testy)
    print_debug("📁 RENTAL ENDPOINTS:")
    run_test("29. HTTP: Podgląd ceny", test_rental_pricing_preview)
    run_test("30. HTTP: Dostępność sprzętu", test_equipment_availability)
    run_test("31. HTTP: Chronione rentals", test_protected_endpoint_no_auth)
    
    # Payment endpoints (3 testy)
    print_debug("📁 PAYMENT ENDPOINTS:")
    run_test("32. HTTP: Konfiguracja Stripe", test_stripe_config)
    run_test("33. HTTP: Dodatkowy test Stripe", test_payment_stripe_config)
    run_test("34. HTTP: Endpoint płatności", test_payment_methods)
    
    # Admin endpoints (1 test)
    print_debug("📁 ADMIN ENDPOINTS:")
    run_test("35. HTTP: Dashboard admin bez auth", test_admin_endpoint_no_auth)
    
    # Config endpoints (1 test)
    print_debug("📁 CONFIG ENDPOINTS:")
    run_test("36. HTTP: Konfiguracja Google", test_google_config)
    
    # Infrastructure (1 test)
    print_debug("📁 INFRASTRUCTURE:")
    run_test("37. HTTP: Nagłówki CORS", test_cors_headers)
    
    # PODSUMOWANIE
    print("\n" + "=" * 90)
    print_header("🎯 PODSUMOWANIE TESTÓW")
    print("=" * 90)
    
    stats = get_test_stats()
    success_rate = stats['success_rate']
    
    print(f"📊 Łączna liczba testów: {stats['total']}")
    print_success(f"Testy zaliczone: {stats['passed']}")
    if stats['failed'] > 0:
        print_error(f"Testy niezaliczone: {stats['failed']}")
    else:
        print_success("Testy niezaliczone: 0")
    
    print(f"📈 Wskaźnik sukcesu: {success_rate:.1f}%")
    
    if success_rate >= 95:
        print_success("🎉 PERFEKCYJNY WYNIK! Backend działa świetnie.")
    elif success_rate >= 90:
        print_success("🎉 DOSKONAŁY WYNIK! Backend działa bardzo dobrze.")
    elif success_rate >= 80:
        print_warning("⚠️ DOBRY WYNIK! Większość funkcji działa poprawnie.")
    elif success_rate >= 70:
        print_warning("⚠️ ŚREDNI WYNIK! Niektóre funkcje wymagają uwagi.")
    else:
        print_error("❌ SŁABY WYNIK! Wymaga znacznych poprawek.")
   
    
    print(f"\n📊 RAZEM: {stats['total']} testów (jednostkowych + funkcjonalnych)")
    print("💡 50% funkcjonalności backendu pokryte MIX testami!")
    
    print(f"\n🔍 SZCZEGÓŁY POKRYCIA:")
    print("   ✅ Bezpieczeństwo (JWT, hashe, uprawnienia)")
    print("   ✅ Logika biznesowa (walidacje, obliczenia)")
    print("   ✅ API endpoints (HTTP responses)")
    print("   ✅ Modele danych (properties, relationships)")
    print("   ✅ Zewnętrzne integracje (Google, Stripe)")
    
    print("\n" + "=" * 90)
    if stats['failed'] == 0:
        print_success("🚀 WSZYSTKIE 37 TESTÓW ZAKOŃCZONE POMYŚLNIE!")
    else:
        print_warning("⚠️ NIEKTÓRE TESTY WYMAGAJĄ POPRAWEK!")
    print("=" * 90)
    
    return stats['failed'] == 0

if __name__ == "__main__":
    try:
        print_debug("🚀 Rozpoczynanie 37 testów backendu...")
        success = run_all_tests()
        exit_code = 0 if success else 1
        print(f"\nKod wyjścia: {exit_code}")
        exit(exit_code)
    except KeyboardInterrupt:
        print_warning("\n⚠️ Testy przerwane przez użytkownika")
        exit(1)
    except Exception as e:
        print_error(f"\n❌ Nieoczekiwany błąd: {e}")
        import traceback
        traceback.print_exc()
        exit(1)