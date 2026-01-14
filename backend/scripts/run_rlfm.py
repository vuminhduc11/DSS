import sys
sys.path.insert(0, 'app')

from services.clustering_service import processRLFM
from core.database import SessionLocal

print("Starting RLFM processing...")
print("This may take a few minutes for 2.4M transactions...")

db = SessionLocal()
try:
    result = processRLFM(db)
    print(f"\n✅ RLFM processing complete!")
    print(f"   Customers processed: {result['count']}")
    print(f"   Status: {result['status']}")
except Exception as e:
    print(f"\n❌ Error: {e}")
finally:
    db.close()
