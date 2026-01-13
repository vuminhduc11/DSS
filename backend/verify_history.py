import requests
import datetime

BASE_URL = "http://localhost:8000/api/v1"

def test_history_and_filtering():
    print("=== Testing History & Filtering ===")
    
    # 1. Run Analysis with Filtering and NO Save
    print("\n1. Running Temporary Analysis (Filtered, No Save)...")
    payload = {
        "algorithm": "kmeans",
        "params": {"n_clusters": 2},
        "run_name": "Temp_Run_Test",
        "start_date": "2010-01-01",
        "end_date": "2025-12-31",
        "save_result": False
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/run", json=payload)
        if resp.status_code == 200:
            print("   SUCCESS: Analysis completed.")
            print(f"   Saved status: {resp.json().get('saved')}")
            if resp.json().get('saved') == False:
                 print("   VERIFIED: Not saved as requested.")
        else:
            print(f"   FAILED: {resp.text}")
    except Exception as e:
        print(f"   ERROR: {e}")

    # 2. Run Analysis WITH Save
    print("\n2. Running Saved Analysis...")
    payload["run_name"] = "Saved_History_Test"
    payload["save_result"] = True
    
    run_id = None
    try:
        resp = requests.post(f"{BASE_URL}/run", json=payload)
        if resp.status_code == 200:
            data = resp.json()
            run_id = data.get("run_id")
            print(f"   SUCCESS: Run ID {run_id} created.")
        else:
            print(f"   FAILED: {resp.text}")
    except Exception as e:
        print(f"   ERROR: {e}")

    # 3. Check History
    print("\n3. Checking History API...")
    try:
        resp = requests.get(f"{BASE_URL}/history/")
        if resp.status_code == 200:
            history = resp.json()
            found = False
            for run in history:
                if run['id'] == run_id:
                    found = True
                    print(f"   SUCCESS: Found Run {run_id} in history.")
                    print(f"   Name: {run['run_name']}, Count: {run['customer_count']}")
                    break
            if not found:
                 print(f"   FAILED: Run {run_id} not found in history.")
        else:
            print(f"   FAILED: {resp.text}")
    except Exception as e:
        print(f"   ERROR: {e}")

    # 4. Delete Run
    if run_id:
        print(f"\n4. Deleting Run {run_id}...")
        try:
            resp = requests.delete(f"{BASE_URL}/history/{run_id}")
            if resp.status_code == 200:
                print("   SUCCESS: Run deleted.")
            else:
                print(f"   FAILED: {resp.text}")
        except Exception as e:
            print(f"   ERROR: {e}")

if __name__ == "__main__":
    test_history_and_filtering()
