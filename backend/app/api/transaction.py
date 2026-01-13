from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.core.database import get_db
from app.models.models import Customer, Transaction

router = APIRouter()

class TransactionCreate(BaseModel):
    customer_code: str
    customer_name: Optional[str] = None
    transaction_date: datetime
    amount: float
    product_category: Optional[str] = None

@router.post("/")
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    # 1. Check or Create Customer
    customer = db.query(Customer).filter(Customer.customer_code == transaction.customer_code).first()
    if not customer:
        customer = Customer(
            customer_code=transaction.customer_code,
            name=transaction.customer_name
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
    
    # 2. Create Transaction
    new_transaction = Transaction(
        customer_id=customer.id,
        transaction_code=f"MANUAL-{int(datetime.utcnow().timestamp())}", # Simple ID generation
        transaction_date=transaction.transaction_date,
        amount=transaction.amount,
        product_category=transaction.product_category
    )
    
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    
    return {
        "message": "Transaction created successfully",
        "transaction_id": new_transaction.id,
        "customer": customer.customer_code
    }

@router.get("/")
def get_transactions(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db)
):
    total = db.query(Transaction).count()
    transactions = db.query(Transaction)\
        .order_by(Transaction.transaction_date.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return {
        "total": total,
        "items": [
            {
                "id": t.id,
                "code": t.transaction_code,
                "date": t.transaction_date,
                "amount": t.amount,
                "category": t.product_category,
                "customer_code": t.customer.customer_code if t.customer else "N/A"
            }
            for t in transactions
        ]
    }
