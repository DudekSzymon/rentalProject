"""
Test jednostkowy - property duration_days
"""
import sys
import os
from datetime import datetime

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.models.rental import Rental
from tests.utils.test_runner import print_debug

def test_rental_duration_days():
    """Test jednostkowy - property duration_days"""
    print_debug("JEDNOSTKOWY: Testowanie property duration_days...")
    rental = Rental()
    rental.start_date = datetime(2024, 6, 1)
    rental.end_date = datetime(2024, 6, 8)
    print_debug(f"Start: {rental.start_date}, End: {rental.end_date}")
    
    duration = rental.duration_days
    print_debug(f"Obliczona długość: {duration} dni")
    assert duration == 7, f"Nieprawidłowa długość: {duration} != 7"
    print_debug("✅ Property duration_days działa poprawnie")