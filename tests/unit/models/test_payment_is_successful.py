"""
Test jednostkowy - property is_successful
"""
import sys
import os

backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.models.payment import Payment, PaymentStatus
from tests.utils.test_runner import print_debug

def test_payment_is_successful():
    """Test jednostkowy - property is_successful"""
    print_debug("JEDNOSTKOWY: Testowanie property is_successful...")
    payment = Payment()
    
    # Test udanej płatności
    payment.status = PaymentStatus.COMPLETED
    print_debug(f"Status płatności: {payment.status}")
    successful = payment.is_successful
    print_debug(f"Is successful: {successful}")
    assert successful is True, "Płatność COMPLETED powinna być udana"
    
    # Test nieudanej płatności
    payment.status = PaymentStatus.FAILED
    print_debug(f"Zmieniono status na: {payment.status}")
    failed = payment.is_successful
    print_debug(f"Is successful: {failed}")
    assert failed is False, "Płatność FAILED nie powinna być udana"
    
    print_debug("✅ Property is_successful działa poprawnie")