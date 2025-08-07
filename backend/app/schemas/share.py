from pydantic import BaseModel, EmailStr, ConfigDict

from typing import Optional
from datetime import datetime
from typing import List

from app.schemas.user import UserOut

class ShareIssuanceBase(BaseModel):
    amount: int
    owner_id: int  
    price_per_share: float = 1.0  


class ShareholderLogin(BaseModel):
    email: EmailStr
    password: str

class ShareIssuanceCreate(ShareIssuanceBase):
    user_id: int

class ShareIssuanceOut(ShareIssuanceBase):
    id: int
    issued_at: datetime
    certificate_path: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class ShareIssuanceWithOwner(ShareIssuanceBase):
    id: int
    issued_at: datetime
    certificate_path: Optional[str]
    certificate_download_url: Optional[str] = None  
    owner: UserOut
    model_config = ConfigDict(from_attributes=True)

class ShareholderLogin(BaseModel):
    email: EmailStr
    password: str

class ShareholderResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        orm_mode = True

class ShareIssuanceResponse(BaseModel):
    id: int
    num_shares: int
    date_issued: datetime
    certificate_url: Optional[str] = None

    class Config:
        orm_mode = True


class ShareholderWithShares(BaseModel):
    id: int
    name: str
    email: EmailStr
    total_shares: int
    created_at: datetime

    class Config:
        orm_mode = True

class ShareDistributionItem(BaseModel):
    shareholder_name: str
    shares_count: int
    percentage: float

class ShareDistributionResponse(BaseModel):
    total_shares: int
    distribution: List[ShareDistributionItem]