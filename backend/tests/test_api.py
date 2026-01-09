def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Customer Segmentation DSS API"}

def test_upload_file(client):
    # Create a dummy CSV
    content = b"customer_code,amount,transaction_date\nC001,100,2023-01-01\nC002,200,2023-01-02"
    files = {"file": ("test.csv", content, "text/csv")}
    response = client.post("/api/v1/upload", files=files)
    assert response.status_code == 200
    assert "Successfully processed" in response.json()["message"]

def test_clustering_flow(client):
    # 1. Upload data first
    content = b"customer_code,amount,transaction_date\nC001,100,2023-01-01\nC002,200,2023-01-02\nC003,300,2023-01-03\nC004,1500,2023-01-04"
    files = {"file": ("data.csv", content, "text/csv")}
    client.post("/api/v1/upload", files=files)
    
    # 2. Run clustering
    payload = {
        "algorithm": "kmeans",
        "params": {"n_clusters": 2},
        "run_name": "test_run"
    }
    response = client.post("/api/v1/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "run_id" in data
    assert "counts" in data
    
    run_id = data["run_id"]
    
    # 3. Check Strategy
    response = client.get(f"/api/v1/strategy/{run_id}")
    assert response.status_code == 200
    strategies = response.json()
    assert isinstance(strategies, list)
    assert len(strategies) > 0

def test_analytics(client):
    response = client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    assert "total_customers" in response.json()
