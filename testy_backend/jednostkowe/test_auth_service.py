import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

try:
    from app.services.auth_service import auth_service
except ImportError as e:
    print(f"Błąd importu auth_service: {e}")

def test_haszowanie_hasla():
    print("[UNIT] Test haszowania hasła")
    try:
        password = "testpass123"
        print(f"Haszuję hasło: {password}")
        hashed = auth_service.hash_password(password)
        print(f"Wygenerowany hash: {hashed}")
        assert auth_service.verify_password(password, hashed)
        assert not auth_service.verify_password("zlehaslo", hashed)
        assert len(hashed) > 20
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_tworzenie_tokenu_jwt():
    print("[UNIT] Test tworzenia i weryfikacji JWT")
    try:
        payload = {"sub": "999", "role": "customer"}
        print(f"Payload: {payload}")
        token = auth_service.create_access_token(payload)
        print(f"Utworzony token: {token}")
        decoded = auth_service.verify_token(token)
        print(f"Zdekodowany payload: {decoded}")
        assert decoded["sub"] == "999"
        assert "exp" in decoded
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_tworzenie_refresh_tokenu():
    print("[UNIT] Test tworzenia refresh tokenu")
    try:
        from ..common import TestingSessionLocal
        from app.models.user import User
        
        with TestingSessionLocal() as db:
            user = User(
                email="refresh@test.com",
                first_name="Refresh",
                last_name="Test",
                password_hash="dummy"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Utworzono użytkownika id={user.id}, email={user.email}")

            token = auth_service.create_refresh_token(user.id, db)
            print(f"Wygenerowany refresh token: {token}")
            assert len(token) > 10
            print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_tylko_access_token():
    print("[UNIT] Test tworzenia wyłącznie access tokenu")
    try:
        token = auth_service.create_access_token(123)
        print(f"Access token: {token}")
        decoded = auth_service.verify_token(token)
        print(f"Zdekodowany token: {decoded}")
        assert decoded["sub"] == "123"
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")

def test_weryfikacja_haszy_hasla():
    print("[UNIT] Test weryfikacji różnych hashy dla tego samego hasła")
    try:
        password = "test123456"
        hash1 = auth_service.hash_password(password)
        hash2 = auth_service.hash_password(password)
        print(f"hash1={hash1}\nhash2={hash2}")
        assert hash1 != hash2
        assert auth_service.verify_password(password, hash1)
        assert auth_service.verify_password(password, hash2)
        print("✓ ZDANE")
    except Exception as e:
        print(f"✗ BŁĄD: {e}")