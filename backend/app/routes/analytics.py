from fastapi import APIRouter, Depends, HTTPException
from app.routes.auth import get_current_user, get_admin_user, get_analyst_user
from app.database.core import get_database
from loguru import logger
from datetime import datetime, timedelta

router = APIRouter()

# ---------------------------------------------------------
# 1. ANALYST DASHBOARD ENDPOINTS
# ---------------------------------------------------------
@router.get("/analyst/disease-distribution")
async def get_disease_distribution(current_user: dict = Depends(get_analyst_user)):
    """A. Disease Distribution (Bar Chart)"""
    try:
        db = get_database()
        pipeline = [
            {"$group": {"_id": "$predicted_disease", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        result = await db.predictions.aggregate(pipeline).to_list(length=100)
        return [{"disease": r["_id"].title(), "count": r["count"]} for r in result if r["_id"]]
    except Exception as e:
        logger.error(f"Error fetching disease distribution: {e}")
        return []

@router.get("/analyst/users-per-day")
async def get_users_per_day(current_user: dict = Depends(get_analyst_user)):
    """B. Number of Users Per Day (Line Graph)"""
    try:
        db = get_database()
        # Since created_at might not be on old users, we can just fetch all users
        # and group by the ObjectId's generation time if created_at is missing,
        # but let's assume `created_at` or simulate it for now.
        # For simplicity in MongoDB aggregation across string dates vs ObjectIds:
        # We will fetch users and aggregate in Python for robustness here.
        users = await db.users.find({}, {"_id": 1}).to_list(length=None)
        
        counts_by_date = {}
        for u in users:
            # Extract date from ObjectId if created_at isn't heavily enforced
            date_str = u["_id"].generation_time.strftime("%Y-%m-%d") if hasattr(u["_id"], "generation_time") else datetime.utcnow().strftime("%Y-%m-%d")
            counts_by_date[date_str] = counts_by_date.get(date_str, 0) + 1
            
        sorted_dates = sorted(counts_by_date.keys())
        return [{"date": date, "users": counts_by_date[date]} for date in sorted_dates]
    except Exception as e:
        logger.error(f"Error fetching users per day: {e}")
        return []

@router.get("/analyst/disease-trend")
async def get_disease_trend(current_user: dict = Depends(get_analyst_user)):
    """C. Disease Trend Over Time (Multi-Line Graph)"""
    try:
        db = get_database()
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                        "disease": "$predicted_disease"
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.date": 1}}
        ]
        results = await db.predictions.aggregate(pipeline).to_list(length=1000)
        
        # Restructure for Recharts Multi-line
        trend_data = {}
        diseases = set()
        for r in results:
            if not r["_id"]["date"]: continue
            date = r["_id"]["date"]
            disease = r["_id"]["disease"].title() if r["_id"]["disease"] else "Unknown"
            count = r["count"]
            diseases.add(disease)
            
            if date not in trend_data:
                trend_data[date] = {"date": date}
            trend_data[date][disease] = count
            
        # Fill missing with 0
        sorted_dates = sorted(trend_data.keys())
        final_data = []
        for d in sorted_dates:
            row = trend_data[d]
            for dis in diseases:
                if dis not in row:
                    row[dis] = 0
            final_data.append(row)
            
        return final_data
    except Exception as e:
        logger.error(f"Error fetching disease trend: {e}")
        return []

@router.get("/analyst/recovery-stats")
async def get_recovery_stats(current_user: dict = Depends(get_analyst_user)):
    """D & G. Monthly Recoveries & Medicine Effectiveness"""
    try:
        db = get_database()
        recoveries = await db.recovery_status.find().to_list(length=None)
        
        # Monthly 
        monthly = {}
        
        # Effectiveness
        effectiveness = {"Fully Recovered": 0, "Partially Recovered": 0, "No Improvement": 0}
        
        for r in recoveries:
            month = r.get("submitted_at", datetime.utcnow()).strftime("%Y-%m")
            monthly[month] = monthly.get(month, 0) + 1
            
            status = r.get("recovery_status", "Unknown")
            if status in effectiveness:
                effectiveness[status] += 1
                
        # Format monthly
        monthly_formatted = [{"month": m, "recoveries": monthly[m]} for m in sorted(monthly.keys())]
        
        # Format effectiveness
        eff_formatted = [{"name": k, "value": v} for k, v in effectiveness.items()]
        
        return {
            "monthly_recoveries": monthly_formatted,
            "medicine_effectiveness": eff_formatted
        }
    except Exception as e:
        logger.error(f"Error fetching recovery stats: {e}")
        return {"monthly_recoveries": [], "medicine_effectiveness": []}

@router.get("/analyst/prediction-volume")
async def get_prediction_volume(current_user: dict = Depends(get_analyst_user)):
    """E. Prediction Volume Analysis (Area Chart)"""
    try:
        db = get_database()
        pipeline = [
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        results = await db.predictions.aggregate(pipeline).to_list(length=300)
        return [{"date": r["_id"], "predictions": r["count"]} for r in results if r["_id"]]
    except Exception as e:
        logger.error(f"Error fetching prediction volume: {e}")
        return []

@router.get("/analyst/severity-heatmap")
async def get_severity_heatmap(current_user: dict = Depends(get_analyst_user)):
    """F. Severity Heatmap (Approximate based on Risk Score)"""
    try:
        db = get_database()
        pipeline = [
            {
                "$group": {
                    "_id": {"disease": "$predicted_disease", "risk": "$risk_score"},
                    "count": {"$sum": 1}
                }
            }
        ]
        results = await db.predictions.aggregate(pipeline).to_list(length=500)
        
        heatmap_data = {}
        for r in results:
            if not r["_id"]["disease"]: continue
            disease = r["_id"]["disease"].title()
            risk = r["_id"]["risk"] or "Low"
            count = r["count"]
            
            if disease not in heatmap_data:
                heatmap_data[disease] = {"disease": disease, "Low": 0, "Medium": 0, "High": 0, "Emergency": 0}
            heatmap_data[disease][risk] = count
            
        return list(heatmap_data.values())
    except Exception as e:
        logger.error(f"Error fetching severity heatmap: {e}")
        return []

@router.get("/analyst/predictions-vs-reviews")
async def get_predictions_vs_reviews(current_user: dict = Depends(get_analyst_user)):
    """H. Predictions vs Reviews (Bar Chart)"""
    try:
        db = get_database()
        pending = await db.predictions.count_documents({"status": "Pending"})
        reviewed = await db.predictions.count_documents({"status": "Reviewed"})
        removed = await db.predictions.count_documents({"status": "Removed"})
        
        return [
            {"name": "Pending", "count": pending},
            {"name": "Reviewed", "count": reviewed},
            {"name": "Removed", "count": removed}
        ]
    except Exception as e:
        logger.error(f"Error fetching predictions vs reviews: {e}")
        return []

# ---------------------------------------------------------
# 2. ADMIN DASHBOARD ENDPOINTS
# ---------------------------------------------------------

@router.get("/admin/system-stats")
async def get_admin_system_stats(current_user: dict = Depends(get_admin_user)):
    """A, E. Total Users, Growth, Active/Inactive, Most Common Diseases"""
    try:
        db = get_database()
        total_users = await db.users.count_documents({})
        total_predictions = await db.predictions.count_documents({})
        
        # Active vs Inactive (Simplification: Active has prediction in last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        active_pipeline = [
            {"$match": {"created_at": {"$gte": seven_days_ago}}},
            {"$group": {"_id": "$user_id"}}
        ]
        active_users_ids = await db.predictions.aggregate(active_pipeline).to_list(length=None)
        active_count = len(active_users_ids)
        inactive_count = total_users - active_count
        
        inactive_active_chart = [
            {"name": "Active (7 days)", "value": active_count},
            {"name": "Inactive", "value": inactive_count}
        ]
        
        # Most Common Diseases Table
        disease_pipeline = [
            {"$group": {"_id": "$predicted_disease", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        top_diseases = await db.predictions.aggregate(disease_pipeline).to_list(length=5)
        top_diseases_formatted = [{"disease": d["_id"].title() if d["_id"] else "Unknown", "count": d["count"]} for d in top_diseases]

        return {
            "total_users": total_users,
            "total_predictions": total_predictions,
            "active_vs_inactive": inactive_active_chart,
            "top_diseases": top_diseases_formatted
        }
    except Exception as e:
        logger.error(f"Error fetching admin stats: {e}")
        return {}

@router.get("/admin/users")
async def get_admin_users_list(current_user: dict = Depends(get_admin_user)):
    """B. User List Table with Prediction Counts"""
    try:
        db = get_database()
        
        # Get prediction counts per user
        prediction_pipeline = [
            {"$group": {"_id": "$user_id", "prediction_count": {"$sum": 1}, "last_prediction": {"$max": "$created_at"}}}
        ]
        user_stats = await db.predictions.aggregate(prediction_pipeline).to_list(length=None)
        stats_map = {stat["_id"]: stat for stat in user_stats}
        
        users = await db.users.find({}, {"hashed_password": 0}).to_list(length=100) # limit for now
        
        formatted_users = []
        for u in users:
            uid = str(u.get("id")) # check string vs string
            stats = stats_map.get(uid, {"prediction_count": 0, "last_prediction": None})
            
            created_date = u["_id"].generation_time.strftime("%Y-%m-%d") if hasattr(u["_id"], "generation_time") else "Unknown"
            
            formatted_users.append({
                "id": uid,
                "name": u.get("name"),
                "email": u.get("email"),
                "role": u.get("role", "user"),
                "age": u.get("age"),
                "gender": u.get("gender"),
                "prediction_count": stats.get("prediction_count", 0),
                "created_at": created_date
            })
            
        return {"users": formatted_users}
    except Exception as e:
        logger.error(f"Error fetching users list: {e}")
        return {"users": []}

@router.get("/admin/login-times")
async def get_admin_login_times(current_user: dict = Depends(get_admin_user)):
    """C. Login Time Analysis (Bar Chart) - Reusing prediction times as a proxy since login isn't explicitly logged yet"""
    try:
        db = get_database()
        pipeline = [
            {
                "$group": {
                    "_id": {"$hour": "$created_at"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        results = await db.predictions.aggregate(pipeline).to_list(length=24)
        hours = {i: 0 for i in range(24)}
        for r in results:
            if r["_id"] is not None:
                hours[r["_id"]] = r["count"]
            
        return [{"hour": f"{h:02d}:00", "count": c} for h, c in hours.items()]
    except Exception as e:
        logger.error(f"Error fetching login times: {e}")
        return []

# ---------------------------------------------------------
# 3. PATIENT DASHBOARD ENDPOINTS
# ---------------------------------------------------------

@router.get("/patient/timeline")
async def get_patient_timeline(current_user: dict = Depends(get_current_user)):
    """C. Patient Analytics - Predictions & Trend"""
    try:
        db = get_database()
        user_id = current_user["id"]
        
        # Predictions
        predictions = await db.predictions.find({"user_id": user_id}).sort("created_at", -1).to_list(length=50)
        
        trend = []
        formatted_preds = []
        risk_weights = {"Low": 1, "Medium": 2, "High": 3, "Emergency": 4}
        
        for p in predictions:
            date_str = p["created_at"].strftime("%Y-%m-%d") if p.get("created_at") else "Unknown"
            formatted_preds.append({
                "date": date_str,
                "disease": p.get("predicted_disease", "Unknown").title(),
                "risk": p.get("risk_score"),
                "confidence": p.get("confidence")
            })
            
            trend.append({
                "date": date_str,
                "risk_level": risk_weights.get(p.get("risk_score", "Low"), 1)
            })
            
        # Reverse trend for chronological order on graph
        trend.reverse()
        
        # Recoveries
        recoveries = await db.recovery_status.find({"user_id": user_id}).sort("submitted_at", -1).to_list(length=50)
        formatted_recoveries = []
        for r in recoveries:
            date_str = r["submitted_at"].strftime("%Y-%m-%d") if r.get("submitted_at") else "Unknown"
            formatted_recoveries.append({
                "date": date_str,
                "disease": r.get("disease", "Unknown").title(),
                "medication": r.get("medication"),
                "status": r.get("recovery_status"),
            })
            
        return {
            "prediction_count": len(predictions),
            "predictions_history": formatted_preds,
            "risk_trend": trend,
            "recovery_history": formatted_recoveries
        }
    except Exception as e:
        logger.error(f"Error fetching patient timeline: {e}")
        return {"prediction_count": 0, "predictions_history": [], "risk_trend": [], "recovery_history": []}
