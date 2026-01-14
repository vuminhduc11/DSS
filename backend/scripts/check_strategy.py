import sqlite3
import json

db_path = "dss_v2.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 60)
print("CHECKING CLUSTER RESULTS TABLE")
print("=" * 60)

# Check if there are any clustering results
cursor.execute("SELECT id, run_name, algorithm, n_clusters, customer_count, created_at FROM cluster_results ORDER BY id DESC LIMIT 5")
results = cursor.fetchall()

if results:
    print(f"\n✅ Found {len(results)} clustering result(s):\n")
    for r in results:
        print(f"  ID: {r[0]}")
        print(f"  Name: {r[1]}")
        print(f"  Algorithm: {r[2]}")
        print(f"  Clusters: {r[3]}")
        print(f"  Customer Count: {r[4]}")
        print(f"  Created: {r[5]}")
        print("-" * 40)
    
    # Test strategy generation for the latest run
    latest_id = results[0][0]
    print(f"\n🔬 Testing Strategy Generation for Run ID: {latest_id}")
    print("=" * 60)
    
    # Import and test strategy service
    import sys
    sys.path.insert(0, '../app')
    from core.database import SessionLocal
    from services.strategy_service import generate_strategies
    
    db_session = SessionLocal()
    try:
        strategies = generate_strategies(latest_id, db_session)
        print(f"\n✅ Generated {len(strategies)} strategies:\n")
        for s in strategies:
            print(f"  Cluster {s['cluster']}: {s['segment_name']}")
            print(f"  - Customers: {s['customer_count']}")
            print(f"  - Avg Spend: ${s['avg_spend']:.2f}")
            print(f"  - Frequency: {s['frequency']}")
            print(f"  - Priority: {s['priority']}")
            print(f"  - Strategy: {s['strategy']}")
            print("-" * 40)
    except Exception as e:
        print(f"\n❌ Error generating strategies: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db_session.close()
else:
    print("\n❌ No clustering results found in database!")
    print("   You need to run clustering analysis first.")

conn.close()
