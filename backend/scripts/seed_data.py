import sys
import os
import pandas as pd
from datetime import datetime
import warnings

# Add backend directory to sys.path to allow imports from app
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, engine
from app.models.models import Base, Customer, Transaction, ClusterResult
from app.services.clustering_service import run_clustering

warnings.filterwarnings("ignore")

def seed_data():
    print("=== STARTING DATA INJECTION ===")
    
    # Ensure tables exist
    print("Creating tables if not exist...")
    Base.metadata.create_all(bind=engine)
    
    # Path to file - Adjust if needed
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'Online Retail.xlsx')
    
    if not os.path.exists(file_path):
        print(f"ERROR: File not found at {file_path}")
        return

    print(f"Reading {file_path}...")
    try:
        df = pd.read_excel(file_path)
    except Exception as e:
        print(f"Error reading Excel: {e}")
        return

    print(f"Original Row Count: {len(df)}")
    
    # 1. Cleaning
    print("Cleaning data...")
    df = df.dropna(subset=['CustomerID', 'InvoiceDate', 'Quantity', 'UnitPrice'])
    df = df[df['Quantity'] > 0]
    df = df[df['UnitPrice'] > 0]
    df['CustomerID'] = df['CustomerID'].astype(int).astype(str)
    df['TotalAmount'] = df['Quantity'] * df['UnitPrice']
    
    print(f"Cleaned Row Count: {len(df)}")
    
    db = SessionLocal()
    
    try:
        # Check existing
        existing_txns = db.query(Transaction).count()
        if existing_txns > 0:
            print(f"Database already has {existing_txns} transactions.")
            # Optional: Clear DB? For "Urgent" request imply "Make it work", so let's APPEND or UPSERT.
            # But duplicate checks are slow. 
            # If user said "Inject", I'll assume they want this data.
            # To be safe and fast, let's just insert customers not present, then transactions.
        
        # 2. Insert Customers
        print("Processing Customers...")
        unique_customers = df[['CustomerID', 'Country']].drop_duplicates('CustomerID')
        
        # Get existing codes
        existing_codes = set(c[0] for c in db.query(Customer.customer_code).all())
        
        new_customers = []
        for _, row in unique_customers.iterrows():
            code = row['CustomerID']
            if code not in existing_codes:
                new_customers.append(Customer(
                    customer_code=code,
                    customer_name=f"Customer {code}",
                    email=f"customer{code}@example.com" 
                ))
                existing_codes.add(code) # Prevent dupes in same batch
        
        if new_customers:
            print(f"Inserting {len(new_customers)} new customers...")
            db.bulk_save_objects(new_customers)
            db.commit()
        else:
            print("No new customers to insert.")
            
        # Refresh map
        customer_map = {c.customer_code: c.id for c in db.query(Customer).all()}
        
        # 3. Insert Transactions
        print("Processing Transactions...")
        # To avoid duplicates, we might need a strategy. 
        # For now, let's assume if DB was empty we insert all. 
        # If DB not empty, we might duplicate. 
        # STRICT mode: Check if InvoiceNo exists? Too slow for 500k rows.
        # Let's just insert the last 5000 records to show it works fast, OR all of them?
        # User said "Inject Online Retail". I will inject ALL.
        
        # Optimization: Prepare objects list
        transactions = []
        
        # Iterate df
        # Using itertuples for speed
        total_rows = len(df)
        batch_size = 5000
        count = 0
        
        for row in df.itertuples():
            c_id = customer_map.get(row.CustomerID)
            if c_id:
                t = Transaction(
                    customer_id=c_id,
                    transaction_code=str(row.InvoiceNo),
                    transaction_date=pd.to_datetime(row.InvoiceDate),
                    amount=float(row.TotalAmount),
                    product_category=str(row.Description)[:100] # Truncate if needed
                )
                transactions.append(t)
                
                if len(transactions) >= batch_size:
                    db.bulk_save_objects(transactions)
                    db.commit()
                    transactions = []
                    count += batch_size
                    print(f"Inserted {count}/{total_rows} transactions...")
        
        if transactions:
            db.bulk_save_objects(transactions)
            db.commit()
            print("Finished inserting transactions.")
            
        # 4. Run Analysis
        print("Running Initial Analysis (K-Means, 3 Clusters)...")
        # Run clustering
        result = run_clustering(
            algorithm="kmeans",
            params={"n_clusters": 3},
            db=db,
            run_name="Auto-Generated Initial Analysis",
            save_result=True
        )
        
        print("SUCCESS: Analysis Complete.")
        print(f"Run ID: {result['run_id']}")
        print(f"Counts: {result['counts']}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
