import sys
sys.path.insert(0, 'app')

from core.database import SessionLocal
from services.clustering_service import run_clustering

db = SessionLocal()

try:
    print("Testing clustering without date filters...")
    result = run_clustering(
        algorithm="kmeans",
        params={"n_clusters": 5},
        db=db,
        run_name="Test Clustering Run",
        start_date=None,
        end_date=None,
        save_result=True
    )
    print(f"\n✅ Clustering successful!")
    print(f"Result ID: {result.get('id')}")
    print(f"Clusters: {result.get('n_clusters')}")
    print(f"Customers processed: {result.get('customer_count')}")
except ValueError as e:
    print(f"\n❌ ValueError: {e}")
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
