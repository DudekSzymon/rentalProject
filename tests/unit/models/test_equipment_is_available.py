"""
Test jednostkowy - property is_available
"""
import sys
import os

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.models.equipment import Equipment, EquipmentStatus
from tests.utils.test_runner import print_debug

def test_equipment_is_available():
    """Test jednostkowy - property is_available"""
    print_debug("JEDNOSTKOWY: Testowanie property is_available...")
    equipment = Equipment()
    
    # Test dostępnego sprzętu
    equipment.status = EquipmentStatus.AVAILABLE
    equipment.quantity_available = 3
    print_debug(f"Status: {equipment.status}, Ilość: {equipment.quantity_available}")
    available = equipment.is_available
    print_debug(f"Is available: {available}")
    assert available is True, "Sprzęt powinien być dostępny"
    
    # Test niedostępnego (brak ilości)
    equipment.quantity_available = 0
    print_debug(f"Zmieniono ilość na: {equipment.quantity_available}")
    not_available = equipment.is_available
    print_debug(f"Is available: {not_available}")
    assert not_available is False, "Sprzęt nie powinien być dostępny"
    
    print_debug("✅ Property is_available działa poprawnie")