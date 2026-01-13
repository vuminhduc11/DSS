import sys
import os
import requests
import json

# Add parent directory to path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://localhost:8000/api/v1"

def test_manual_entry_flow():
    print("1. Checking Initial Data Stats...")
    try:
        resp = requests.get(f"{BASE_URL}/analytics/data-quality")
        resp.raise_for_status()
        initial_stats = resp.json()
        print(f"   Initial Transactions: {initial_stats.get('total_transactions', 0)}")
        initial_count = initial_stats.get('total_transactions', 0)
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return

    print("\n2. Identifying/Creating a Manual Transaction...")
    transaction_data = {
        "customer_code": "TEST_MANUAL_001",
        "customer_name": "Test User Manual",
        "transaction_date": "2023-10-27T10:00:00",
        "amount": 150.50,
        "product_category": "Test Category"
    }

    try:
        resp = requests.post(f"{BASE_URL}/transaction/", json=transaction_data)
        if resp.status_code != 200:
            print(f"Failed to create transaction: {resp.text}")
            return
        result = resp.json()
        print(f"   Transaction Created! ID: {result.get('transaction_id')}")
    except Exception as e:
        print(f"Error creating transaction: {e}")
        return

    print("\n3. Verifying Data Stats Increase...")
    try:
        resp = requests.get(f"{BASE_URL}/analytics/data-quality")
        resp.raise_for_status()
        new_stats = resp.json()
        new_count = new_stats.get('total_transactions', 0)
        print(f"   New Transactions: {new_count}")

        if new_count == initial_count + 1:
            print("   SUCCESS: Transaction count incremented correctly.")
        else:
            print(f"   WARNING: Count mismatch. Expected {initial_count + 1}, got {new_count}")
    except Exception as e:
        print(f"Error fetching new stats: {e}")

if __name__ == "__main__":
    # Ensure server is running or this will fail
    print("Running Verification against running server...")
    test_manual_entry_flow()
