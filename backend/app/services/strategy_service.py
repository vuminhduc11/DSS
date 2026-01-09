from sqlalchemy.orm import Session
from app.models.models import ClusterResult, CustomerCluster, Customer, Transaction
from sqlalchemy import func
import pandas as pd

def generate_strategies(run_id: int, db: Session):
    # Get cluster stats
    # Join CustomerCluster, Transaction to get average spend, frequency per cluster
    
    query = db.query(
        CustomerCluster.cluster_label,
        func.avg(Transaction.amount).label('avg_spend'),
        func.count(Transaction.id).label('transaction_count'),
        func.count(func.distinct(Customer.id)).label('customer_count')
    ).join(Customer, CustomerCluster.customer_id == Customer.id)\
     .join(Transaction, Transaction.customer_id == Customer.id)\
     .filter(CustomerCluster.cluster_result_id == run_id)\
     .group_by(CustomerCluster.cluster_label)
     
    stats = query.all()
    
    strategies = []
    
    for stat in stats:
        label = stat.cluster_label
        avg_spend = stat.avg_spend or 0
        count = stat.transaction_count
        
        # Simple Rule-based Logic
        if avg_spend > 1000:
            strategy = "VIP Treatment: Offer exclusive access to new products and personal concierge."
            segment_name = "High Spenders"
        elif avg_spend > 500:
            strategy = "Upsell: Recommend complementary products to increase basket size."
            segment_name = "Loyal Customers"
        elif avg_spend > 100:
            strategy = "Retention: Send regular newsletters and small discounts."
            segment_name = "Regulars"
        else:
            strategy = "Re-engagement: Send 'We miss you' coupons."
            segment_name = "Low Value / Churn Risk"
            
        strategies.append({
            "cluster": label,
            "segment_name": segment_name,
            "avg_spend": float(avg_spend),
            "customer_count": stat.customer_count,
            "strategy": strategy
        })
        
    return strategies
