"""
Konfiguracja testów
"""
import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# POPRAWIONE IMPORTY - dodaj backend do path
backend_path = os.path.join(os.path.dirname(__file__), '..', '..', 'backend')
sys.path.insert(0, backend_path)

# Importy z backendu
from backend.app.main import app
from backend.app.database import get_db, Base

# Test database dla testów funkcjonalnych
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_complete.db"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Utwórz tabele w bazie testowej
Base.metadata.create_all(bind=test_engine)

def override_get_db():
    """Override bazy danych dla testów funkcjonalnych"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override dependency dla testów
app.dependency_overrides[get_db] = override_get_db

# TestClient dla testów funkcjonalnych
client = TestClient(app)