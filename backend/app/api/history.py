from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.models.models import ClusterResult, CustomerCluster

router = APIRouter()

class HistoryItem(BaseModel):
    id: int
    run_name: str
    algorithm: str
    created_at: datetime
    parameters: Optional[dict] = None
    customer_count: int

    class Config:
        orm_mode = True

@router.get("/", response_model=List[HistoryItem])
def get_history(db: Session = Depends(get_db)):
    # Fetch runs
    runs = db.query(ClusterResult).order_by(ClusterResult.created_at.desc()).all()
    
    # Calculate customer counts effectively
    # (In a real app, maybe store this count in ClusterResult table to avoid counting every time)
    results = []
    for run in runs:
        count = db.query(CustomerCluster).filter(CustomerCluster.cluster_result_id == run.id).count()
        results.append({
            "id": run.id,
            "run_name": run.run_name,
            "algorithm": run.algorithm,
            "created_at": run.created_at,
            "parameters": run.parameters,
            "customer_count": count
        })
    
    return results

@router.delete("/{run_id}")
def delete_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(ClusterResult).filter(ClusterResult.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Cascade delete should handle CustomerCluster if configured, but let's be safe or rely on DB
    # Assuming standard delete works if no strict constraints or if cascade is set.
    # If not, we might need to delete customer_clusters first.
    db.query(CustomerCluster).filter(CustomerCluster.cluster_result_id == run_id).delete()
    db.delete(run)
    db.commit()
    
    return {"message": "Run deleted successfully"}
