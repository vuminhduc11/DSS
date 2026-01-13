import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering, SpectralClustering, Birch, MeanShift, AffinityPropagation
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session
from app.models.models import Customer, Transaction, ClusterResult, CustomerCluster
from datetime import datetime
import json

def get_customer_data(db: Session, start_date: datetime = None, end_date: datetime = None):
    # Aggregate transaction data for each customer
    
    query = db.query(
        Customer.id,
        Customer.customer_code,
        Transaction.amount,
        Transaction.transaction_date,
        Transaction.product_category,
        Transaction.transaction_code
    ).join(Transaction)

    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    df = pd.read_sql(query.statement, db.bind)
    
    if df.empty:
        return None, None
        
    # Feature Engineering
    now = datetime.now()
    
    # Check if transaction_code is populated
    has_txn_code = df['transaction_code'].notna().any()
    
    aggs = {
        'amount': 'sum',
        'transaction_date': [
            lambda x: (now - x.max()).days, # Recency
            lambda x: (x.max() - x.min()).days # Length
        ],
        'product_category': lambda x: x.nunique()
    }
    
    if has_txn_code:
        aggs['transaction_code'] = lambda x: x.nunique() # Frequency = unique orders
    else:
        aggs['id'] = 'count' # Frequency = count of rows
    
    customer_features = df.groupby('id').agg(aggs)
    
    # Flatten MultiIndex columns
    # Order matches dictionary key order
    # amount, transaction_date(recency), transaction_date(length), product_category, transaction_code/id
    # Note: Dictionary order is preserved in Python 3.7+
    
    # We need to explicitly order or map because dict order might vary? 
    # Actually, let's just use flattened names
    customer_features.columns = ['_'.join(col).strip() for col in customer_features.columns.values]
    
    # Rename specifically
    # Expected: amount_sum, transaction_date_<lambda_0>, transaction_date_<lambda_1>, product_category_<lambda>, (transaction_code_<lambda> OR id_count)
    
    rename_map = {
        'amount_sum': 'monetary',
        'transaction_date_<lambda_0>': 'recency',
        'transaction_date_<lambda_1>': 'length',
        'product_category_<lambda>': 'variety'
    }
    
    if has_txn_code:
        rename_map['transaction_code_<lambda>'] = 'frequency'
    else:
        rename_map['id_count'] = 'frequency'
        
    customer_features.rename(columns=rename_map, inplace=True)
    
    # Ensure all required columns exist (if lambda names differ)
    # Just to be safe with lambda naming in older pandas/python
    if 'recency' not in customer_features.columns: 
        customer_features.columns.values[1] = 'recency'
    if 'length' not in customer_features.columns:
        customer_features.columns.values[2] = 'length'
    if 'variety' not in customer_features.columns:
        customer_features.columns.values[3] = 'variety'
    if 'frequency' not in customer_features.columns:
        customer_features.columns.values[4] = 'frequency'
    
    return customer_features, df[['id', 'customer_code']].drop_duplicates().set_index('id')

def run_clustering(
    algorithm: str, 
    params: dict, 
    db: Session, 
    run_name: str,
    start_date: datetime = None,
    end_date: datetime = None,
    save_result: bool = True
):
    features_df, customer_map = get_customer_data(db, start_date, end_date)
    
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
        
    run_id = None
    
    if save_result:
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
        run_id = cluster_result.id
        
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
        "run_id": run_id, 
        "counts": counts,
        "centroids": summary,
        "saved": save_result
    }

def calculate_and_save_rlfm(db: Session):
    features_df, _ = get_customer_data(db) # RLFM always on all data
    
    if features_df is None or features_df.empty:
        return 0
        
    # Clear existing RLFM data? Or update?
    # For now, let's delete all and recreate for simplicity, or upsert.
    # Given the request is to "process" and save, clearing old might be cleaner to avoid stale data.
    from app.models.models import CustomerRLFM
    db.query(CustomerRLFM).delete()
    
    rlfm_records = []
    timestamp = datetime.now()
    
    for customer_id, row in features_df.iterrows():
        record = CustomerRLFM(
            customer_id=int(customer_id),
            recency=float(row['recency']),
            frequency=float(row['frequency']),
            monetary=float(row['monetary']),
            length=float(row['length']),
            variety=float(row['variety']),
            created_at=timestamp
        )
        rlfm_records.append(record)
    
    db.bulk_save_objects(rlfm_records)
    db.commit()
    return len(rlfm_records)

