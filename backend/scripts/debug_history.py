
import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.models.models import ClusterResult, CustomerCluster
from app.api.history import get_history

from app.api.history import HistoryItem
import json

def debug_history():
    print("Starting History Debug...")
    db = SessionLocal()
    try:
        print("1. Querying ClusterResult table...")
        runs = db.query(ClusterResult).all()
        print(f"   [OK] Found {len(runs)} runs.")
        
        for run in runs:
             print(f"   Run: {run.id} - {run.run_name}")
             count = db.query(CustomerCluster).filter(CustomerCluster.cluster_result_id == run.id).count()
             print(f"     Customer Count: {count}")
             
             # Test Pydantic
             try:
                 item = HistoryItem(
                     id=run.id,
                     run_name=run.run_name,
                     algorithm=run.algorithm,
                     created_at=run.created_at,
                     parameters=run.parameters,
                     customer_count=count
                 )
                 print(f"     [PASS] Pydantic Validated: {item.id}")
             except Exception as ve:
                 print(f"     [FAIL] Pydantic Validation Error: {ve}")
                 print(f"     Parameters type: {type(run.parameters)}")
                 print(f"     Parameters value: {run.parameters}")

    except Exception as e:
        print(f"   [CRITICAL FAIL] Exception occurred: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_history()
