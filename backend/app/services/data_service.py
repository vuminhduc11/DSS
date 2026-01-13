import pandas as pd
from sqlalchemy.orm import Session
from app.models.models import Customer, Transaction
from datetime import datetime
import io

def preview_upload_file(file_contents: bytes, filename: str):
    if filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(file_contents), nrows=5) # Read only first 5 rows for preview
    elif filename.endswith('.xlsx') or filename.endswith('.xls'):
        df = pd.read_excel(io.BytesIO(file_contents), nrows=5)
    else:
        raise ValueError("Unsupported file format")
    
    # Return available columns and a small sample
    columns = list(df.columns)
    sample = df.head().to_dict(orient='records')
    # Convert dates to string in sample for JSON serializability
    for row in sample:
        for k, v in row.items():
            if isinstance(v, (datetime, pd.Timestamp)):
                row[k] = str(v)
                
    return {"columns": columns, "sample": sample}

def process_upload_file(file_contents: bytes, filename: str, db: Session, mapping: dict = None):
    # Determine file type
    if filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(file_contents))
    elif filename.endswith('.xlsx') or filename.endswith('.xls'):
        df = pd.read_excel(io.BytesIO(file_contents))
    else:
        raise ValueError("Unsupported file format")

    # Mapping: { "customer_code": "User ID", "amount": "Total", "quantity": "Qty", "unit_price": "Price", "transaction_code": "InvoiceNo" ... }
    # Map columns based on user selection
    
    # We need to handle 'amount' vs 'quantity' + 'unit_price' explicitly before generic renaming
    # because generic renaming assumes 1-to-1 mapping to standard names
    
    standard_columns = {v: k for k, v in mapping.items() if v}
    # standard_columns maps "Original Name" -> "standard_name" (e.g., "InvoiceNo" -> "transaction_code")
    
    # Control fields that are not actual columns
    control_fields = {'amount_mode'}
    
    if mapping:
         # Check existence of column mappings (skip control fields)
        for target, source in mapping.items():
            if target in control_fields:
                continue  # Skip control fields
            if source and source not in df.columns:
                raise ValueError(f"Column '{source}' not found for '{target}'")
    
    processed_count = 0
    
    for _, row in df.iterrows():
        # Resolve Customer Code
        c_col = mapping.get('customer_code')
        customer_code = str(row.get(c_col, '')) if c_col else str(row.get(df.columns[0]))
        
        if not customer_code or customer_code.lower() == 'nan':
            continue
            
        customer = db.query(Customer).filter(Customer.customer_code == customer_code).first()
        if not customer:
            name_col = mapping.get('customer_name')
            customer_name = str(row.get(name_col, 'Unknown')) if name_col else 'Unknown'
            customer = Customer(
                customer_code=customer_code,
                name=customer_name
            )
            db.add(customer)
            db.flush()
            
        # Add transaction
        try:
            date_col = mapping.get('transaction_date')
            date_val = row.get(date_col) if date_col else datetime.now()
            if date_val:
                t_date = pd.to_datetime(date_val)
            else:
                t_date = datetime.now()
        except:
            t_date = datetime.now()
            
        # Calculate Amount
        amount = 0.0
        if mapping.get('amount'):
            amount = float(row.get(mapping['amount'], 0))
        elif mapping.get('quantity') and mapping.get('unit_price'):
            try:
                qty = float(row.get(mapping['quantity'], 0))
                price = float(row.get(mapping['unit_price'], 0))
                amount = qty * price
            except:
                amount = 0.0
                
        # Transaction Code (for Frequency)
        txn_code_col = mapping.get('transaction_code')
        txn_code = str(row.get(txn_code_col)) if txn_code_col else None
        
        # Product Category
        cat_col = mapping.get('product_category')
        category = str(row.get(cat_col, 'General')) if cat_col else 'General'

        transaction = Transaction(
            customer_id=customer.id,
            transaction_code=txn_code,
            transaction_date=t_date,
            amount=amount,
            product_category=category
        )
        db.add(transaction)
        processed_count += 1
        
    db.commit()
    return processed_count
