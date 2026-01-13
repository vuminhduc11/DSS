from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.clustering_service import calculate_and_save_rlfm
from app.models.models import CustomerRLFM, Customer

router = APIRouter()

@router.post("/process")
def process_rlfm(db: Session = Depends(get_db)):
    try:
        count = calculate_and_save_rlfm(db)
        return {"message": "RLFM calculation completed successfully", "count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data")
def get_rlfm_data(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    total = db.query(CustomerRLFM).count()
    results = db.query(CustomerRLFM, Customer.customer_code).join(Customer).offset(skip).limit(limit).all()
    
    data = []
    for rlfm, code in results:
        data.append({
            "id": rlfm.id,
            "customer_code": code,
            "recency": rlfm.recency,
            "frequency": rlfm.frequency,
            "monetary": rlfm.monetary,
            "length": rlfm.length,
            "variety": rlfm.variety,
            "created_at": rlfm.created_at
        })
        
    return {"total": total, "data": data}
