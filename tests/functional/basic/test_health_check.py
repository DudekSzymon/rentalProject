"""
Test funkcjonalny - endpoint health check
"""
from tests.config.test_setup import client
from tests.utils.test_runner import print_debug

def test_health_check():
    """Test funkcjonalny - endpoint health check"""
    print_debug("FUNKCJONALNY: Testowanie endpointu /api/health...")
    
    response = client.get("/api/health")
    print_debug(f"Status code: {response.status_code}")
    
    assert response.status_code == 200
    data = response.json()
    print_debug(f"Response data: {data}")
    assert data["status"] == "healthy"
    assert "database" in data
    print_debug("✅ Health check endpoint działa")