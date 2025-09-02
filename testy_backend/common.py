import sys
import os
from contextlib import contextmanager
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import stripe

if os.path.abspath("backend") not in sys.path:
    sys.path.insert(0, os.path.abspath("backend"))

try:
    from app.main import app
    from app.database import Base, get_db
except ImportError as e:
    print(f"Błąd importu: {e}")
    sys.exit(1)

TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

try:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[BAZA] Testowa baza danych została zainicjalizowana")
except Exception as e:
    print(f"Błąd przy inicjalizacji bazy danych: {e}")

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@contextmanager
def mock_google_login():
    with patch("app.controllers.auth_controller._verify_google_token") as verify, \
         patch("app.controllers.auth_controller._check_user_access") as access, \
         patch("app.controllers.auth_controller._ensure_google_configured") as config:
        verify.return_value = {
            "sub": "mock-google-id-123",
            "email": "googleuser@test.com",
            "iss": "accounts.google.com",
            "given_name": "Mock",
            "family_name": "User"
        }
        access.return_value = None
        config.return_value = None
        yield

@contextmanager
def mock_stripe_create_intent(fake_id="pi_test_123", fake_secret="secret_123"):
    with patch.object(stripe.PaymentIntent, "create") as create_mock:
        create_mock.return_value = MagicMock(id=fake_id, client_secret=fake_secret)
        yield

@contextmanager
def mock_stripe_retrieve(status="succeeded"):
    with patch.object(stripe.PaymentIntent, "retrieve") as retrieve_mock:
        retrieve_mock.return_value = MagicMock(status=status)
        yield