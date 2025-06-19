#!/usr/bin/env python3
"""
RESETUJ - usuń wszystkich adminów i stwórz nowego z bcrypt
Uruchom: python create_admin_bcrypt.py
"""

import sqlite3
import bcrypt
from datetime import datetime

def clean_and_create_admin():
    print("🧹 RESET ADMINISTRATORÓW")
    print("=" * 40)
    
    admin_email = "admin@projekt.pl"
    admin_password = "admin123"
    
    try:
        conn = sqlite3.connect('wypozyczalnia.db')
        cursor = conn.cursor()
        
        # 1. Usuń WSZYSTKICH użytkowników o tym emailu (nie tylko adminów)
        cursor.execute("DELETE FROM users WHERE email = ?", (admin_email,))
        deleted_email = cursor.rowcount
        print(f"🗑️ Usunięto {deleted_email} użytkowników z emailem {admin_email}")
        
        # 2. Usuń pozostałych adminów
        cursor.execute("DELETE FROM users WHERE role = 'ADMIN'")
        deleted_admins = cursor.rowcount
        print(f"🗑️ Usunięto {deleted_admins} pozostałych adminów")
        
        # 3. Stwórz hash hasła używając bcrypt bezpośrednio
        password_bytes = admin_password.encode('utf-8')
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        print(f"🔐 Wygenerowano hash bcrypt: {password_hash[:50]}...")
        
        # 4. Stwórz nowego admina
        cursor.execute("""
            INSERT INTO users (
                email, password_hash, first_name, last_name, 
                role, is_verified, is_blocked, auth_provider, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            admin_email,
            password_hash,
            "Admin",
            "Nowy", 
            "ADMIN",
            1,        # verified
            0,        # not blocked
            "LOCAL",  # auth provider
            datetime.now().isoformat(),  # Używamy ISO format dla SQLite
            datetime.now().isoformat()
        ))
        
        conn.commit()
        
        # 5. Test czy działa
        cursor.execute("SELECT id, email, password_hash FROM users WHERE role = 'ADMIN'")
        new_admin = cursor.fetchone()
        
        if new_admin:
            # Test weryfikacji hasła
            stored_hash = new_admin[2].encode('utf-8')
            test_result = bcrypt.checkpw(password_bytes, stored_hash)
            
            print(f"✅ Utworzono nowego admina: {new_admin[1]} (ID: {new_admin[0]})")
            print(f"✅ Test hasła: {'DZIAŁA' if test_result else 'NIE DZIAŁA'}")
            
            if test_result:
                print(f"""
🎉 SUKCES!

📋 NOWE DANE LOGOWANIA:
   Email: {admin_email}
   Hasło: {admin_password}

🔒 Hash bcrypt: {new_admin[2][:50]}...

🚀 TERAZ MOŻESZ SIĘ ZALOGOWAĆ!
                """)
            else:
                print("❌ Coś poszło nie tak z hashem!")
        else:
            print("❌ Nie udało się utworzyć admina!")
        
        # 6. Pokaż wszystkich użytkowników w bazie (debug)
        cursor.execute("SELECT id, email, role FROM users")
        all_users = cursor.fetchall()
        print(f"\n📊 Wszyscy użytkownicy w bazie ({len(all_users)}):")
        for user in all_users:
            print(f"   ID: {user[0]}, Email: {user[1]}, Role: {user[2]}")
        
    except Exception as e:
        print(f"❌ Błąd: {e}")
        print(f"❌ Typ błędu: {type(e).__name__}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    clean_and_create_admin()