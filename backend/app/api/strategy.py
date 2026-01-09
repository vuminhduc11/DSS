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

@router.get("/strategy/runs/latest")
def get_latest_run_id(db: Session = Depends(get_db)):
    run = db.query(ClusterResult).order_by(ClusterResult.created_at.desc()).first()
    if not run:
        raise HTTPException(status_code=404, detail="No clustering runs found")
    return {"id": run.id, "name": run.run_name}
