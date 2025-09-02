import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

try:
    from app.models.user import UserRole, AuthProvider
    from app.models.equipment import EquipmentCategory, EquipmentStatus
    from app.models.rental import RentalStatus
    from app.models.payment import PaymentStatus, PaymentType, PaymentMethod
except ImportError as e:
    print(f"Błąd importu enumów: {e}")

def test_enum_roli_uzytkownika():
    print("[UNIT] Test enum UserRole")
    try:
        print("Dostępne role:", [r.value for r in UserRole])
        assert UserRole.ADMIN.value == "admin"
        assert UserRole.CUSTOMER.value == "customer"
        assert len(list(UserRole)) == 2
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_enum_dostawcy_autoryzacji():
    print("[UNIT] Test enum AuthProvider")
    try:
        print("Dostępni dostawcy:", [p.value for p in AuthProvider])
        assert AuthProvider.LOCAL.value == "local"
        assert AuthProvider.GOOGLE.value == "google"
        assert len(list(AuthProvider)) == 2
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_enum_kategorii_sprzetu():
    print("[UNIT] Test enum EquipmentCategory")
    try:
        print("Kategorie sprzętu:", [c.value for c in EquipmentCategory])
        assert EquipmentCategory.POWER_TOOLS.value == "power_tools"
        assert EquipmentCategory.EXCAVATION.value == "excavation"
        assert len(list(EquipmentCategory)) == 8
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_enum_statusu_sprzetu():
    print("[UNIT] Test enum EquipmentStatus")
    try:
        print("Statusy sprzętu:", [s.value for s in EquipmentStatus])
        assert EquipmentStatus.AVAILABLE.value == "available"
        assert EquipmentStatus.RENTED.value == "rented"
        assert len(list(EquipmentStatus)) == 4
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_enum_statusu_platnosci():
    print("[UNIT] Test enum PaymentStatus")
    try:
        print("Statusy płatności:", [s.value for s in PaymentStatus])
        assert PaymentStatus.PENDING.value == "pending"
        assert PaymentStatus.COMPLETED.value == "completed"
        assert len(list(PaymentStatus)) == 7
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_enum_statusu_wypozyczenia():
    print("[UNIT] Test enum RentalStatus")
    try:
        print("Statusy wypożyczeń:", [s.value for s in RentalStatus])
        assert RentalStatus.PENDING.value == "pending"
        assert RentalStatus.CONFIRMED.value == "confirmed"
        assert len(list(RentalStatus)) == 6
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")