# Personalized Healthcare Recommendation System

A full-stack, production-ready AI Healthcare Recommendation System built with FastAPI, Next.js, and MongoDB.

## Features
- **Disease Prediction**: Predicts likely diseases based on symptoms using ML.
- **Explainable AI (SHAP)**: Shows which symptoms contributed to the prediction.
- **Recommendations**: Context-aware suggestions for medications, diets, precautions, and workouts.
- **Role-Based Dashboards**: Separate views for Users and Admins.
- **Knowledge Graph**: Foundation for advanced relationship-based recommendations.

## Tech Stack
- **Backend**: Python 3.11, FastAPI, Motor (Async MongoDB)
- **Frontend**: Next.js 14, TailwindCSS, Recharts
- **Machine Learning**: Scikit-learn, XGBoost, SHAP, NetworkX
- **Database**: MongoDB Atlas
- **DevOps**: Docker, Nginx, GitHub Actions CI/CD

## System Setup

### 1. Requirements
- Docker & Docker Compose
- MongoDB Atlas Cluster Connection String
- Data CSV files

### 2. Environment Variables
Copy the example env file and update it with your MongoDB URI:
```bash
cp .env.example .env
```
Ensure `MONGO_URI` in `.env` contains your active Atlas cluster connection string.

### 3. Placing the Data
Place the provided dataset files inside `backend/data/`:
- `Training.csv`
- `description.csv`
- `Symptom-severity.csv`
- `medications.csv`
- `precautions_df.csv`
- `diets.csv`
- `workout_df.csv`

### 4. Running the System
You can spin up the entire system using the newer Docker Compose V2 plugin:
```bash
docker compose up --build
```
This will start:
- **Nginx Reverse Proxy** on `http://localhost:80`
- **Next.js Frontend** on `http://localhost:3000`
- **FastAPI Backend** on `http://localhost:8000`

### 5. Seeding and Machine Learning Training
Once the backend is running, you must open a terminal inside the backend container to seed the database and train the models.

```bash
# 1. Access backend container
docker exec -it <backend_container_name> bash

# 2. Seed database
python app/database/seeder.py

# 3. Train ML Models
python app/ml/train.py
```

### 6. API Documentation
Once running, interactive API docs are available at `http://localhost:8000/docs`.

### HIPAA Compliance Notes
For production environments handling PHI:
- Ensure MongoDB connections use TLS/SSL.
- Enable Field Level Encryption in MongoDB Atlas for fields like `medical_history`.
- Configure short JWT expiration times.
- Keep audit logs secured and immutable.
