import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from app.services.clustering_service import calculate_and_save_rlfm
from app.core.database import get_db

print("Starting debug...")
db = next(get_db())
try:
    print("Calling calculate_and_save_rlfm...")
    count = calculate_and_save_rlfm(db)
    print(f"Success! Count: {count}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
