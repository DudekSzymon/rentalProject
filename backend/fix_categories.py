#!/usr/bin/env python3
"""
Fix kategorii sprzętu - zamiana małych liter na wielkie
Uruchom w folderze backend: python fix_categories.py
"""

import sqlite3

def fix_categories():
    """Zamienia kategorie z małych liter na wielkie zgodnie z ENUM"""
    
    conn = sqlite3.connect('wypozyczalnia.db')
    cursor = conn.cursor()
    
    # Mapowanie kategorii
    category_mapping = {
        'drilling': 'DRILLING',
        'cutting': 'CUTTING', 
        'excavation': 'EXCAVATION',
        'lifting': 'LIFTING',
        'concrete': 'CONCRETE',
        'power_tools': 'POWER_TOOLS',
        'hand_tools': 'HAND_TOOLS',
        'safety': 'SAFETY'
    }
    
    try:
        print("🔄 Naprawianie kategorii sprzętu...")
        
        # Sprawdź obecne kategorie
        cursor.execute("SELECT DISTINCT category FROM equipment")
        current_categories = cursor.fetchall()
        print("📋 Obecne kategorie:", [cat[0] for cat in current_categories])
        
        # Aktualizuj kategorie
        for old_cat, new_cat in category_mapping.items():
            cursor.execute(
                "UPDATE equipment SET category = ? WHERE category = ?", 
                (new_cat, old_cat)
            )
            updated = cursor.rowcount
            if updated > 0:
                print(f"  ✅ {old_cat} → {new_cat} ({updated} pozycji)")
        
        # NOWE: Naprawa statusów
        print("\n🔄 Naprawianie statusów sprzętu...")
        status_mapping = {
            'available': 'AVAILABLE',
            'rented': 'RENTED',
            'maintenance': 'MAINTENANCE', 
            'damaged': 'DAMAGED',
            'retired': 'RETIRED'
        }
        
        # Sprawdź obecne statusy
        cursor.execute("SELECT DISTINCT status FROM equipment")
        current_statuses = cursor.fetchall()
        print("📋 Obecne statusy:", [status[0] for status in current_statuses])
        
        # Aktualizuj statusy
        for old_status, new_status in status_mapping.items():
            cursor.execute(
                "UPDATE equipment SET status = ? WHERE status = ?", 
                (new_status, old_status)
            )
            updated = cursor.rowcount
            if updated > 0:
                print(f"  ✅ {old_status} → {new_status} ({updated} pozycji)")
        
        conn.commit()
        
        # Sprawdź wynik
        cursor.execute("SELECT DISTINCT category FROM equipment")
        new_categories = cursor.fetchall()
        print("📋 Nowe kategorie:", [cat[0] for cat in new_categories])
        
        cursor.execute("SELECT DISTINCT status FROM equipment")
        new_statuses = cursor.fetchall()
        print("📋 Nowe statusy:", [status[0] for status in new_statuses])
        
        print("✅ Kategorie i statusy zostały naprawione!")
        return True
        
    except Exception as e:
        print(f"❌ Błąd: {e}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔧 NAPRAWA KATEGORII SPRZĘTU")
    print("=" * 30)
    fix_categories()