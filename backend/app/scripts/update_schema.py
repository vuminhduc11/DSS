
import sqlite3
import os

# Adjust path to point to the correct database file
# Based on previous file listing, dss_v2.db is in the root of DSS, but sometimes it might be in backend/
# Let's check where it usually is. list_dir showed dss_v2.db in c:\Users\Dell\Desktop\DSS
DB_PATH = os.path.join(os.path.dirname(__file__), '../../../dss_v2.db')

def migrate():
    print(f"Migrating database at: {os.path.abspath(DB_PATH)}")
    
    if not os.path.exists(DB_PATH):
        print("Database not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'role' not in columns:
            print("Adding 'role' column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'staff'")
            conn.commit()
            print("Migration successful.")
        else:
            print("'role' column already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
