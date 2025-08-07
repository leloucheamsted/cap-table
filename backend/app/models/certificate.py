# app/models/certificate.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base
from datetime import datetime

class ShareCertificate(Base):
    __tablename__ = "share_certificates"

    id = Column(Integer, primary_key=True, index=True)
    issuance_id = Column(Integer, ForeignKey("share_issuances.id"), nullable=False)
    file_path = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
