
import sys
import os
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path to import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from app.core.database import Base, SQLALCHEMY_DATABASE_URL as DATABASE_URL
from app.models.models import Customer, Transaction

def seed_data():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    file_path = os.path.join(os.path.dirname(__file__), '../../data/Online Retail.xlsx')
    print(f"Reading file from: {file_path}")
    
    try:
        df = pd.read_excel(file_path)
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return

    print(f"Loaded {len(df)} rows. Processing...")

    # Drop rows without CustomerID
    df = df.dropna(subset=['CustomerID'])
    
    # Convert CustomerID to int then string
    df['CustomerID'] = df['CustomerID'].astype(int).astype(str)

    # Dictionary to cache customers to avoid Repeated DB queries
    existing_customers = {c.customer_code: c for c in db.query(Customer).all()}
    
    transactions_buffer = []
    customers_buffer = []
    
    # Process customers first
    unique_customers = df['CustomerID'].unique()
    new_customers_count = 0
    
    for code in unique_customers:
        if code not in existing_customers:
            new_customer = Customer(customer_code=code, name=f"Customer {code}")
            db.add(new_customer)
            existing_customers[code] = new_customer # Add to cache object (temporarily until commit)
            new_customers_count += 1
            
    db.commit()
    # Refresh cache with IDs
    existing_customers = {c.customer_code: c for c in db.query(Customer).all()}
    print(f"Added {new_customers_count} new customers.")

    print("Processing transactions...")
    
    # Batch processing for transactions
    batch_size = 5000
    total_txns = 0
    
    for idx, row in df.iterrows():
        customer = existing_customers.get(str(row['CustomerID']))
        if not customer:
            continue
            
        qty = float(row.get('Quantity', 0))
        price = float(row.get('UnitPrice', 0))
        amount = qty * price
        
        # Determine product category from StockCode or Description
        product_cat = str(row.get('StockCode', 'General'))

        txn = Transaction(
            customer_id=customer.id,
            transaction_code=str(row.get('InvoiceNo')),
            transaction_date=pd.to_datetime(row.get('InvoiceDate', datetime.now())),
            amount=amount,
            product_category=product_cat
        )
        transactions_buffer.append(txn)
        
        if len(transactions_buffer) >= batch_size:
            db.bulk_save_objects(transactions_buffer)
            db.commit()
            total_txns += len(transactions_buffer)
            transactions_buffer = []
            print(f"Processed {total_txns} transactions...", end='\r')

    if transactions_buffer:
        db.bulk_save_objects(transactions_buffer)
        db.commit()
        total_txns += len(transactions_buffer)

    print(f"\nFinished! Total transactions processed: {total_txns}")
    db.close()

if __name__ == "__main__":
    seed_data()
