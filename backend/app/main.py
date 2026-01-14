from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Customer Segmentation DSS", version="1.0.0")

# CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import upload, clustering, analytics, strategy, auth, rlfm
from app.core.database import engine, Base
from app.models import models
from app.models.user import User

Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(upload.router, prefix="/api/v1", tags=["upload"])
app.include_router(clustering.router, prefix="/api/v1", tags=["clustering"])
app.include_router(analytics.router, prefix="/api/v1", tags=["analytics"])
app.include_router(strategy.router, prefix="/api/v1", tags=["strategy"])
app.include_router(rlfm.router, prefix="/api/v1/rlfm", tags=["rlfm"])
from app.api import transaction
app.include_router(transaction.router, prefix="/api/v1/transaction", tags=["transaction"])
from app.api import history
app.include_router(history.router, prefix="/api/v1/history", tags=["history"])
from app.api import interactions
app.include_router(interactions.router, prefix="/api/v1/interactions", tags=["interactions"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Customer Segmentation DSS API"}
