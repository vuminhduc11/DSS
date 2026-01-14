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
    # Aggregate sales by month
    try:
        results = db.query(
            func.date_trunc('month', Transaction.transaction_date).label('month'),
            func.sum(Transaction.amount).label('total')
        ).group_by('month').order_by('month').all()
        return [{"date": r.month.strftime('%Y-%m') if r.month else 'Unknown', "amount": r.total} for r in results]
    except Exception:
        db.rollback()
        results = db.query(Transaction.transaction_date, Transaction.amount).all()
        
        if not results:
            return []

        import pandas as pd
        df = pd.DataFrame(results, columns=['date', 'amount'])
        df['month'] = pd.to_datetime(df['date']).dt.to_period('M')
        monthly_sales = df.groupby('month')['amount'].sum().reset_index()
        
        return [{"date": str(r['month']), "amount": r['amount']} for _, r in monthly_sales.iterrows()]

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

from app.services.clustering_service import get_customer_data
import pandas as pd
import numpy as np

@router.get("/analytics/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    try:
        # 1. Sales Over Time (Monthly) - OPTIMIZED with LIMIT
        sales_data = []
        try:
            # Try database-native aggregation first (PostgreSQL)
            sales = db.query(
                func.date_trunc('month', Transaction.transaction_date).label('month'),
                func.sum(Transaction.amount).label('total')
            ).group_by('month').order_by('month').limit(24).all()  # Last 24 months max
            sales_data = [{"date": r.month.strftime('%Y-%m') if r.month else 'Unknown', "amount": float(r.total or 0)} for r in sales]
        except Exception:
            # Fallback to Pandas for SQLite - SAMPLE ONLY 10K records
            db.rollback()
            # CRITICAL FIX: Limit to recent 10K transactions instead of ALL
            sales = db.query(Transaction.transaction_date, Transaction.amount)\
                      .order_by(Transaction.transaction_date.desc())\
                      .limit(10000)\
                      .all()
            if sales:
                df_sales = pd.DataFrame(sales, columns=['date', 'amount'])
                df_sales['month'] = pd.to_datetime(df_sales['date']).dt.to_period('M')
                monthly_sales = df_sales.groupby('month')['amount'].sum().reset_index()
                monthly_sales['month'] = monthly_sales['month'].astype(str)
                # Sort and keep last 24 months
                monthly_sales = monthly_sales.tail(24)
                sales_data = [{"date": r['month'], "amount": float(r['amount'])} for _, r in monthly_sales.iterrows()]


        # 2. Category Share - LIMIT to top 10 categories
        categories = db.query(
            Transaction.product_category,
            func.count(Transaction.id).label('count')
        ).group_by(Transaction.product_category)\
         .order_by(func.count(Transaction.id).desc())\
         .limit(10)\
         .all()
        category_data = [{"name": r.product_category or "Uncategorized", "value": r.count} for r in categories]

        # 3. RFM Distribution - OPTIMIZED: Use sampled data
        rfm_distributions = {}
        try:
            # Pass limit parameter to avoid loading all customers
            features_df, _ = get_customer_data(db, limit=5000)  # Sample 5K customers max
            if features_df is not None and not features_df.empty:
                for col in ['recency', 'frequency', 'monetary', 'length']:
                    if col in features_df.columns:
                        hist, bin_edges = np.histogram(features_df[col].dropna(), bins=10)
                        rfm_distributions[col] = [
                            {"range": f"{int(bin_edges[i])}-{int(bin_edges[i+1])}", "count": int(count)}
                            for i, count in enumerate(hist) if count > 0  # Skip empty bins
                        ]
        except Exception as e:
            print(f"RFM Distribution error: {e}")  # Log for debugging

        # 4. KPI Cards - Fast COUNT queries
        total_customers = db.query(Customer).count()
        total_revenue = db.query(func.sum(Transaction.amount)).scalar() or 0
        total_transactions = db.query(Transaction).count()
        avg_order = float(total_revenue / total_transactions) if total_transactions > 0 else 0

        return {
            "kpi": {
                "total_customers": total_customers,
                "total_revenue": float(total_revenue),
                "avg_order_value": avg_order
            },
            "sales_trend": sales_data,
            "category_share": category_data,
            "rfm_dist": rfm_distributions
        }
    except Exception as e:
        print(f"Dashboard error: {e}")
        import traceback
        traceback.print_exc()  # Full error for debugging
        # Return safe defaults
        return {
            "kpi": {
                "total_customers": 0,
                "total_revenue": 0,
                "avg_order_value": 0
            },
            "sales_trend": [],
            "category_share": [],
            "rfm_dist": {}
        }



