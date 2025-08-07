from pydantic import BaseModel, EmailStr,validator, ConfigDict
from typing import Optional
from datetime import datetime

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    name: str
    email: EmailStr
    password: str
    confirm_password: str
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()

class UserOut(UserBase):
    id: int
    is_admin: bool
    created_at: datetime
    total_shares: Optional[int] = None
    capital_amount: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class UserProfile(UserBase):
    id: int
    is_admin: bool
    created_at: datetime
    total_shares: Optional[int] = None
    capital_amount: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)