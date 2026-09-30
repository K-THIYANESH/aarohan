import sqlite3, os
db_file = r"c:\Users\Thiyanesh\OneDrive\Documents\aarohan\Aarohan V2\Aarohan V2\backend\aarohan.db"
conn = sqlite3.connect(db_file)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cursor.fetchall()]
print("Tables:", tables)
for t in tables:
    cursor.execute("PRAGMA table_info(" + t + ")")
    cols = [(r[1], r[2]) for r in cursor.fetchall()]
    print(t + ":", cols)
conn.close()
