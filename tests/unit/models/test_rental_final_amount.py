"""
Test jednostkowy - property final_amount
"""
import sys
import os
from decimal import Decimal

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.models.rental import Rental
from tests.utils.test_runner import print_debug

def test_rental_final_amount():
    """Test jednostkowy - property final_amount"""
    print_debug("JEDNOSTKOWY: Testowanie property final_amount...")
    rental = Rental()
    rental.total_price = Decimal('1000.00')
    rental.late_fee = Decimal('50.00')
    rental.damage_fee = Decimal('100.00')
    print_debug(f"Cena podstawowa: {rental.total_price}")
    print_debug(f"Opłata za opóźnienie: {rental.late_fee}")
    print_debug(f"Opłata za szkody: {rental.damage_fee}")
    
    final = rental.final_amount
    expected = Decimal('1150.00')
    print_debug(f"Końcowa kwota: {final}")
    print_debug(f"Oczekiwana: {expected}")
    
    assert final == expected, f"Nieprawidłowa końcowa kwota: {final} != {expected}"
    print_debug("✅ Property final_amount działa poprawnie")