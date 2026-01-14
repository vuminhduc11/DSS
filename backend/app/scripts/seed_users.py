
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Add backend directory to sys.path to import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from app.core.database import Base, SQLALCHEMY_DATABASE_URL as DATABASE_URL
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def seed_users():
    print(f"Connecting to DB at: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    # Define users and their roles
    users_data = [
        {
            "email": "admin@winmart.vn",
            "full_name": "Administrator",
            "password": "admin",
            "role": "admin"
        },
        {
            "email": "staff@winmart.vn",
            "full_name": "Customer Care Staff",
            "password": "staff",
            "role": "staff"
        },
        {
            "email": "system@winmart.vn",
            "full_name": "Retail Data System",
            "password": "system",
            "role": "retail_system"
        }
    ]

    print("Seeding users...")
    
    for user_data in users_data:
        # Check if user exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        
        if existing_user:
            print(f"User {user_data['email']} exists. Updating role...")
            existing_user.role = user_data["role"]
            existing_user.hashed_password = get_password_hash(user_data["password"]) # Update password too just in case
            print(f"Updated {user_data['email']} to role {user_data['role']}")
        else:
            print(f"Creating user {user_data['email']}...")
            new_user = User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_active=True
            )
            db.add(new_user)
            print(f"Created {user_data['email']}")
            
    try:
        db.commit()
        print("Users seeded successfully!")
    except Exception as e:
        print(f"Error seeding users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
