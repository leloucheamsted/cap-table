from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    shares = relationship("ShareIssuance", back_populates="owner")

    audit_events_as_user = relationship(
        "AuditEvent", 
        foreign_keys="AuditEvent.user_id",
        back_populates="user",
        lazy="select"
    )
    audit_events_as_target = relationship(
        "AuditEvent", 
        foreign_keys="AuditEvent.target_user_id",
        back_populates="target_user",
        lazy="select"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}', is_admin={self.is_admin})>"
