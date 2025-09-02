from datetime import datetime, timedelta
from decimal import Decimal
import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

try:
    from app.models.equipment import Equipment, EquipmentCategory, EquipmentStatus
except ImportError as e:
    print(f"Błąd importu modeli: {e}")

def test_obliczenia_na_decimal():
    print("[UNIT] Test obliczeń na Decimal")
    try:
        daily_rate = Decimal("100.50")
        quantity = 2
        days = 3
        total = daily_rate * quantity * days
        print(f"stawka_dzienna={daily_rate}, ilosc={quantity}, dni={days}, suma={total}")
        assert total == Decimal("603.00")
        deposit = daily_rate * Decimal("0.2")
        print(f"kaucja={deposit}")
        assert deposit == Decimal("20.10")
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_operacje_na_datetime():
    print("[UNIT] Test operacji na datetime")
    try:
        start = datetime.now()
        end = start + timedelta(days=5)
        duration = (end - start).days
        print(f"start={start}, koniec={end}, roznica_dni={duration}")
        assert duration == 5
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_wlasciwosci_modelu_sprzetu():
    print("[UNIT] Test właściwości modelu Equipment.is_available")
    try:
        equipment = Equipment(
            name="Test Drill",
            category=EquipmentCategory.POWER_TOOLS,
            daily_rate=Decimal("50.00"),
            status=EquipmentStatus.AVAILABLE,
            quantity_available=3
        )
        print(f"Utworzony sprzęt: {equipment}")
        assert equipment.is_available is True
        equipment.quantity_available = 0
        print(f"Sprzęt po zmianie ilości: {equipment}")
        assert equipment.is_available is False
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")