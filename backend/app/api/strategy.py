from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.strategy_service import generate_strategies
from app.models.models import ClusterResult

router = APIRouter()

@router.get("/strategy/{run_id}")
def get_strategy(run_id: int, db: Session = Depends(get_db)):
    try:
        strategies = generate_strategies(run_id, db)
        return strategies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"id": run.id, "name": run.run_name}

@router.get("/strategy/{run_id}/cluster/{cluster_label}/customers")
def get_cluster_customers(run_id: int, cluster_label: int, db: Session = Depends(get_db)):
    """Get list of customers in a specific cluster for a specific run"""
    from app.models.models import Customer, CustomerCluster, Transaction
    from sqlalchemy import func
    
    # Get customers in this cluster
    customers = db.query(
        Customer.id,
        Customer.customer_code,
        Customer.name,
        func.sum(Transaction.amount).label('total_spend')
    ).join(CustomerCluster, Customer.id == CustomerCluster.customer_id)\
     .outerjoin(Transaction, Customer.id == Transaction.customer_id)\
     .filter(CustomerCluster.cluster_result_id == run_id)\
     .filter(CustomerCluster.cluster_label == cluster_label)\
     .group_by(Customer.id)\
     .order_by(func.sum(Transaction.amount).desc())\
     .all()
     
    return [
        {
            "id": c.id,
            "code": c.customer_code,
            "name": c.name or "Unknown",
            "total_spend": c.total_spend or 0
        }
        for c in customers
    ]
