import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_interactions():
    print("Testing Interactions API...")
    
    # 1. Create a dummy customer if needed, or use existing ID 1
    customer_id = 1 
    
    # 2. Log an interaction
    payload = {
        "customer_id": customer_id,
        "channel": "Hotline",
        "content": "Test interaction from verification script",
        "sentiment": "Positive"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/interactions/", json=payload)
        if response.status_code == 200:
            print("✅ Create Interaction: Success")
            data = response.json()
            print(f"   ID: {data['id']}")
        else:
            print(f"❌ Create Interaction: Failed ({response.status_code})")
            print(response.text)
            return

        # 3. Get interactions
        response = requests.get(f"{BASE_URL}/interactions/customer/{customer_id}")
        if response.status_code == 200:
            interactions = response.json()
            found = any(i['content'] == "Test interaction from verification script" for i in interactions)
            if found:
                 print(f"✅ Get Interactions: Success (Found {len(interactions)} records)")
            else:
                 print("❌ Get Interactions: Failed (Created record not found)")
        else:
            print(f"❌ Get Interactions: Failed ({response.status_code})")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_interactions()
