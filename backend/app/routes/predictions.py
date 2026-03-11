from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from app.models.schemas import PredictionHistory
from app.routes.auth import get_current_user, role_required
from app.database.core import get_database

router = APIRouter()

@router.get("/", response_model=List[PredictionHistory])
async def get_predictions(
    status: Optional[str] = Query(None, description="Filter by status: Pending or Reviewed"),
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch predictions.
    - Admin/Analyst: Can see all predictions (optionally filtered by status).
    - User (Patient): Can only see their own predictions.
    """
    db = get_database()
    query = {}
    
    # Apply Role-Based Access Control logic
    if current_user["role"] == "user":
        query["user_id"] = current_user["id"]
        
    if status:
        query["status"] = status
        
    predictions = []
    cursor = db.predictions.find(query).sort("created_at", -1)
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        
        # Attach user name mapping dynamically
        user_record = await db.users.find_one({"id": doc.get("user_id")})
        doc["user_name"] = user_record.get("name", "Unknown") if user_record else "Unknown"
        
        predictions.append(PredictionHistory(**doc))
        
    return predictions

@router.patch("/{prediction_id}/status", response_model=PredictionHistory)
async def update_prediction_status(
    prediction_id: str,
    status: str,
    feedback: Optional[str] = None,
    current_user: dict = Depends(role_required(["admin", "analyst"]))
):
    """
    Update the status of a prediction (Admin/Analyst only).
    """
    db = get_database()
    
    if status not in ["Pending", "Reviewed", "Removed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    try:
        obj_id = ObjectId(prediction_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid prediction ID format")
        
    update_data = {"status": status}
    if feedback is not None:
        update_data["analyst_feedback"] = feedback
        
    result = await db.predictions.find_one_and_update(
        {"_id": obj_id},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Prediction not found")
        
    result["id"] = str(result.pop("_id"))
    return PredictionHistory(**result)
