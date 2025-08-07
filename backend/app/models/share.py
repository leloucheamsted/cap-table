from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ShareIssuance(Base):
    __tablename__ = "share_issuances"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow)
    certificate_path = Column(String(255), nullable=True)

    owner = relationship("User", back_populates="shares")
