import sqlite3

conn = sqlite3.connect('wypozyczalnia.db')
cursor = conn.cursor()

cursor.execute('DELETE FROM payments')
cursor.execute('DELETE FROM rentals')
cursor.execute('UPDATE equipment SET quantity_available = quantity_total')

conn.commit()
conn.close()

print('✅ GOTOWE! Baza wyczyszczona!')