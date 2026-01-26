#!/usr/bin/env python3
"""
Priority ML Model
Logistic Regression model to learn optimal priority weights.
Designed to be simple, explainable, and compliance-friendly.
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
import joblib
import os


class PriorityMLModel:
    """
    Logistic Regression model to learn optimal priority weights.
    Designed to be simple, explainable, and compliance-friendly.
    """
    
    def __init__(self):
        self.model = LogisticRegression(
            penalty='l2',           # Ridge regularization (prevents overfitting)
            C=1.0,                  # Regularization strength
            class_weight='balanced', # Handle imbalanced outcomes
            max_iter=1000,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.feature_names = [
            'sla_hours_remaining',
            'sla_percent_elapsed',
            'has_external_deadline',
            'days_to_deadline',
            'is_pie',
            'is_international',
            'is_statutory_audit',
            'is_tax_compliance',
            'escalation_count',
            'current_stage',
            'hours_in_stage',
            'requester_workload',
            'day_of_week',
            'is_end_of_month',
            'is_q4'
        ]
        self.is_trained = False
    
    def prepare_features(self, df):
        """Extract and scale features."""
        X = df[self.feature_names].copy()
        
        # Handle missing values
        X = X.fillna({
            'days_to_deadline': 999,
            'requester_workload': 0,
            'hours_in_stage': 0,
            'escalation_count': 0,
            'sla_hours_remaining': 0,
            'sla_percent_elapsed': 0
        })
        
        return X
    
    def train(self, df):
        """Train model on historical data."""
        X = self.prepare_features(df)
        y = df['bad_outcome']
        
        # Check if we have enough positive cases
        positive_count = y.sum()
        if positive_count < 10:
            raise ValueError(f"Insufficient positive cases: {positive_count}. Need at least 10.")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        cv_scores = cross_val_score(self.model, X_train_scaled, y_train, cv=5)
        
        return {
            'train_accuracy': float(train_score),
            'test_accuracy': float(test_score),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'n_samples': len(df),
            'n_positive': int(positive_count),
            'n_negative': int(len(y) - positive_count)
        }
    
    def get_learned_weights(self):
        """Extract coefficients as interpretable weights."""
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        coefficients = self.model.coef_[0]
        
        # Create weight dictionary
        weights = {}
        for name, coef in zip(self.feature_names, coefficients):
            weights[name] = round(float(coef), 4)
        
        # Sort by absolute importance
        weights_sorted = dict(sorted(
            weights.items(), 
            key=lambda x: abs(x[1]), 
            reverse=True
        ))
        
        return weights_sorted
    
    def predict_priority(self, request_features):
        """
        Predict priority score for a single request.
        Returns probability of bad outcome (0-100 scale).
        """
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        # Ensure all features are present
        feature_dict = {}
        for name in self.feature_names:
            feature_dict[name] = request_features.get(name, 0)
        
        X = pd.DataFrame([feature_dict])[self.feature_names]
        X_scaled = self.scaler.transform(X)
        
        # Get probability of bad outcome
        prob = self.model.predict_proba(X_scaled)[0][1]
        
        # Convert to 0-100 score
        score = round(prob * 100)
        
        return {
            'score': score,
            'level': self._score_to_level(score),
            'probability': float(prob)
        }
    
    def explain_prediction(self, request_features):
        """
        Explain which factors contributed most to the score.
        Returns feature contributions.
        """
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        # Ensure all features are present
        feature_dict = {}
        for name in self.feature_names:
            feature_dict[name] = request_features.get(name, 0)
        
        X = pd.DataFrame([feature_dict])[self.feature_names]
        X_scaled = self.scaler.transform(X)[0]
        
        contributions = []
        for name, value, coef in zip(self.feature_names, X_scaled, self.model.coef_[0]):
            contribution = value * coef
            contributions.append({
                'feature': name,
                'value': request_features.get(name, 0),
                'coefficient': round(float(coef), 4),
                'contribution': round(float(contribution), 4)
            })
        
        # Sort by contribution magnitude
        contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
        
        return contributions
    
    def _score_to_level(self, score):
        """Convert numeric score to priority level."""
        if score >= 80:
            return 'CRITICAL'
        elif score >= 60:
            return 'HIGH'
        elif score >= 40:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def save_model(self, filepath):
        """Save trained model to file."""
        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'is_trained': self.is_trained
        }, filepath)
    
    @classmethod
    def load_model(cls, filepath):
        """Load trained model from file."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
        
        data = joblib.load(filepath)
        
        instance = cls()
        instance.model = data['model']
        instance.scaler = data['scaler']
        instance.feature_names = data['feature_names']
        instance.is_trained = data['is_trained']
        
        return instance
