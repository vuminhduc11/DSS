import requests
import sqlite3
import datetime
import os

BASE_URL = "http://localhost:8000/api/v1"
DB_PATH = "dss_v2.db"

def seed_data():
    """Seed the database with a dummy run and customer cluster map if needed."""
    if not os.path.exists(DB_PATH):
        print(f"⚠️  Database not found at {DB_PATH}, skipping seed.")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 1. Create a dummy run
    try:
        c.execute("INSERT INTO cluster_results (run_name, created_at) VALUES (?, ?)", 
                 ("Test Run For UC09", datetime.datetime.now().isoformat()))
        run_id = c.lastrowid
        print(f"✅ Seeded ClusterResult (ID: {run_id})")
        
        # 2. Assign Customer 1 to Cluster 0 in this run
        # Inspecting models.py: CustomerCluster(customer_id, cluster_result_id, cluster_label)
        c.execute("INSERT INTO customer_clusters (customer_id, cluster_result_id, cluster_label) VALUES (?, ?, ?)",
                 (1, run_id, 0)) # Assuming customer 1 exists (from previous test)
        print(f"✅ Seeded CustomerCluster map for Customer 1 -> Cluster 0")
        
        conn.commit()
    except Exception as e:
        print(f"⚠️  Seeding failed (might already exist): {e}")
    finally:
        conn.close()

def test_care_by_segment():
    print("Testing UC09: Care by Segment Support...")
    
    # Seed data first to ensure success
    seed_data()
    
    # 1. Get Latest Run
    try:
        resp = requests.get(f"{BASE_URL}/strategy/runs/latest")
        if resp.status_code != 200:
            print("❌ No latest run found even after seeding.")
            return
        
        run_id = resp.json()['id']
        print(f"✅ Found Run ID: {run_id}")
        
        # 2. Get Strategy (logic in backend might fail if no strategies generated for this run, but let's try endpoint directly)
        # We know we seeded Cluster 0.
        cluster_label = 0
        print(f"✅ Testing with Cluster Label: {cluster_label}")
        
        # 3. Get Customers in this cluster
        print(f"   Fetching customers for Run {run_id}, Cluster {cluster_label}...")
        resp = requests.get(f"{BASE_URL}/strategy/{run_id}/cluster/{cluster_label}/customers")
        
        if resp.status_code == 200:
            customers = resp.json()
            print(f"✅ Success! Found {len(customers)} customers in this segment.")
            if customers:
                first_cust = customers[0]
                print(f"   Sample Customer: ID={first_cust['id']}, Name={first_cust['name']}, Spend=${first_cust['total_spend']}")
                print("   [ Frontend Verification ] Check that clicking 'Action' on this customer navigates to:")
                print(f"   /data?tab=interactions&customerId={first_cust['code']}")
        else:
            print(f"❌ Failed to get customers. Status: {resp.status_code}")
            print(resp.text)

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_care_by_segment()
