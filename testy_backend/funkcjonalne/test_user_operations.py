import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

from app.models.user import User, UserRole

def test_user_operations():
    print("[FUNC] Test dla operacji użytkowników")
    user = User(
        email="placeholder@test.com",
        first_name="Jan",
        last_name="Kowalski",
        password_hash="fakehash",
        role=UserRole.CUSTOMER
    )
    print(f"Utworzono użytkownika: {user.first_name} {user.last_name}, email={user.email}, rola={user.role.value}")

    assert user.email == "placeholder@test.com"
    assert user.role == UserRole.CUSTOMER
    print("✓ ZDANE")
