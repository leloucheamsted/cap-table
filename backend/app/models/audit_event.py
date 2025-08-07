from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
from enum import Enum

class AuditEventType(str, Enum):
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_CREATED = "user_created"
    SHARE_ISSUED = "share_issued"
    CERTIFICATE_DOWNLOADED = "certificate_downloaded"
    PASSWORD_CHANGED = "password_changed"
    TOKEN_REFRESHED = "token_refreshed"
    ADMIN_ACCESS = "admin_access"
    DATA_EXPORT = "data_export"
    SHARE_ISSUANCE_FAILED = "share_issuance_failed" 
    DILUTION_CALCULATED = "dilution_calculated"  # 

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  
    ip_address = Column(String(45), nullable=True)  # Support IPv6
    user_agent = Column(Text, nullable=True)
    details = Column(Text, nullable=True)  # JSON details
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    user = relationship(
        "User", 
        foreign_keys=[user_id], 
        back_populates="audit_events_as_user"
    )
    target_user = relationship(
        "User", 
        foreign_keys=[target_user_id], 
        back_populates="audit_events_as_target"
    )

    def __repr__(self):
        return f"<AuditEvent(type={self.event_type}, user_id={self.user_id}, created_at={self.created_at})>"