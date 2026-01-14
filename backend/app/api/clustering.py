from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.clustering_service import run_clustering
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

from datetime import date
from typing import Optional

class ClusteringRequest(BaseModel):
    algorithm: str
    params: Dict[str, Any]
    run_name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    save_result: bool = True

from app.api.auth import RoleChecker

@router.post("/run")
def trigger_clustering(
    request: ClusteringRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(RoleChecker(["admin", "staff"]))
):
    try:
        result = run_clustering(
            request.algorithm, 
            request.params, 
            db, 
            request.run_name,
            start_date=request.start_date,
            end_date=request.end_date,
            save_result=request.save_result
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
