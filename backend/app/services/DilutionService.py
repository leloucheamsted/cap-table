from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.share import ShareIssuance
from app.models.user import User
from typing import Dict, List
import json

class DilutionService:
    @staticmethod
    def calculate_dilution_impact(
        db: Session, 
        new_owner_id: int, 
        new_shares_amount: int
    ) -> Dict:
        """
        Calculer l'impact de dilution avant et après l'émission
        """
        
        current_total_shares = db.query(func.sum(ShareIssuance.amount)).scalar() or 0
        
        current_distribution = db.query(
            User.id,
            User.name,
            User.email,
            func.sum(ShareIssuance.amount).label('shares_count')
        ).join(
            ShareIssuance, User.id == ShareIssuance.owner_id
        ).filter(
            User.is_admin == False
        ).group_by(
            User.id, User.name, User.email
        ).all()
        
        new_total_shares = current_total_shares + new_shares_amount
        
        before_distribution = []
        after_distribution = []
        dilution_impact = []
        
        # Existing shareholders
        for user_id, name, email, shares_count in current_distribution:
            # Pourcentage avant
            before_percentage = (shares_count / current_total_shares * 100) if current_total_shares > 0 else 0
            
            # Pourcentage après (même nombre d'actions, mais total augmenté)
            after_percentage = (shares_count / new_total_shares * 100)
            
            # Dilution subie
            dilution = before_percentage - after_percentage
            
            before_distribution.append({
                "user_id": user_id,
                "name": name,
                "email": email,
                "shares_count": shares_count,
                "percentage": round(before_percentage, 4)
            })
            
            after_distribution.append({
                "user_id": user_id,
                "name": name,
                "email": email,
                "shares_count": shares_count,
                "percentage": round(after_percentage, 4)
            })
            
            dilution_impact.append({
                "user_id": user_id,
                "name": name,
                "email": email,
                "dilution_percentage": round(dilution, 4),
                "shares_lost_equivalent": round((dilution / 100) * current_total_shares, 2)
            })
        
        # Nouveau détenteur
        new_owner = db.query(User).filter(User.id == new_owner_id).first()
        existing_shares = db.query(func.sum(ShareIssuance.amount)).filter(
            ShareIssuance.owner_id == new_owner_id
        ).scalar() or 0
        
        total_shares_after_issuance = existing_shares + new_shares_amount
        new_owner_percentage = (total_shares_after_issuance / new_total_shares * 100)
        
        # Ajouter le nouveau détenteur à la distribution après
        found_existing = False
        for item in after_distribution:
            if item["user_id"] == new_owner_id:
                item["shares_count"] = total_shares_after_issuance
                item["percentage"] = round(new_owner_percentage, 4)
                found_existing = True
                break
        
        if not found_existing:
            after_distribution.append({
                "user_id": new_owner_id,
                "name": new_owner.name,
                "email": new_owner.email,
                "shares_count": total_shares_after_issuance,
                "percentage": round(new_owner_percentage, 4)
            })
        
        return {
            "before_issuance": {
                "total_shares": current_total_shares,
                "distribution": before_distribution
            },
            "after_issuance": {
                "total_shares": new_total_shares,
                "distribution": sorted(after_distribution, key=lambda x: x["percentage"], reverse=True)
            },
            "dilution_impact": {
                "new_shares_issued": new_shares_amount,
                "new_owner": {
                    "user_id": new_owner_id,
                    "name": new_owner.name,
                    "email": new_owner.email,
                    "new_shares_received": new_shares_amount,
                    "total_shares_owned": total_shares_after_issuance,
                    "ownership_percentage": round(new_owner_percentage, 4)
                },
                "existing_shareholders_dilution": dilution_impact,
                "total_dilution_effect": round(sum([d["dilution_percentage"] for d in dilution_impact]), 4)
            },
            "summary": {
                "total_shareholders": len(after_distribution),
                "average_dilution_per_shareholder": round(
                    sum([d["dilution_percentage"] for d in dilution_impact]) / len(dilution_impact), 4
                ) if dilution_impact else 0,
                "most_diluted_shareholder": max(dilution_impact, key=lambda x: x["dilution_percentage"]) if dilution_impact else None
            }
        }
    
    @staticmethod
    def log_dilution_event(
        db: Session,
        admin_user_id: int,
        dilution_data: Dict,
        issuance_id: int,
        request
    ):
        """Logger l'événement de dilution pour audit"""
        from app.services.AuditService import AuditService
        from app.models.audit_event import AuditEventType
        
        try:
            AuditService.log_event(
                db=db,
                event_type=AuditEventType.SHARE_ISSUED,  # On peut créer un nouveau type si nécessaire
                user_id=admin_user_id,
                details={
                    "action": "dilution_calculation",
                    "issuance_id": issuance_id,
                    "dilution_summary": {
                        "new_shares_issued": dilution_data["dilution_impact"]["new_shares_issued"],
                        "total_shareholders_affected": len(dilution_data["dilution_impact"]["existing_shareholders_dilution"]),
                        "average_dilution": dilution_data["summary"]["average_dilution_per_shareholder"],
                        "new_total_shares": dilution_data["after_issuance"]["total_shares"]
                    },
                    "most_affected_shareholder": dilution_data["summary"]["most_diluted_shareholder"]
                },
                request=request
            )
        except Exception as e:
            print(f"Warning: Could not log dilution event: {e}")