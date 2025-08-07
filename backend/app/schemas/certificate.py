from pydantic import BaseModel
from datetime import datetime

class ShareCertificateOut(BaseModel):
    id: int
    issuance_id: int
    file_path: str
    created_at: datetime

    class Config:
        orm_mode = True
