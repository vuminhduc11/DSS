
import sqlite3
import os

def migrate():
    db_path = "dss_v2.db"
    print(f"Looking for database at: {os.path.abspath(db_path)}")
    
    if not os.path.exists(db_path):
        print(f"Database NOT found at {db_path}")
        # Try to find it via config if needed, but standard is root of app
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        print("Attempting to add 'role' column...")
        cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'staff'")
        conn.commit()
        print("SUCCESS: 'role' column added.")
    except Exception as e:
        print(f"FAIL: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
