from typing import Optional
from pydantic import BaseModel


class AddressData(BaseModel):
    line1:       str
    city:        str
    country:     str
    line2:       Optional[str] = None
    state:       Optional[str] = None
    postal_code: Optional[str] = None


class CreateCompanyRequest(BaseModel):
    legal_name:           str
    capital_social:       float
    director_name:        str
    start_date:           str
    industry:             str
    email:                str
    phone:                str
    country:              str
    address:              AddressData
    activity_description: Optional[str] = None
    currency:             Optional[str] = "TND"


class UpdateCompanyRequest(BaseModel):
    legal_name:           Optional[str]       = None
    capital_social:       Optional[float]     = None
    director_name:        Optional[str]       = None
    start_date:           Optional[str]       = None
    industry:             Optional[str]       = None
    activity_description: Optional[str]       = None
    email:                Optional[str]       = None
    phone:                Optional[str]       = None
    country:              Optional[str]       = None
    currency:             Optional[str]       = None
    address:              Optional[AddressData] = None


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone:     Optional[str] = None
    email:     Optional[str] = None