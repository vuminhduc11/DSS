import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering, SpectralClustering, Birch, MeanShift, AffinityPropagation
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session
from app.models.models import Customer, Transaction, ClusterResult, CustomerCluster
from datetime import datetime
import json

def get_customer_data(db: Session):
    # Aggregate transaction data for each customer
    # Features: Total Spend, Frequency (count), Recency (days since last), Product Variety
    # This is a simplified RFM + Variety model
    
    query = db.query(
        Customer.id,
        Customer.customer_code,
        Transaction.amount,
        Transaction.transaction_date,
        Transaction.product_category
    ).join(Transaction)
    
    df = pd.read_sql(query.statement, db.bind)
    
    if df.empty:
        return None, None
        
    # Feature Engineering
    now = datetime.now()
    
    customer_features = df.groupby('id').agg({
        'amount': 'sum',
        'transaction_date': [
            lambda x: (now - x.max()).days, # Recency
            lambda x: (x.max() - x.min()).days # Length
        ],
        'id': 'count', # Frequency
        'product_category': lambda x: x.nunique()
    })
    
    # Flatten MultiIndex columns
    customer_features.columns = ['monetary', 'recency', 'length', 'frequency', 'variety']
    
    return customer_features, df[['id', 'customer_code']].drop_duplicates().set_index('id')

def run_clustering(algorithm: str, params: dict, db: Session, run_name: str):
    features_df, customer_map = get_customer_data(db)
    
    if features_df is None or features_df.empty:
        raise ValueError("Not enough data to cluster")
        
    # Preprocessing
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(features_df)
    
    # Algorithm selection
    if algorithm == 'kmeans':
        n_clusters = int(params.get('n_clusters', 3))
        model = KMeans(n_clusters=n_clusters, random_state=42)
        labels = model.fit_predict(X_scaled)
        
    elif algorithm == 'dbscan':
        eps = float(params.get('eps', 0.5))
        min_samples = int(params.get('min_samples', 5))
        model = DBSCAN(eps=eps, min_samples=min_samples)
        labels = model.fit_predict(X_scaled)
        
    elif algorithm == 'hierarchical':
        n_clusters = int(params.get('n_clusters', 3))
        model = AgglomerativeClustering(n_clusters=n_clusters)
        labels = model.fit_predict(X_scaled)
        
    elif algorithm == 'gmm':
        n_components = int(params.get('n_clusters', 3))
        model = GaussianMixture(n_components=n_components, random_state=42)
        labels = model.fit_predict(X_scaled)

    elif algorithm == 'spectral':
        n_clusters = int(params.get('n_clusters', 3))
        affinity = params.get('affinity', 'rbf')
        model = SpectralClustering(n_clusters=n_clusters, affinity=affinity, random_state=42)
        labels = model.fit_predict(X_scaled)

    elif algorithm == 'birch':
        n_clusters = int(params.get('n_clusters', 3))
        threshold = float(params.get('threshold', 0.5))
        model = Birch(n_clusters=n_clusters, threshold=threshold)
        labels = model.fit_predict(X_scaled)

    elif algorithm == 'meanshift':
        bandwidth = params.get('bandwidth')
        if bandwidth:
            bandwidth = float(bandwidth)
        else:
            bandwidth = None # Let sklearn estimate it
        model = MeanShift(bandwidth=bandwidth)
        labels = model.fit_predict(X_scaled)

    elif algorithm == 'affinity_propagation':
        damping = float(params.get('damping', 0.5))
        model = AffinityPropagation(damping=damping, random_state=42)
        labels = model.fit_predict(X_scaled)
        
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")
        
    # Save Results
    # Create model store directory if not exists
    import os
    import joblib
    
    model_store_dir = "model_store"
    if not os.path.exists(model_store_dir):
        os.makedirs(model_store_dir)
        
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    model_filename = f"{run_name}_{algorithm}_{timestamp}.joblib"
    model_path = os.path.join(model_store_dir, model_filename)
    
    # Save the model
    joblib.dump(model, model_path)

    cluster_result = ClusterResult(
        run_name=run_name,
        algorithm=algorithm,
        parameters=params,
        model_path=model_path
    )
    db.add(cluster_result)
    db.flush()
    
    # Save Customer Clusters
    for customer_id, label in zip(features_df.index, labels):
        cc = CustomerCluster(
            cluster_result_id=cluster_result.id,
            customer_id=customer_id,
            cluster_label=int(label)
        )
        db.add(cc)
        
    db.commit()
    
    # Prepare summary for return
    features_df['cluster'] = labels
    summary = features_df.groupby('cluster').mean().to_dict()
    counts = features_df['cluster'].value_counts().to_dict()
    
    return {
        "run_id": cluster_result.id,
        "counts": counts,
        "centroids": summary
    }
