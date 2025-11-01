import sqlite3
import os
import database as db

# db.insert_raw_opinion("nilser", "d76e296e-3c2b-4e77-9812-31ac8812eddc", "alles :((", 5)

db_file = os.getenv("DB_FILE")

conn = sqlite3.connect(db_file)
c = conn.cursor()
c.execute("PRAGMA foreign_keys = ON;")

c.execute("""
        SELECT * from RawOpinion;
    """)

print(c.fetchall())