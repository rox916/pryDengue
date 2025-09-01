from pydantic import BaseModel, Field, validator
from typing import List

class RegisterRequest(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    embedding: List[float] = Field(..., min_items=128, max_items=128)
    
    @validator('embedding')
    def validate_embedding(cls, v):
        if len(v) != 128:
            raise ValueError('El embedding debe tener exactamente 128 elementos')
        
        for i, val in enumerate(v):
            if not isinstance(val, (int, float)):
                raise ValueError(f'Elemento {i} del embedding debe ser numérico')
            if not (-100 <= val <= 100):
                raise ValueError(f'Elemento {i} del embedding está fuera del rango válido')
        
        return v

class AdminSetupRequest(BaseModel):
    embedding: List[float] = Field(..., min_items=128, max_items=128)
    
    @validator('embedding')
    def validate_embedding(cls, v):
        if len(v) != 128:
            raise ValueError('El embedding debe tener exactamente 128 elementos')
        
        for i, val in enumerate(v):
            if not isinstance(val, (int, float)):
                raise ValueError(f'Elemento {i} del embedding debe ser numérico')
            if not (-100 <= val <= 100):
                raise ValueError(f'Elemento {i} del embedding está fuera del rango válido')
        
        return v

class LoginRequest(BaseModel):
    embedding: List[float] = Field(..., min_items=128, max_items=128)
    
    @validator('embedding')
    def validate_embedding(cls, v):
        if len(v) != 128:
            raise ValueError('El embedding debe tener exactamente 128 elementos')
        
        for i, val in enumerate(v):
            if not isinstance(val, (int, float)):
                raise ValueError(f'Elemento {i} del embedding debe ser numérico')
            if not (-100 <= val <= 100):
                raise ValueError(f'Elemento {i} del embedding está fuera del rango válido')
        
        return v

class LoginResponse(BaseModel):
    token: str
    nombre: str

class UserMetrics(BaseModel):
    date: str
    count: int

class MetricsResponse(BaseModel):
    accuracy: float
    users_by_day: List[UserMetrics]