import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_rlfm_processing():
    print("Testing RLFM Processing...")
    response = requests.post(f"{BASE_URL}/rlfm/process")
    if response.status_code == 200:
        print(f"SUCCESS: {response.json()}")
        return True
    else:
        print(f"FAILED: {response.text}")
        return False

def test_clustering():
    print("Testing Clustering (K-Means)...")
    payload = {
        "algorithm": "kmeans",
        "params": {"n_clusters": 3},
        "run_name": "Verification_Run"
    }
    response = requests.post(f"{BASE_URL}/run", json=payload)
    if response.status_code == 200:
        run_id = response.json().get("run_id")
        print(f"SUCCESS: Run ID {run_id}")
        return run_id
    else:
        print(f"FAILED: {response.text}")
        return None

def test_dashboard():
    print("Testing Dashboard Metrics...")
    response = requests.get(f"{BASE_URL}/analytics/dashboard")
    if response.status_code == 200:
        print(f"SUCCESS: KPI Total Customers {response.json().get('kpi', {}).get('total_customers')}")
        return True
    else:
        print(f"FAILED: {response.text}")
        return False

def test_strategy(run_id):
    if not run_id:
        print("Skipping Strategy Test (No Run ID)")
        return False
    print(f"Testing Strategy Generation for Run {run_id}...")
    try:
        response = requests.get(f"{BASE_URL}/strategy/{run_id}")
        if response.status_code == 200:
            print(f"SUCCESS: Strategies found: {len(response.json())}")
            return True
        else:
            print(f"FAILED: {response.text}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_manual_entry_flow():
    print("Testing Manual Entry & Data Stats...")
    try:
        # 1. Get Initial Stats
        resp = requests.get(f"{BASE_URL}/analytics/data-quality")
        initial_count = resp.json().get('total_transactions', 0)
        
        # 2. Add Transaction
        tx_data = {
            "customer_code": "FLOW_TEST_001",
            "transaction_date": "2023-11-01T10:00:00",
            "amount": 500.0,
            "product_category": "Flow Test"
        }
        resp = requests.post(f"{BASE_URL}/transaction/", json=tx_data)
        if resp.status_code != 200:
            print(f"FAILED to create transaction: {resp.text}")
            return False
            
        # 3. Verify Increase
        resp = requests.get(f"{BASE_URL}/analytics/data-quality")
        new_count = resp.json().get('total_transactions', 0)
        
        if new_count > initial_count:
            print(f"SUCCESS: Transaction count increased ({initial_count} -> {new_count})")
            return True
        else:
            print(f"FAILED: Count did not increase")
            return False
    except Exception as e:
        print(f"ERROR in manual flow: {e}")
        return False

if __name__ == "__main__":
    print("=== STARTING FULL SYSTEM VERIFICATION ===")
    test_manual_entry_flow()
    test_rlfm_processing()
    run_id = test_clustering()
    if run_id:
        test_dashboard()
        test_strategy(run_id)
    print("=== VERIFICATION COMPLETE ===")
