from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import Customer, Transaction, ClusterResult, CustomerCluster
from typing import List, Dict, Any

router = APIRouter()

@router.get("/analytics/summary")
def get_summary_stats(db: Session = Depends(get_db)):
    # Total Customers
    total_customers = db.query(Customer).count()
    
    # Total Revenue
    total_revenue = db.query(func.sum(Transaction.amount)).scalar() or 0
    
    # Total Transactions
    total_transactions = db.query(Transaction).count()
    
    # Recent Clustering Runs
    recent_runs = db.query(ClusterResult).order_by(ClusterResult.created_at.desc()).limit(5).all()
    
    return {
        "total_customers": total_customers,
        "total_revenue": total_revenue,
        "total_transactions": total_transactions,
        "recent_runs": [{"id": r.id, "name": r.run_name, "date": r.created_at} for r in recent_runs]
    }

@router.get("/analytics/sales-over-time")
def get_sales_over_time(db: Session = Depends(get_db)):
    # Aggregate sales by month (simplified)
    # Note: In production, use database specific date truncation
    results = db.query(
        func.date_trunc('month', Transaction.transaction_date).label('month'),
        func.sum(Transaction.amount).label('total')
    ).group_by('month').order_by('month').all()
    
    return [{"date": r.month, "amount": r.total} for r in results]

@router.get("/analytics/data-quality")
def get_data_quality_report(db: Session = Depends(get_db)):
    # Basic Descriptive Statistics
    total_transactions = db.query(Transaction).count()
    total_customers = db.query(Customer).count()
    
    if total_transactions == 0:
        return {
            "total_transactions": 0,
            "total_customers": 0,
            "date_range": {"start": None, "end": None},
            "total_revenue": 0,
            "avg_transaction_value": 0,
            "missing_values": {}
        }

    # Date Range
    min_date = db.query(func.min(Transaction.transaction_date)).scalar()
    max_date = db.query(func.max(Transaction.transaction_date)).scalar()
    
    # Revenue Stats
    total_revenue = db.query(func.sum(Transaction.amount)).scalar() or 0
    avg_transaction_value = total_revenue / total_transactions if total_transactions > 0 else 0
    
    # Check for missing values (simplified check on key columns)
    missing_categories = db.query(Transaction).filter(Transaction.product_category == None).count()
    
    return {
        "total_transactions": total_transactions,
        "total_customers": total_customers,
        "date_range": {"start": min_date, "end": max_date},
        "total_revenue": total_revenue,
        "avg_transaction_value": avg_transaction_value,
        "missing_values": {
            "product_category": missing_categories
        }
    }
