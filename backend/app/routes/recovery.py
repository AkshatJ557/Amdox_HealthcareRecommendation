from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import RecoveryStatusCreate, RecoveryStatusInDB
from app.routes.auth import get_current_user
from app.database.core import get_database
from loguru import logger
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/recovery", response_model=dict)
async def submit_recovery_status(
    feedback: RecoveryStatusCreate, 
    current_user: dict = Depends(get_current_user)
):
    try:
        db = get_database()
        
        recovery_entry = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "disease": feedback.disease,
            "medication": feedback.medication,
            "recovery_status": feedback.recovery_status,
            "improvement_days": feedback.improvement_days,
            "side_effect_level": feedback.side_effect_level,
            "submitted_at": datetime.utcnow()
        }
        
        await db.recovery_status.insert_one(recovery_entry)
        logger.info(f"Recovery status logged for user {current_user['email']} (Disease: {feedback.disease})")
        
        return {"message": "Recovery feedback submitted successfully", "id": recovery_entry["id"]}
        
    except Exception as e:
        logger.error(f"Error submitting recovery status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit recovery status: {str(e)}")
