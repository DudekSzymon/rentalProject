"""
Test jednostkowy - schema RentalCreate
"""
import sys
import os
from datetime import datetime, timedelta

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.views.rental_schemas import RentalCreate
from tests.utils.test_runner import print_debug

def test_rental_create_schema():
    """Test jednostkowy - schema RentalCreate"""
    print_debug("JEDNOSTKOWY: Testowanie schematu RentalCreate...")
    
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=7)
    
    rental_data = {
        "equipment_id": 1,
        "start_date": start_date,
        "end_date": end_date,
        "quantity": 2
    }
    print_debug(f"Dane wypożyczenia: equipment_id={rental_data['equipment_id']}, quantity={rental_data['quantity']}")
    
    rental = RentalCreate(**rental_data)
    assert rental.equipment_id == 1
    assert rental.quantity == 2
    print_debug("Poprawne dane wypożyczenia przeszły walidację")
    
    # Test błędnej ilości
    rental_data["quantity"] = 0
    print_debug(f"Test błędnej ilości: {rental_data['quantity']}")
    
    try:
        RentalCreate(**rental_data)
        assert False, "Ilość 0 powinna rzucić wyjątek"
    except ValueError as e:
        print_debug(f"Oczekiwany błąd walidacji: {e}")
        assert "większa od 0" in str(e)
        print_debug("Błędna ilość poprawnie odrzucona")
    
    print_debug("✅ Schema RentalCreate działa poprawnie")