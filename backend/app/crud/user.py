from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from sqlalchemy import func  
from app.core.security import hash_password
from app.models.share import ShareIssuance  

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate, is_admin=False):
    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        is_admin=is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_all_users(db: Session):
    return db.query(User).all()

def get_shareholders_with_shares(db: Session):
     return db.query(
        User,
        func.coalesce(func.sum(ShareIssuance.amount), 0).label('total_shares')
    ).outerjoin(
        ShareIssuance, User.id == ShareIssuance.owner_id 
    ).filter(
        User.is_admin == False  
    ).group_by(
        User.id
    ).all()

# get user by ID
def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()
        

def get_shares_distribution(db: Session):
    total_shares = db.query(func.sum(ShareIssuance.amount)).scalar() or 0
    
    distribution = b.query(
        User.name,
        func.sum(ShareIssuance.amount).label('shares_count')
    ).join(
        ShareIssuance, User.id == ShareIssuance.owner_id  
    ).filter(
        User.is_admin == False  
    ).group_by(
        User.id, User.name
    ).all()
    
    return {
        'total_shares': total_shares,
        'distribution': [
            {
                'shareholder_name': item.name,
                'shares_count': item.shares_count,
                'percentage': round((item.shares_count / total_shares * 100), 2) if total_shares > 0 else 0
            }
            for item in distribution
        ]
    }