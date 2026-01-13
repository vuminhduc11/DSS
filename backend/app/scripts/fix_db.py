import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from app.core.database import engine, Base, SQLALCHEMY_DATABASE_URL
from app.models.models import CustomerRLFM

print(f"Using Database: {SQLALCHEMY_DATABASE_URL}")

def fix():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")

if __name__ == "__main__":
    fix()
