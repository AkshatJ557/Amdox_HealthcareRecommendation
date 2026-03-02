from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    current_medications: Optional[List[str]] = []

class UserInDB(UserCreate):
    role: str = "user" # user, admin, analyst
    hashed_password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    age: Optional[int] = None
    gender: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class SymptomInput(BaseModel):
    symptoms: List[str]

class PredictionResponse(BaseModel):
    predicted_disease: str
    confidence_score: float
    risk_score: str
    recommended_medicines: List[str]
    precautions: List[str]
    diet: List[str]
    workout: List[str]
    shap_explanation: Dict[str, Any]

class DiseaseDetail(BaseModel):
    name: str
    description: Optional[str] = None
    medications: Optional[List[str]] = []
    precautions: Optional[List[str]] = []
    diets: Optional[List[str]] = []
    workouts: Optional[List[str]] = []

class RecoveryStatusCreate(BaseModel):
    disease: str
    medication: str
    recovery_status: str  # Fully Recovered, Partially Recovered, No Improvement
    improvement_days: str # 1–3 days, 4–7 days, More than 7 days, No improvement
    side_effect_level: str # None, Mild, Moderate, Severe

class RecoveryStatusInDB(RecoveryStatusCreate):
    id: str
    user_id: str
    submitted_at: datetime
