import os
import joblib
import pandas as pd
import numpy as np
import shap
from loguru import logger

class DiseasePredictor:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), 'saved_models', 'xgboost_model.pkl')
        self.symptoms_path = os.path.join(os.path.dirname(__file__), 'saved_models', 'symptoms_list.pkl')
        self.model = None
        self.symptoms_list = None
        self.explainer = None
        self.load_model()

    def load_model(self):
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.symptoms_path):
                self.model = joblib.load(self.model_path)
                self.symptoms_list = joblib.load(self.symptoms_path)
                logger.info("ML Model and Symptoms list loaded successfully.")
                
                # Initialize SHAP explainer
                try:
                    self.explainer = shap.TreeExplainer(self.model)
                except Exception as e:
                    logger.warning(f"Could not initialize TreeExplainer: {e}")
            else:
                logger.warning("Model files not found. Please run the training script.")
        except Exception as e:
            logger.error(f"Error loading model: {e}")

    def predict(self, user_symptoms: list, severity_scores: dict = None):
        if not self.model or not self.symptoms_list:
            raise ValueError("Model is not initialized.")
            
        # Create input vector (multi-hot encoded)
        input_vector = np.zeros(len(self.symptoms_list))
        for symptom in user_symptoms:
            simpler_sym = symptom.replace(' ', '_').lower()
            if simpler_sym in self.symptoms_list:
                idx = self.symptoms_list.index(simpler_sym)
                # Apply severity weight if provided
                weight = severity_scores.get(simpler_sym, 1) if severity_scores else 1
                input_vector[idx] = weight
        
        # Predict
        input_df = pd.DataFrame([input_vector], columns=self.symptoms_list)
        prediction = self.model.predict(input_df)[0]
        
        # We need confidence if it's classifier with predict_proba
        confidence = 0.0
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(input_df)[0]
            confidence = float(np.max(probs))

        # Risk Score roughly based on confidence and severe symptoms
        risk = "High" if confidence > 0.8 else "Medium" if confidence > 0.5 else "Low"

        # Explainability
        explanation = {}
        if self.explainer:
            try:
                shap_values = self.explainer.shap_values(input_df)
                if isinstance(shap_values, list): # Multi-class
                    class_idx = list(self.model.classes_).index(prediction)
                    shaps = shap_values[class_idx][0]
                else:
                    shaps = shap_values[0]
                
                # Top 3 contributing symptoms
                top_indices = np.argsort(np.abs(shaps))[-3:][::-1]
                explanation = {self.symptoms_list[i]: float(shaps[i]) for i in top_indices if input_vector[i] > 0}
            except Exception as e:
                logger.error(f"SHAP Error: {e}")

        return {
            "disease": prediction,
            "confidence": confidence,
            "risk_score": risk,
            "shap_explanation": explanation
        }

predictor = DiseasePredictor()
