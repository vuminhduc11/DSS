from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.models.models import Interaction, Customer

router = APIRouter()

class InteractionCreate(BaseModel):
    customer_id: int
    channel: str
    content: str
    sentiment: Optional[str] = "Neutral"
    interaction_date: Optional[datetime] = None

class InteractionResponse(BaseModel):
    id: int
    customer_id: int
    channel: str
    content: str
    sentiment: Optional[str]
    interaction_date: datetime
    
    class Config:
        orm_mode = True

from app.api.auth import RoleChecker

@router.post("/", response_model=InteractionResponse)
def create_interaction(
    interaction: InteractionCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(RoleChecker(["admin", "staff"]))
):
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == interaction.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    db_interaction = Interaction(
        customer_id=interaction.customer_id,
        channel=interaction.channel,
        content=interaction.content,
        sentiment=interaction.sentiment,
        interaction_date=interaction.interaction_date or datetime.utcnow()
    )
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction

@router.get("/customer/{customer_id}", response_model=List[InteractionResponse])
def get_customer_interactions(customer_id: int, db: Session = Depends(get_db)):
    interactions = db.query(Interaction)\
        .filter(Interaction.customer_id == customer_id)\
        .order_by(Interaction.interaction_date.desc())\
        .all()
    return interactions
