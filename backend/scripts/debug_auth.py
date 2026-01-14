
import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash, verify_password

def debug():
    print("Starting Auth Debug...")
    db = SessionLocal()
    try:
        print("1. Querying User table...")
        user = db.query(User).first()
        if user:
            print(f"   [OK] Found user: {user.email}")
            try:
                print(f"   Role attribute: {user.role}")
            except AttributeError:
                print("   [FAIL] 'role' attribute missing on model instance!")
            except Exception as e:
                print(f"   [FAIL] Error accessing role: {e}")
        else:
            print("   [WARN] No users found in DB.")

        print("2. Testing Password Hashing...")
        h = get_password_hash("test")
        print(f"   [OK] Hash generated: {h[:10]}...")

    except Exception as e:
        print(f"   [CRITICAL FAIL] Exception occurred: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug()
