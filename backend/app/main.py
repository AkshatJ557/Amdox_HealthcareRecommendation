from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database.core import connect_to_mongo, close_mongo_connection
from app.routes import auth, predict, recovery, analytics
from app.ml.recommendation_engine import recommender
from loguru import logger

app = FastAPI(
    title="Healthcare Recommendation System",
    description="Personalized Healthcare Recommendation API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up the Healthcare Recommendation System...")
    await connect_to_mongo()
    # Build knowledge graph for recommendations
    await recommender.build_knowledge_graph()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down...")
    await close_mongo_connection()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error. Please contact support."}
    )

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(predict.router, prefix="/api", tags=["Prediction"])
app.include_router(recovery.router, prefix="/api", tags=["Recovery"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Healthcare Recommendation System API"}
