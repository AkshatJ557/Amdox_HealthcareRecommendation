import pandas as pd
import numpy as np
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from loguru import logger

# Try loading from .env if running standalone
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../../.env'))

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "healthcare_db")

DATA_DIR = os.path.join(os.path.dirname(__file__), '../../data')

async def seed_database():
    logger.info("Starting database seeding process...")
    if not MONGO_URI:
        logger.error("MONGO_URI not found in environment!")
        return

    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DATABASE_NAME]

    await create_collections_and_indexes(db)
    
    # Process and insert Data
    try:
        await process_diseases(db)
        await process_symptoms(db)
        await process_medications(db)
        await process_precautions(db)
        await process_diets(db)
        await process_workouts(db)
        logger.info("Seeding completed successfully!")
    except Exception as e:
        logger.error(f"Error during seeding: {e}")
    finally:
        client.close()

async def create_collections_and_indexes(db):
    collections = ['users', 'medical_records', 'diseases', 'symptoms', 'medications', 
                   'precautions', 'diets', 'workouts', 'activity_logs', 'recommendation_logs', 
                   'reviews', 'model_metrics']
    
    existing = await db.list_collection_names()
    for coll in collections:
        if coll not in existing:
            await db.create_collection(coll)
            logger.info(f"Created collection: {coll}")

    # Create some basic indexes
    await db.diseases.create_index("name", unique=True)
    await db.symptoms.create_index("name", unique=True)
    await db.users.create_index("email", unique=True)

async def _load_csv(filename):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        logger.warning(f"File {filename} not found in {DATA_DIR}. Skipping.")
        return None
    return pd.read_csv(filepath)

async def process_diseases(db):
    try:
        desc_df = await _load_csv("description.csv")
        if desc_df is None: return
        
        # Clean column names
        desc_df.columns = desc_df.columns.str.strip().str.lower()
        
        # We assume columns are 'disease', 'description'
        if 'disease' in desc_df.columns and 'description' in desc_df.columns:
            records = desc_df.to_dict('records')
            
            # Upsert
            from pymongo import UpdateOne
            operations = [
                UpdateOne({"name": r['disease'].strip()}, {"$set": {"description": r['description']}}, upsert=True)
                for r in records
            ]
            if operations:
                await db.diseases.bulk_write(operations)
                logger.info(f"Inserted/Updated {len(operations)} diseases.")
    except Exception as e:
        logger.error(f"Failed to process diseases: {e}")

async def process_symptoms(db):
    try:
        sev_df = await _load_csv("Symptom-severity.csv")
        if sev_df is None: return
        
        sev_df.columns = sev_df.columns.str.strip().str.lower()
        if 'symptom' in sev_df.columns and 'weight' in sev_df.columns:
            records = sev_df.to_dict('records')
            from pymongo import UpdateOne
            operations = [
                UpdateOne({"name": r['symptom'].strip().replace('_', ' ')}, {"$set": {"severity_weight": r['weight']}}, upsert=True)
                for r in records
            ]
            if operations:
                await db.symptoms.bulk_write(operations)
                logger.info(f"Inserted/Updated {len(operations)} symptoms.")
    except Exception as e:
        logger.error(f"Failed to process symptoms: {e}")

async def process_medications(db):
    try:
        med_df = await _load_csv("medications.csv")
        if med_df is None: return
        
        med_df.columns = med_df.columns.str.strip().str.lower()
        if 'disease' in med_df.columns and 'medication' in med_df.columns:
            records = med_df.to_dict('records')
            from pymongo import UpdateOne
            import ast
            
            operations = []
            for r in records:
                disease = r['disease'].strip()
                # Medication list often comes as a string representation of a list
                meds = r['medication']
                if isinstance(meds, str) and meds.startswith('['):
                    try:
                        meds = ast.literal_eval(meds)
                    except:
                        pass
                
                operations.append(
                    UpdateOne({"name": disease}, {"$set": {"medications": meds}}, upsert=True)
                )
            if operations:
                await db.diseases.bulk_write(operations)
                logger.info("Updated diseases with medications.")
    except Exception as e:
        logger.error(f"Failed to process medications: {e}")

async def process_precautions(db):
    try:
        prec_df = await _load_csv("precautions_df.csv")
        if prec_df is None: return
        
        prec_df.columns = prec_df.columns.str.strip().str.lower()
        if 'disease' in prec_df.columns:
            records = prec_df.to_dict('records')
            from pymongo import UpdateOne
            operations = []
            for r in records:
                disease = r['disease'].strip()
                # Collect precautions from precaution_1, precaution_2, etc.
                precs = [v for k, v in r.items() if k.startswith('precaution') and pd.notna(v)]
                operations.append(
                    UpdateOne({"name": disease}, {"$set": {"precautions": precs}}, upsert=True)
                )
            if operations:
                await db.diseases.bulk_write(operations)
                logger.info("Updated diseases with precautions.")
    except Exception as e:
        logger.error(f"Failed to process precautions: {e}")

async def process_diets(db):
    try:
        diet_df = await _load_csv("diets.csv")
        if diet_df is None: return
        
        diet_df.columns = diet_df.columns.str.strip().str.lower()
        if 'disease' in diet_df.columns and 'diet' in diet_df.columns:
            records = diet_df.to_dict('records')
            from pymongo import UpdateOne
            import ast
            operations = []
            for r in records:
                disease = r['disease'].strip()
                diets = r['diet']
                if isinstance(diets, str) and diets.startswith('['):
                    try:
                        diets = ast.literal_eval(diets)
                    except:
                        pass
                operations.append(
                    UpdateOne({"name": disease}, {"$set": {"diets": diets}}, upsert=True)
                )
            if operations:
                await db.diseases.bulk_write(operations)
                logger.info("Updated diseases with diets.")
    except Exception as e:
        logger.error(f"Failed to process diets: {e}")

async def process_workouts(db):
    try:
        workout_df = await _load_csv("workout_df.csv")
        if workout_df is None: return
        
        workout_df.columns = workout_df.columns.str.strip().str.lower()
        if 'disease' in workout_df.columns and 'workout' in workout_df.columns:
            records = workout_df.to_dict('records')
            from pymongo import UpdateOne
            operations = []
            
            # Since sometimes multiple workouts are on multiple rows for same disease,
            # we group them.
            workout_df['disease'] = workout_df['disease'].str.strip()
            grouped = workout_df.groupby('disease')['workout'].apply(list).to_dict()
            
            for disease, workouts in grouped.items():
                operations.append(
                    UpdateOne({"name": disease}, {"$set": {"workouts": workouts}}, upsert=True)
                )
            if operations:
                await db.diseases.bulk_write(operations)
                logger.info("Updated diseases with workouts.")
    except Exception as e:
        logger.error(f"Failed to process workouts: {e}")

if __name__ == "__main__":
    asyncio.run(seed_database())
