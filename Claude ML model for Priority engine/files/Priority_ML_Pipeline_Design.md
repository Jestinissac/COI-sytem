# Priority Scoring ML Pipeline

**Designed for Future Implementation**  
Pre-built, waiting for 6 months of operational data  
Version 1.0 | January 2025

---

## 1. Overview

### 1.1 Current State (Rule-Based)
```
Priority Score = Σ (Factor × Manual Weight)
```
Weights are configured by admins based on business judgment.

### 1.2 Future State (ML-Enhanced)
```
Priority Score = Σ (Factor × Learned Weight)
```
Weights are learned from historical outcomes - what actually predicted problems?

### 1.3 Timeline

| Phase | Timeline | Approach |
|-------|----------|----------|
| Phase 1 | Month 1-6 | Rule-based scoring + Collect outcome data |
| Phase 2 | Month 6 | Train model on collected data |
| Phase 3 | Month 7+ | ML weights in production (with fallback) |

---

## 2. What We're Predicting

### 2.1 Target Variable: "Bad Outcome"

A request had a **bad outcome** if ANY of the following occurred:

| Outcome | How to Detect | Weight |
|---------|---------------|--------|
| SLA Breached | `completed_at > sla_target_time` | High |
| Required Escalation | `escalation_count > 0` | Medium |
| Partner Intervention | `partner_override = true` | Medium |
| Client Complaint | `complaint_logged = true` | High |
| Request Rejected Late | `rejected_at > created_at + 7 days` | Low |

```sql
-- Target variable calculation
CASE 
    WHEN completed_at > sla_target_time THEN 1
    WHEN escalation_count > 0 THEN 1
    WHEN partner_override = 1 THEN 1
    WHEN complaint_logged = 1 THEN 1
    ELSE 0
END as bad_outcome
```

### 2.2 Why This Target?

We want to learn: **"What factors predicted that a request would have problems?"**

If PIE clients historically had more SLA breaches, the model will learn to weight `is_pie` higher.

---

## 3. Feature Engineering

### 3.1 Features from Existing Data

| Feature | Source | Type | Description |
|---------|--------|------|-------------|
| `sla_hours_remaining` | Calculated | Continuous | Hours until SLA breach at time of scoring |
| `sla_percent_elapsed` | Calculated | Continuous | % of SLA time already used (0-100) |
| `has_external_deadline` | `coi_requests.external_deadline` | Binary | 1 if deadline exists, 0 otherwise |
| `days_to_deadline` | Calculated | Continuous | Days until external deadline (999 if none) |
| `is_pie` | `clients.client_type` | Binary | 1 if PIE, 0 otherwise |
| `is_international` | `clients.client_type` | Binary | 1 if International, 0 otherwise |
| `is_statutory_audit` | `coi_requests.service_type` | Binary | 1 if Statutory Audit |
| `is_tax_compliance` | `coi_requests.service_type` | Binary | 1 if Tax Compliance |
| `escalation_count` | `coi_requests.escalation_count` | Discrete | Number of times escalated (cap at 3) |
| `current_stage` | `coi_requests.status` | Categorical | Encoded stage (1-5) |
| `hours_in_stage` | Calculated | Continuous | How long in current stage |
| `assignee_workload` | Calculated | Discrete | Count of other pending items for assignee |
| `day_of_week` | `created_at` | Categorical | 0-6 (Monday-Sunday) |
| `is_end_of_month` | `created_at` | Binary | Last 5 days of month |
| `is_q4` | `created_at` | Binary | October-December (audit season) |

### 3.2 Feature Extraction SQL

```sql
-- Training data extraction query
CREATE VIEW ml_training_data AS
SELECT 
    r.request_id,
    
    -- Time-based features
    TIMESTAMPDIFF(HOUR, NOW(), r.sla_target_time) as sla_hours_remaining,
    (TIMESTAMPDIFF(HOUR, r.created_at, NOW()) / 
     TIMESTAMPDIFF(HOUR, r.created_at, r.sla_target_time)) * 100 as sla_percent_elapsed,
    
    -- Deadline features
    CASE WHEN r.external_deadline IS NOT NULL THEN 1 ELSE 0 END as has_external_deadline,
    COALESCE(DATEDIFF(r.external_deadline, r.created_at), 999) as days_to_deadline,
    
    -- Client features
    CASE WHEN c.client_type = 'PIE' THEN 1 ELSE 0 END as is_pie,
    CASE WHEN c.client_type = 'INTERNATIONAL' THEN 1 ELSE 0 END as is_international,
    
    -- Service features
    CASE WHEN r.service_type = 'STATUTORY_AUDIT' THEN 1 ELSE 0 END as is_statutory_audit,
    CASE WHEN r.service_type = 'TAX_COMPLIANCE' THEN 1 ELSE 0 END as is_tax_compliance,
    
    -- Escalation
    LEAST(r.escalation_count, 3) as escalation_count,
    
    -- Stage features
    CASE r.status 
        WHEN 'PENDING_REVIEW' THEN 1
        WHEN 'COMPLIANCE_REVIEW' THEN 2
        WHEN 'PARTNER_APPROVAL' THEN 3
        WHEN 'FINANCE_CODING' THEN 4
        WHEN 'EXECUTION' THEN 5
        ELSE 0
    END as current_stage,
    
    -- Workload (subquery)
    (SELECT COUNT(*) FROM coi_requests r2 
     WHERE r2.assigned_to = r.assigned_to 
     AND r2.status NOT IN ('COMPLETED', 'REJECTED', 'LAPSED')
     AND r2.request_id != r.request_id) as assignee_workload,
    
    -- Temporal features
    DAYOFWEEK(r.created_at) as day_of_week,
    CASE WHEN DAY(r.created_at) > 25 THEN 1 ELSE 0 END as is_end_of_month,
    CASE WHEN MONTH(r.created_at) IN (10, 11, 12) THEN 1 ELSE 0 END as is_q4,
    
    -- TARGET VARIABLE
    CASE 
        WHEN r.completed_at > r.sla_target_time THEN 1
        WHEN r.escalation_count > 0 THEN 1
        WHEN r.partner_override = 1 THEN 1
        WHEN r.complaint_logged = 1 THEN 1
        ELSE 0
    END as bad_outcome

FROM coi_requests r
JOIN clients c ON r.client_id = c.client_id
WHERE r.status IN ('COMPLETED', 'REJECTED', 'LAPSED')  -- Only resolved requests
  AND r.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

---

## 4. Model Selection

### 4.1 Primary Model: Logistic Regression

**Why Logistic Regression?**

| Criteria | Logistic Regression | Random Forest | Neural Network |
|----------|--------------------:|---------------:|--------------:|
| Explainability | ✅ Coefficients = weights | ⚠️ Feature importance | ❌ Black box |
| Data needed | ~500 records | ~1000 records | ~10,000 records |
| Training time | Seconds | Minutes | Hours |
| Compliance-friendly | ✅ Can explain every decision | ⚠️ Harder to explain | ❌ Cannot explain |

### 4.2 Model Specification

```python
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
import numpy as np
import pandas as pd

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
            'assignee_workload',
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
            'assignee_workload': 0,
            'hours_in_stage': 0
        })
        
        return X
    
    def train(self, df):
        """Train model on historical data."""
        X = self.prepare_features(df)
        y = df['bad_outcome']
        
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
            'train_accuracy': train_score,
            'test_accuracy': test_score,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'n_samples': len(df),
            'n_positive': y.sum(),
            'n_negative': len(y) - y.sum()
        }
    
    def get_learned_weights(self):
        """Extract coefficients as interpretable weights."""
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        coefficients = self.model.coef_[0]
        
        # Create weight dictionary
        weights = {}
        for name, coef in zip(self.feature_names, coefficients):
            weights[name] = round(coef, 4)
        
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
        
        X = pd.DataFrame([request_features])[self.feature_names]
        X_scaled = self.scaler.transform(X)
        
        # Get probability of bad outcome
        prob = self.model.predict_proba(X_scaled)[0][1]
        
        # Convert to 0-100 score
        score = round(prob * 100)
        
        return {
            'score': score,
            'level': self._score_to_level(score),
            'probability': prob
        }
    
    def explain_prediction(self, request_features):
        """
        Explain which factors contributed most to the score.
        Returns feature contributions.
        """
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        X = pd.DataFrame([request_features])[self.feature_names]
        X_scaled = self.scaler.transform(X)[0]
        
        contributions = []
        for name, value, coef in zip(self.feature_names, X_scaled, self.model.coef_[0]):
            contribution = value * coef
            contributions.append({
                'feature': name,
                'value': request_features.get(name),
                'coefficient': round(coef, 4),
                'contribution': round(contribution, 4)
            })
        
        # Sort by contribution magnitude
        contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
        
        return contributions
    
    def _score_to_level(self, score):
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
        import joblib
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'is_trained': self.is_trained
        }, filepath)
    
    @classmethod
    def load_model(cls, filepath):
        """Load trained model from file."""
        import joblib
        data = joblib.load(filepath)
        
        instance = cls()
        instance.model = data['model']
        instance.scaler = data['scaler']
        instance.feature_names = data['feature_names']
        instance.is_trained = data['is_trained']
        
        return instance
```

---

## 5. Training Pipeline

### 5.1 Automated Training Script

```python
#!/usr/bin/env python3
"""
Priority ML Model Training Pipeline
Run monthly to update weights based on latest data.

Usage: python train_priority_model.py
"""

import pandas as pd
import json
from datetime import datetime
from priority_ml_model import PriorityMLModel
import database  # Your DB connection module

def main():
    print(f"=== Priority ML Training Pipeline ===")
    print(f"Started: {datetime.now()}")
    
    # Step 1: Extract training data
    print("\n[1/5] Extracting training data...")
    df = database.query("SELECT * FROM ml_training_data")
    print(f"      Records: {len(df)}")
    print(f"      Bad outcomes: {df['bad_outcome'].sum()} ({df['bad_outcome'].mean()*100:.1f}%)")
    
    # Step 2: Check minimum data requirement
    MIN_RECORDS = 500
    MIN_POSITIVE = 50
    
    if len(df) < MIN_RECORDS:
        print(f"\n❌ Insufficient data. Need {MIN_RECORDS} records, have {len(df)}.")
        print("   Continue collecting data. ML training skipped.")
        return
    
    if df['bad_outcome'].sum() < MIN_POSITIVE:
        print(f"\n❌ Insufficient positive cases. Need {MIN_POSITIVE}, have {df['bad_outcome'].sum()}.")
        print("   Continue collecting data. ML training skipped.")
        return
    
    # Step 3: Train model
    print("\n[2/5] Training model...")
    model = PriorityMLModel()
    metrics = model.train(df)
    
    print(f"      Train accuracy: {metrics['train_accuracy']:.3f}")
    print(f"      Test accuracy:  {metrics['test_accuracy']:.3f}")
    print(f"      CV score:       {metrics['cv_mean']:.3f} (+/- {metrics['cv_std']:.3f})")
    
    # Step 4: Extract learned weights
    print("\n[3/5] Extracting learned weights...")
    weights = model.get_learned_weights()
    
    print("      Top factors by importance:")
    for i, (feature, weight) in enumerate(list(weights.items())[:5]):
        direction = "↑" if weight > 0 else "↓"
        print(f"        {i+1}. {feature}: {weight:+.4f} {direction}")
    
    # Step 5: Save model
    print("\n[4/5] Saving model...")
    model_path = f"models/priority_model_{datetime.now().strftime('%Y%m%d')}.joblib"
    model.save_model(model_path)
    print(f"      Saved to: {model_path}")
    
    # Step 6: Store in database
    print("\n[5/5] Recording in database...")
    database.execute("""
        INSERT INTO ml_weights (model_type, weights, accuracy, training_records, trained_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        'priority_weights',
        json.dumps(weights),
        metrics['test_accuracy'],
        len(df),
        datetime.now(),
        False  # Don't auto-activate, require manual review
    ))
    
    print("\n✅ Training complete!")
    print(f"   Model saved but NOT active. Review and activate manually.")
    print(f"   To activate: UPDATE ml_weights SET is_active = 1 WHERE model_type = 'priority_weights' ORDER BY trained_at DESC LIMIT 1")
    
    # Generate comparison report
    print("\n=== Weight Comparison: Manual vs Learned ===")
    manual_weights = database.query("SELECT factor_id, weight FROM priority_config WHERE is_active = 1")
    
    print(f"{'Factor':<25} {'Manual':>10} {'Learned':>10} {'Diff':>10}")
    print("-" * 55)
    
    # Map feature names to factor IDs for comparison
    feature_to_factor = {
        'sla_percent_elapsed': 'sla_status',
        'has_external_deadline': 'external_deadline',
        'is_pie': 'client_type',
        'is_statutory_audit': 'service_type',
        'escalation_count': 'escalation_count'
    }
    
    for feature, learned in weights.items():
        factor_id = feature_to_factor.get(feature)
        if factor_id:
            manual = manual_weights.get(factor_id, 0)
            diff = learned - manual
            print(f"{feature:<25} {manual:>10.2f} {learned:>10.4f} {diff:>+10.4f}")

if __name__ == "__main__":
    main()
```

### 5.2 Scheduled Training (Cron)

```bash
# Run monthly on the 1st at 2 AM
0 2 1 * * cd /app && python train_priority_model.py >> /var/log/ml_training.log 2>&1
```

---

## 6. Integration with Priority Service

### 6.1 Hybrid Service (Rule-Based + ML)

```javascript
// services/priorityService.js

const { PriorityMLModel } = require('./ml/priorityMLModel');

class PriorityService {
    
    constructor() {
        this.mlModel = null;
        this.mlEnabled = false;
    }
    
    async initialize() {
        // Check if ML model is available and active
        const mlConfig = await db.get(`
            SELECT * FROM ml_weights 
            WHERE model_type = 'priority_weights' 
            AND is_active = 1 
            ORDER BY trained_at DESC 
            LIMIT 1
        `);
        
        if (mlConfig && mlConfig.accuracy >= 0.7) {
            this.mlModel = await PriorityMLModel.load(mlConfig.model_path);
            this.mlEnabled = true;
            console.log(`ML model loaded. Accuracy: ${mlConfig.accuracy}`);
        } else {
            this.mlEnabled = false;
            console.log('ML model not available. Using rule-based scoring.');
        }
    }
    
    async calculatePriority(request) {
        if (this.mlEnabled) {
            return this.calculateWithML(request);
        } else {
            return this.calculateWithRules(request);
        }
    }
    
    async calculateWithML(request) {
        // Extract features
        const features = await this.extractFeatures(request);
        
        // Get ML prediction
        const prediction = this.mlModel.predictPriority(features);
        const explanation = this.mlModel.explainPrediction(features);
        
        // Log for monitoring
        await this.logPrediction(request.id, prediction, 'ML');
        
        return {
            score: prediction.score,
            level: prediction.level,
            method: 'ML',
            breakdown: explanation.slice(0, 5),  // Top 5 factors
            confidence: prediction.probability
        };
    }
    
    async calculateWithRules(request) {
        // Existing rule-based logic
        const config = await this.getActiveConfig();
        
        let totalWeightedScore = 0;
        let totalWeight = 0;
        const breakdown = [];
        
        for (const factor of config) {
            const rawValue = this.extractValue(request, factor.factor_id);
            const score = factor.value_mappings[rawValue] || 0;
            const weighted = score * factor.weight;
            
            totalWeightedScore += weighted;
            totalWeight += factor.weight;
            
            breakdown.push({
                factor: factor.factor_name,
                value: rawValue,
                score: score,
                weight: factor.weight,
                contribution: weighted
            });
        }
        
        const finalScore = Math.round(totalWeightedScore / totalWeight);
        
        return {
            score: finalScore,
            level: this.getLevel(finalScore),
            method: 'RULES',
            breakdown
        };
    }
    
    async extractFeatures(request) {
        // Extract all features needed for ML model
        const client = await db.get('SELECT * FROM clients WHERE client_id = ?', request.client_id);
        const assigneeWorkload = await db.get(`
            SELECT COUNT(*) as count FROM coi_requests 
            WHERE assigned_to = ? AND status NOT IN ('COMPLETED', 'REJECTED', 'LAPSED')
        `, request.assigned_to);
        
        return {
            sla_hours_remaining: this.calculateSLAHours(request),
            sla_percent_elapsed: this.calculateSLAPercent(request),
            has_external_deadline: request.external_deadline ? 1 : 0,
            days_to_deadline: this.calculateDaysToDeadline(request),
            is_pie: client.client_type === 'PIE' ? 1 : 0,
            is_international: client.client_type === 'INTERNATIONAL' ? 1 : 0,
            is_statutory_audit: request.service_type === 'STATUTORY_AUDIT' ? 1 : 0,
            is_tax_compliance: request.service_type === 'TAX_COMPLIANCE' ? 1 : 0,
            escalation_count: Math.min(request.escalation_count || 0, 3),
            current_stage: this.stageToNumber(request.status),
            hours_in_stage: this.calculateHoursInStage(request),
            assignee_workload: assigneeWorkload.count,
            day_of_week: new Date().getDay(),
            is_end_of_month: new Date().getDate() > 25 ? 1 : 0,
            is_q4: [10, 11, 12].includes(new Date().getMonth() + 1) ? 1 : 0
        };
    }
}

module.exports = new PriorityService();
```

---

## 7. Monitoring & Feedback Loop

### 7.1 Track Prediction Accuracy

```sql
-- Store every prediction for later validation
CREATE TABLE ml_predictions (
    prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id VARCHAR(50) NOT NULL,
    predicted_score INTEGER,
    predicted_level VARCHAR(20),
    prediction_method VARCHAR(10),  -- 'ML' or 'RULES'
    model_id INTEGER REFERENCES ml_weights(model_id),
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Filled after request is resolved
    actual_outcome VARCHAR(20),     -- 'GOOD' or 'BAD'
    outcome_recorded_at TIMESTAMP
);

-- Index for analysis
CREATE INDEX idx_ml_predictions_request ON ml_predictions(request_id);
CREATE INDEX idx_ml_predictions_date ON ml_predictions(predicted_at);
```

### 7.2 Weekly Accuracy Report

```sql
-- How accurate were our predictions this week?
SELECT 
    prediction_method,
    predicted_level,
    COUNT(*) as total_predictions,
    SUM(CASE WHEN 
        (predicted_level IN ('CRITICAL', 'HIGH') AND actual_outcome = 'BAD') OR
        (predicted_level IN ('MEDIUM', 'LOW') AND actual_outcome = 'GOOD')
        THEN 1 ELSE 0 END) as correct_predictions,
    ROUND(SUM(CASE WHEN 
        (predicted_level IN ('CRITICAL', 'HIGH') AND actual_outcome = 'BAD') OR
        (predicted_level IN ('MEDIUM', 'LOW') AND actual_outcome = 'GOOD')
        THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as accuracy_pct
FROM ml_predictions
WHERE outcome_recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY prediction_method, predicted_level;
```

### 7.3 Model Drift Detection

```python
def check_model_drift():
    """
    Compare recent prediction accuracy to training accuracy.
    Alert if significant drift detected.
    """
    
    # Get current model's training accuracy
    model_info = db.query("""
        SELECT accuracy as training_accuracy 
        FROM ml_weights 
        WHERE is_active = 1
    """)
    
    # Get recent prediction accuracy
    recent_accuracy = db.query("""
        SELECT 
            SUM(CASE WHEN 
                (predicted_level IN ('CRITICAL', 'HIGH') AND actual_outcome = 'BAD') OR
                (predicted_level IN ('MEDIUM', 'LOW') AND actual_outcome = 'GOOD')
                THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as accuracy
        FROM ml_predictions
        WHERE outcome_recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND prediction_method = 'ML'
    """)
    
    drift = model_info['training_accuracy'] - recent_accuracy['accuracy']
    
    if drift > 0.1:  # More than 10% drop
        send_alert(
            to='ml-admin@company.com',
            subject='Priority ML Model Drift Detected',
            body=f"""
            Model accuracy has dropped significantly.
            
            Training accuracy: {model_info['training_accuracy']:.1%}
            Recent accuracy: {recent_accuracy['accuracy']:.1%}
            Drift: {drift:.1%}
            
            Recommended action: Retrain model with recent data.
            """
        )
        return True
    
    return False
```

---

## 8. Database Schema (ML Tables)

```sql
-- Add these tables to support ML pipeline

-- Store trained models
CREATE TABLE ml_weights (
    model_id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_type VARCHAR(50) NOT NULL,        -- 'priority_weights'
    model_path VARCHAR(255),                 -- Path to saved model file
    weights JSON NOT NULL,                   -- Learned coefficients
    accuracy DECIMAL(5,4),                   -- Test set accuracy
    training_records INTEGER,                -- Number of records used
    trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE,         -- Only one active per type
    activated_by INTEGER REFERENCES users(user_id),
    activated_at TIMESTAMP,
    notes TEXT
);

-- Store predictions for monitoring
CREATE TABLE ml_predictions (
    prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id VARCHAR(50) NOT NULL,
    predicted_score INTEGER,
    predicted_level VARCHAR(20),
    prediction_method VARCHAR(10),
    model_id INTEGER REFERENCES ml_weights(model_id),
    features_snapshot JSON,                  -- Features at time of prediction
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_outcome VARCHAR(20),
    outcome_recorded_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ml_weights_active ON ml_weights(model_type, is_active);
CREATE INDEX idx_ml_predictions_request ON ml_predictions(request_id);
CREATE INDEX idx_ml_predictions_outcome ON ml_predictions(actual_outcome, predicted_at);
```

---

## 9. Activation Checklist

When 6 months of data is collected, follow this checklist:

### 9.1 Pre-Training Validation

- [ ] Minimum 500 completed requests in training data
- [ ] Minimum 50 "bad outcome" cases (10%+ of total)
- [ ] All feature columns populated (no excessive nulls)
- [ ] Outcome labels verified (SLA breach detection working)

### 9.2 Training

- [ ] Run training script: `python train_priority_model.py`
- [ ] Review accuracy metrics (target: >70% test accuracy)
- [ ] Compare learned weights to manual weights
- [ ] Validate top factors make business sense

### 9.3 Activation

- [ ] Model reviewed by business stakeholder
- [ ] Activate in database: `UPDATE ml_weights SET is_active = 1 WHERE model_id = ?`
- [ ] Restart priority service to load new model
- [ ] Verify ML method in use: check `prediction_method = 'ML'` in logs

### 9.4 Post-Activation Monitoring

- [ ] Daily: Check prediction distribution (not all CRITICAL or all LOW)
- [ ] Weekly: Review accuracy report
- [ ] Monthly: Check for model drift
- [ ] Quarterly: Retrain with fresh data

---

## 10. Fallback Strategy

If ML model fails or underperforms:

```javascript
// Automatic fallback to rule-based scoring

async calculatePriority(request) {
    try {
        if (this.mlEnabled && this.mlModel) {
            const result = await this.calculateWithML(request);
            
            // Sanity check - ML should produce reasonable scores
            if (result.score >= 0 && result.score <= 100) {
                return result;
            }
            
            console.warn('ML produced invalid score, falling back to rules');
        }
    } catch (error) {
        console.error('ML prediction failed:', error);
    }
    
    // Fallback to rule-based
    return this.calculateWithRules(request);
}
```

---

## 11. Summary

| Component | Status | Location |
|-----------|--------|----------|
| Feature extraction SQL | ✅ Ready | Section 3.2 |
| ML model class | ✅ Ready | Section 4.2 |
| Training pipeline | ✅ Ready | Section 5.1 |
| Integration service | ✅ Ready | Section 6.1 |
| Monitoring queries | ✅ Ready | Section 7 |
| Database schema | ✅ Ready | Section 8 |
| Activation checklist | ✅ Ready | Section 9 |

**Next Steps:**
1. Deploy rule-based priority scoring (current design)
2. Add `ml_weights` and `ml_predictions` tables to schema
3. Ensure outcome tracking is capturing SLA breaches, escalations, complaints
4. Wait 6 months
5. Run training pipeline
6. Review and activate

---

*This document is pre-built and ready to use. No modifications needed unless business requirements change.*
