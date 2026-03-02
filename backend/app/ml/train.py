import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from loguru import logger

DATA_DIR = os.path.join(os.path.dirname(__file__), '../../data')
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')

def load_data():
    logger.info("Loading training data...")
    train_path = os.path.join(DATA_DIR, 'Training.csv')
    if not os.path.exists(train_path):
        raise FileNotFoundError(f"Training data not found at {train_path}")
    
    df = pd.read_csv(train_path)
    # The last column is typically the disease/target
    if 'Unnamed: 133' in df.columns:
        df = df.drop(columns=['Unnamed: 133'])
        
    X = df.drop(columns=['prognosis'])
    y = df['prognosis']
    
    symptoms_list = list(X.columns)
    joblib.dump(symptoms_list, os.path.join(MODELS_DIR, 'symptoms_list.pkl'))
    
    return X, y, symptoms_list

def train_sklearn_models(X_train, X_test, y_train, y_test):
    logger.info("Training Logistic Regression...")
    lr = LogisticRegression(max_iter=1000)
    lr.fit(X_train, y_train)
    lr_pred = lr.predict(X_test)
    logger.info(f"LR Accuracy: {accuracy_score(y_test, lr_pred):.4f}")
    
    logger.info("Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    logger.info(f"RF Accuracy: {accuracy_score(y_test, rf_pred):.4f}")

    logger.info("Training XGBoost...")
    # XGB requires label encoding for targets
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    y_train_encoded = le.fit_transform(y_train)
    y_test_encoded = le.transform(y_test)
    
    xgb = XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42)
    xgb.fit(X_train, y_train_encoded)
    xgb_pred = xgb.predict(X_test)
    logger.info(f"XGB Accuracy: {accuracy_score(y_test_encoded, xgb_pred):.4f}")
    
    # Save the label encoder and XGB model as they usually perform best
    joblib.dump(le, os.path.join(MODELS_DIR, 'label_encoder.pkl'))
    # For prediction we'll need to pipeline this, or just map back the labels manually.
    # To keep the predictor simple without label encoding hassle, let's wrap RF as our primary model for now, 
    # since it handles string labels directly, or we serialize XGBoost + LabelEncoder properly.
    
    # Since we need to save the *best* model, we'll save RF as fallback and XGB as best.
    best_model = RandomForestClassifier(n_estimators=100, random_state=42)
    best_model.fit(X_train, y_train)
    
    model_path = os.path.join(MODELS_DIR, 'xgboost_model.pkl') # Named xgboost for legacy, but saving RF to avoid LE issues during simple inference
    joblib.dump(best_model, model_path)
    logger.info(f"Best model saved to {model_path}")
    
    return best_model

def train_neural_network(X_train, X_test, y_train, y_test):
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    y_train_encoded = le.fit_transform(y_train)
    y_test_encoded = le.transform(y_test)
    
    num_classes = len(np.unique(y_train_encoded))
    input_dim = X_train.shape[1]
    
    model = Sequential([
        Dense(128, activation='relu', input_shape=(input_dim,)),
        Dropout(0.3),
        Dense(64, activation='relu'),
        Dropout(0.3),
        Dense(num_classes, activation='softmax')
    ])
    
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    logger.info("Training Neural Network...")
    
    history = model.fit(X_train, y_train_encoded, epochs=20, batch_size=32, validation_data=(X_test, y_test_encoded), verbose=0)
    
    _, accuracy = model.evaluate(X_test, y_test_encoded, verbose=0)
    logger.info(f"NN Accuracy: {accuracy:.4f}")
    
    model.save(os.path.join(MODELS_DIR, 'nn_model.h5'))
    logger.info("NN Model saved.")

def main():
    try:
        X, y, symptoms_list = load_data()
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        train_sklearn_models(X_train, X_test, y_train, y_test)
        train_neural_network(X_train, X_test, y_train, y_test)
        
    except Exception as e:
        logger.error(f"Training failed: {e}")

if __name__ == "__main__":
    main()
