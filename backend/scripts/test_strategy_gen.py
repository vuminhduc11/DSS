import sqlite3
import json
import sys
sys.path.insert(0, 'app')

db_path = "dss_v2.db"

print("=" * 60)
print("TESTING STRATEGY GENERATION")
print("=" * 60)

# Check clustering result
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT id, run_name FROM cluster_results ORDER BY id DESC LIMIT 1")
result = cursor.fetchone()
conn.close()

if not result:
    print("❌ No clustering results found!")
    exit(1)

run_id, run_name = result
print(f"\n✅ Found clustering: ID={run_id}, Name='{run_name}'")

# Test strategy generation
print(f"\n🔬 Generating strategies for run_id={run_id}...")
print("-" * 60)

from core.database import SessionLocal
from services.strategy_service import generate_strategies

db = SessionLocal()
try:
    strategies = generate_strategies(run_id, db)
    
    if strategies:
        print(f"\n✅ Successfully generated {len(strategies)} strategies!\n")
        for i, s in enumerate(strategies, 1):
            print(f"{i}. Cluster {s['cluster']}: {s['segment_name']}")
            print(f"   - Customers: {s['customer_count']:,}")
            print(f"   - Avg Spend: ${s['avg_spend']:.2f}")
            print(f"   - Frequency: {s['frequency']}")
            print(f"   - Priority: {s['priority']}")
            print(f"   - Strategy: {s['strategy'][:80]}...")
            print()
    else:
        print("\n⚠️ No strategies generated (empty list)")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()

print("=" * 60)
