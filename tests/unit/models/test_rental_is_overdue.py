"""
Test jednostkowy - property is_overdue
"""
import sys
import os
from datetime import datetime, timedelta

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.models.rental import Rental, RentalStatus
from tests.utils.test_runner import print_debug

def test_rental_is_overdue():
    """Test jednostkowy - property is_overdue"""
    print_debug("JEDNOSTKOWY: Testowanie property is_overdue...")
    rental = Rental()
    rental.status = RentalStatus.ACTIVE
    
    # Test przeterminowanego
    rental.end_date = datetime.now() - timedelta(days=1)
    print_debug(f"Test przeterminowany - koniec: {rental.end_date}")
    overdue = rental.is_overdue
    print_debug(f"Is overdue: {overdue}")
    assert overdue is True, "Wypożyczenie powinno być przeterminowane"
    
    # Test aktualnego
    rental.end_date = datetime.now() + timedelta(days=1)
    print_debug(f"Test aktualny - koniec: {rental.end_date}")
    not_overdue = rental.is_overdue
    print_debug(f"Is overdue: {not_overdue}")
    assert not_overdue is False, "Wypożyczenie nie powinno być przeterminowane"
    
    print_debug("✅ Property is_overdue działa poprawnie")