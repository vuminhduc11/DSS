import pandas as pd
from sqlalchemy.orm import Session
from app.models.models import Customer, Transaction
from datetime import datetime
import io

def process_upload_file(file_contents: bytes, filename: str, db: Session):
    # Determine file type
    if filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(file_contents))
    elif filename.endswith('.xlsx') or filename.endswith('.xls'):
        df = pd.read_excel(io.BytesIO(file_contents))
    else:
        raise ValueError("Unsupported file format")

    # Expected columns: customer_code, customer_name, transaction_date, amount, product_category
    # Normalize columns if needed
    df.columns = [c.lower().replace(' ', '_') for c in df.columns]
    
    # Simple logic: Ensure customer exists, then add transaction
    # Optimize: Bulk operations would be better for large files, but loop is fine for prototype
    
    processed_count = 0
    
    for _, row in df.iterrows():
        # Find or create customer
        customer_code = str(row.get('customer_code', ''))
        if not customer_code:
            continue
            
        customer = db.query(Customer).filter(Customer.customer_code == customer_code).first()
        if not customer:
            customer = Customer(
                customer_code=customer_code,
                name=row.get('customer_name', 'Unknown')
            )
            db.add(customer)
            db.flush() # Get ID
            
        # Add transaction
        try:
            t_date = pd.to_datetime(row.get('transaction_date', datetime.now()))
        except:
            t_date = datetime.now()
            
        transaction = Transaction(
            customer_id=customer.id,
            transaction_date=t_date,
            amount=float(row.get('amount', 0)),
            product_category=row.get('product_category', 'General')
        )
        db.add(transaction)
        processed_count += 1
        
    db.commit()
    return processed_count
