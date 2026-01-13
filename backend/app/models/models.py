from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="customer")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    transaction_code = Column(String, index=True, nullable=True)
    transaction_date = Column(DateTime)
    amount = Column(Float)
    product_category = Column(String, nullable=True)
    
    customer = relationship("Customer", back_populates="transactions")

class ClusterResult(Base):
    __tablename__ = "cluster_results"

    id = Column(Integer, primary_key=True, index=True)
    run_name = Column(String)
    algorithm = Column(String)
    parameters = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    model_path = Column(String, nullable=True)
    
    customer_clusters = relationship("CustomerCluster", back_populates="cluster_result")

class CustomerCluster(Base):
    __tablename__ = "customer_clusters"
    
    id = Column(Integer, primary_key=True, index=True)
    cluster_result_id = Column(Integer, ForeignKey("cluster_results.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    cluster_label = Column(Integer)
    
    cluster_result = relationship("ClusterResult", back_populates="customer_clusters")

class CustomerRLFM(Base):
    __tablename__ = "customer_rlfm"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    
    recency = Column(Float)
    frequency = Column(Float)
    monetary = Column(Float)
    length = Column(Float)
    variety = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer")
