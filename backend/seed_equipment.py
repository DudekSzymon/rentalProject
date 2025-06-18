#!/usr/bin/env python3
"""
Script do dodania przykładowego sprzętu do bazy danych
Uruchom w folderze backend: python seed_equipment.py
"""

import sqlite3
from datetime import datetime

def seed_equipment():
    """Dodaje przykładowy sprzęt do bazy danych"""
    
    # Połączenie z bazą danych
    conn = sqlite3.connect('wypozyczalnia.db')
    cursor = conn.cursor()
    
    # Lista sprzętu do dodania
    equipment_data = [
        # WIERTARKI I MŁOTY (drilling)
        ('Wiertarka udarowa Bosch GSB 13 RE', 'Wiertarka udarowa 600W, uchwyt 13mm, idealna do betonu i cegły', 'drilling', 25.00, 150.00, 500.00, 5, 5, 'available', 'Bosch', 'GSB 13 RE', 0, 18, 1, 1.8, '285x70x205mm', '600W'),
        ('Wiertarka bezprzewodowa Makita DHP484', 'Wiertarka Li-ion 18V, moment obrotowy 54Nm, 2 akumulatory', 'drilling', 35.00, 210.00, 700.00, 3, 3, 'available', 'Makita', 'DHP484', 0, 18, 1, 1.6, '198x66x243mm', '18V Li-ion'),
        ('Młot wyburzeniowy Hilti TE 1000-AVR', 'Młot pneumatyczny 15kg, moc 1600W, system AVR', 'drilling', 120.00, 720.00, 2400.00, 2, 2, 'available', 'Hilti', 'TE 1000-AVR', 1, 21, 1, 15.0, '590x108x290mm', '1600W'),
        ('Wiertarka stojąca Bosch PBD 40', 'Wiertarka kolumnowa, stół 410x260mm, laser', 'drilling', 80.00, 480.00, 1600.00, 1, 1, 'available', 'Bosch', 'PBD 40', 0, 18, 1, 18.5, '410x260x700mm', '710W'),
        ('Młotek pneumatyczny Makita HR2470', 'Młotek SDS-plus 780W, 3 funkcje, walizka', 'drilling', 40.00, 240.00, 800.00, 4, 4, 'available', 'Makita', 'HR2470', 0, 18, 1, 2.8, '357x70x212mm', '780W'),
        
        # PIŁY I SZLIFIERKI (cutting)
        ('Szlifierka kątowa Makita GA9020', 'Szlifierka 230mm, 2200W, regulacja obrotów', 'cutting', 30.00, 180.00, 600.00, 4, 4, 'available', 'Makita', 'GA9020', 0, 18, 1, 4.8, '470x130x150mm', '2200W'),
        ('Piła tarczowa Festool TS 55', 'Piła tarczowa prowadnicowa, głębokość 55mm, system HKC', 'cutting', 60.00, 360.00, 1200.00, 2, 2, 'available', 'Festool', 'TS 55', 0, 18, 1, 4.5, '350x210x240mm', '1200W'),
        ('Szlifierka taśmowa Bosch PBS 75 AE', 'Szlifierka taśmowa 750W, taśma 75x533mm', 'cutting', 35.00, 210.00, 700.00, 3, 3, 'available', 'Bosch', 'PBS 75 AE', 0, 18, 1, 3.2, '356x167x152mm', '750W'),
        ('Piła łańcuchowa Husqvarna 372XP', 'Piła spalinowa 70.7cm³, prowadnica 45cm, profesjonalna', 'cutting', 80.00, 480.00, 1600.00, 2, 2, 'available', 'Husqvarna', '372XP', 1, 21, 1, 6.1, '380x280x270mm', '4.4kW'),
        ('Przecinarka do betonu Hilti DSH 700', 'Przecinarka ręczna, tarcza 350mm, cięcie na mokro/sucho', 'cutting', 100.00, 600.00, 2000.00, 1, 1, 'available', 'Hilti', 'DSH 700', 1, 21, 1, 9.4, '710x400x380mm', '4200W'),
        
        # KOPARKI I SPRZĘT ZIEMNY (excavation)
        ('Koparka gąsienicowa CAT 308E2', 'Koparka 8-tonowa, zasięg 7.8m, kabina ROPS/FOPS', 'excavation', 400.00, 2400.00, 8000.00, 1, 1, 'available', 'Caterpillar', '308E2', 1, 25, 1, 8200.0, '6140x2350x2940mm', '47kW'),
        ('Minikoparkas Bobcat E26', 'Minikoparkas 2.6t, zerowy obrót, kopanie w ciasnych miejscach', 'excavation', 250.00, 1500.00, 5000.00, 2, 2, 'available', 'Bobcat', 'E26', 1, 21, 1, 2630.0, '4140x1520x2380mm', '18.5kW'),
        ('Ładowarka kołowa Volvo L25F', 'Ładowarka 2.5t, skrętny układ kierowniczy, łyżka 1.2m³', 'excavation', 350.00, 2100.00, 7000.00, 1, 1, 'available', 'Volvo', 'L25F', 1, 25, 1, 4800.0, '5890x2050x2800mm', '55kW'),
        ('Młot pneumatyczny Atlas Copco TEX 90PS', 'Młot pneumatyczny łamacz 90kg, do wyburzeń', 'excavation', 150.00, 900.00, 3000.00, 2, 2, 'available', 'Atlas Copco', 'TEX 90PS', 1, 21, 1, 90.0, '1200x400x600mm', 'Pneumatyczny'),
        
        # PODNOŚNIKI I DŹWIGI (lifting)
        ('Podnośnik nożycowy JLG 2630ES', 'Podnośnik elektryczny 10m, platforma 760x1520mm', 'lifting', 200.00, 1200.00, 4000.00, 2, 2, 'available', 'JLG', '2630ES', 1, 21, 1, 1542.0, '1520x760x1980mm', 'Elektryczny 24V'),
        ('Żuraw wieżowy Liebherr 85 EC-B5', 'Żuraw wieżowy 5t, wysięg 50m, wysokość 40m', 'lifting', 800.00, 4800.00, 16000.00, 1, 1, 'available', 'Liebherr', '85 EC-B5', 1, 25, 1, 12000.0, 'Wieżowy', '45kW'),
        ('Wciągarka łańcuchowa Yale 2t', 'Wciągarka ręczna 2t, podnoszenie 3m, łańcuch stalowy', 'lifting', 25.00, 150.00, 500.00, 5, 5, 'available', 'Yale', 'VS III-2000', 0, 18, 1, 8.5, '240x180x320mm', 'Ręczna'),
        ('Podnośnik teleskopowy Manitou MT1440', 'Podnośnik obrotowy 4t, wysokość 14m, 4x4', 'lifting', 400.00, 2400.00, 8000.00, 1, 1, 'available', 'Manitou', 'MT1440', 1, 25, 1, 9500.0, '6800x2350x2700mm', '74kW'),
        
        # BETONIARKI I SPRZĘT DO BETONU (concrete)
        ('Betoniarka Altrad M250', 'Betoniarka 250l, mieszanie 190l, silnik elektryczny', 'concrete', 40.00, 240.00, 800.00, 3, 3, 'available', 'Altrad', 'M250', 0, 18, 1, 85.0, '1200x900x1300mm', '1100W'),
        ('Wibrator do betonu Enar AVMU', 'Wibrator głębinowy, buława 50mm, częstotliwość 12000 obr/min', 'concrete', 30.00, 180.00, 600.00, 4, 4, 'available', 'Enar', 'AVMU', 0, 18, 1, 15.0, '1500x200x200mm', '1500W'),
        ('Pompa do betonu Putzmeister P13', 'Pompa stacjonarna, wydajność 13m³/h, zasięg pionowy 80m', 'concrete', 300.00, 1800.00, 6000.00, 1, 1, 'available', 'Putzmeister', 'P13', 1, 25, 1, 2500.0, '4200x2100x2800mm', '55kW'),
        ('Zagęszczarka płytowa Weber CF2', 'Zagęszczarka 60kg, płyta 450x350mm, do kostki i asfaltu', 'concrete', 50.00, 300.00, 1000.00, 3, 3, 'available', 'Weber', 'CF2', 0, 18, 1, 60.0, '800x450x950mm', '3.0kW'),
        
        # NARZĘDZIA ELEKTRYCZNE (power_tools)
        ('Odkurzacz przemysłowy Kärcher WD6', 'Odkurzacz do pracy na sucho i mokro, zbiornik 30l', 'power_tools', 20.00, 120.00, 400.00, 4, 4, 'available', 'Kärcher', 'WD6', 0, 18, 1, 15.5, '405x705x615mm', '1300W'),
        ('Wyrzynarka Festool PS 420', 'Wyrzynarka wahadłowa, prowadnica, CarveCut technology', 'power_tools', 35.00, 210.00, 700.00, 3, 3, 'available', 'Festool', 'PS 420', 0, 18, 1, 2.4, '270x97x213mm', '550W'),
        ('Strugaraa Makita 1002BA', 'Strug elektryczny 82mm, regulacja głębokości 0-3mm', 'power_tools', 30.00, 180.00, 600.00, 2, 2, 'available', 'Makita', '1002BA', 0, 18, 1, 3.3, '312x164x156mm', '1050W'),
        ('Dmuchawa Stihl BR 600', 'Dmuchawa plecakowa, przepływ 810m³/h, profesjonalna', 'power_tools', 45.00, 270.00, 900.00, 2, 2, 'available', 'Stihl', 'BR 600', 0, 18, 1, 10.1, '420x420x750mm', '2.3kW'),
        ('Agregat prądotwórczy Honda EU30i', 'Generator inwertorowy 3kW, cichy, spalinowy', 'power_tools', 80.00, 480.00, 1600.00, 2, 2, 'available', 'Honda', 'EU30i', 0, 18, 1, 34.0, '592x425x426mm', '3.0kW'),
        
        # NARZĘDZIA RĘCZNE (hand_tools)
        ('Zestaw kluczy nasadowych Gedore', 'Zestaw 94 elementów, klucze 8-32mm, grzechotka', 'hand_tools', 15.00, 90.00, 300.00, 5, 5, 'available', 'Gedore', 'RED-94', 0, 18, 1, 8.5, '480x350x80mm', 'Ręczny'),
        ('Poziomica BMI Eurostar 100cm', 'Poziomica aluminiowa, libelle pozioma i pionowa', 'hand_tools', 10.00, 60.00, 200.00, 8, 8, 'available', 'BMI', 'Eurostar', 0, 18, 1, 1.2, '1000x70x25mm', 'Ręczny'),
        ('Młot wyburzeniowy Stanley 5kg', 'Młot stalowy z trzonkiem fiberglass, antypoślizgowy', 'hand_tools', 12.00, 72.00, 240.00, 6, 6, 'available', 'Stanley', 'STHT0-51309', 0, 18, 1, 5.2, '900x150x50mm', 'Ręczny'),
        ('Nożyce do blachy Bessey D39A', 'Nożyce proste 390mm, stal do 1.2mm, ergonomiczne', 'hand_tools', 8.00, 48.00, 160.00, 10, 10, 'available', 'Bessey', 'D39A', 0, 18, 1, 0.9, '390x120x25mm', 'Ręczny'),
        ('Imadło ślusarskie Peddinghaus 5200', 'Imadło 200mm, korpus stalowy, szczęki wymienne', 'hand_tools', 25.00, 150.00, 500.00, 3, 3, 'available', 'Peddinghaus', '5200', 0, 18, 1, 28.0, '500x200x300mm', 'Ręczny'),
        
        # SPRZĘT BHP I BEZPIECZEŃSTWO (safety)
        ('Rusztowanie jezdne Krause ClimTec', 'Rusztowanie aluminiowe 2x0.75m, wysokość 4m', 'safety', 60.00, 360.00, 1200.00, 2, 2, 'available', 'Krause', 'ClimTec', 0, 18, 1, 45.0, '2000x750x4000mm', 'Brak'),
        ('Kask ochronny Uvex Pheos', 'Kask przemysłowy z regulacją, wentylacja', 'safety', 5.00, 30.00, 100.00, 20, 20, 'available', 'Uvex', 'Pheos', 0, 18, 1, 0.4, '280x210x160mm', 'Brak'),
        ('Uprząż bezpieczeństwa Petzl Falcon', 'Uprząż robocza z punktami mocowania, rozmiar L', 'safety', 15.00, 90.00, 300.00, 10, 10, 'available', 'Petzl', 'Falcon', 0, 18, 1, 1.8, '400x300x100mm', 'Brak'),
        ('Detektor gazów Dräger X-am 2500', 'Detektor 4-gazowy: CH4, O2, CO, H2S, alarm', 'safety', 40.00, 240.00, 800.00, 3, 3, 'available', 'Dräger', 'X-am 2500', 0, 21, 1, 0.2, '70x70x30mm', 'Bateria'),
        ('Bariera ochronna 2m', 'Bariera plastikowa z wypełnieniem wodą, pomarańczowa', 'safety', 8.00, 48.00, 160.00, 15, 15, 'available', 'No-Brand', 'B-2000', 0, 18, 1, 12.0, '2000x400x800mm', 'Brak')
    ]
    
    # SQL do wstawiania danych
    insert_sql = """
    INSERT INTO equipment (
        name, description, category, daily_rate, weekly_rate, monthly_rate, 
        quantity_total, quantity_available, status, brand, model, 
        requires_license, min_age, is_active, weight, dimensions, power_consumption
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    try:
        # Sprawdzenie czy tabela istnieje
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='equipment';")
        if not cursor.fetchone():
            print("❌ Tabela 'equipment' nie istnieje! Upewnij się że backend został uruchomiony.")
            return False
        
        # Sprawdzenie czy są już dane
        cursor.execute("SELECT COUNT(*) FROM equipment")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print(f"⚠️  W bazie jest już {count} pozycji sprzętu.")
            response = input("Czy dodać kolejne? (y/n): ")
            if response.lower() != 'y':
                print("Anulowano.")
                return False
        
        # Wstawianie danych
        print("🔄 Dodawanie sprzętu do bazy danych...")
        cursor.executemany(insert_sql, equipment_data)
        
        # Zatwierdzenie zmian
        conn.commit()
        
        # Sprawdzenie wyniku
        cursor.execute("SELECT COUNT(*) FROM equipment")
        total_count = cursor.fetchone()[0]
        
        print(f"✅ Dodano {len(equipment_data)} pozycji sprzętu!")
        print(f"🔧 Łącznie w bazie: {total_count} pozycji")
        
        # Pokaż przykładowe pozycje
        cursor.execute("SELECT id, name, category, daily_rate FROM equipment LIMIT 5")
        examples = cursor.fetchall()
        
        print("\n📋 Przykładowe pozycje:")
        for item in examples:
            print(f"  • ID {item[0]}: {item[1]} ({item[2]}) - {item[3]} zł/dzień")
        
        return True
        
    except Exception as e:
        print(f"❌ Błąd: {e}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    print("🏗️  SEED SPRZĘTU - WYPOŻYCZALNIA")
    print("=" * 40)
    
    success = seed_equipment()
    
    if success:
        print("\n🎉 Gotowe! Możesz teraz testować endpointy wypożyczeń.")
        print("Uruchom: python ../test_rental_endpoints.py")
    else:
        print("\n❌ Nie udało się dodać sprzętu.")