from sqlalchemy.orm import Session
from app.models.share import ShareIssuance
from typing import Dict

def calculate_user_capital(db: Session, user_id: int) -> Dict[str, float]:
    """
    Calculate total shares and capital amount for a user
    """
    try:
        share_issuances = db.query(ShareIssuance).filter(
            ShareIssuance.owner_id == user_id
        ).all()
        
        total_shares = sum(issuance.shares_amount for issuance in share_issuances)
        total_capital = sum(
            issuance.shares_amount * (issuance.price_per_share or 0.0) 
            for issuance in share_issuances
        )
        
        return {
            "total_shares": total_shares,
            "capital_amount": total_capital
        }
        
    except Exception as e:
        print(f"Error calculating user capital: {e}")
        return {
            "total_shares": 0,
            "capital_amount": 0.0
        }

def get_user_with_capital(db: Session, user_id: int):
    """
    Get user with calculated capital information
    """
    from app.models.user import User
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    capital_info = calculate_user_capital(db, user_id)
    
    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_admin": user.is_admin,
        "created_at": user.created_at,
        "total_shares": capital_info["total_shares"],
        "capital_amount": capital_info["capital_amount"]
    }
    
    return user_data