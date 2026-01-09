from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.clustering_service import run_clustering
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

class ClusteringRequest(BaseModel):
    algorithm: str
    params: Dict[str, Any]
    run_name: str

@router.post("/run")
def trigger_clustering(request: ClusteringRequest, db: Session = Depends(get_db)):
    try:
        result = run_clustering(request.algorithm, request.params, db, request.run_name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
