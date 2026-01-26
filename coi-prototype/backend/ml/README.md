# Priority ML Model

Machine Learning model for priority scoring in the COI system. This module learns optimal priority weights from historical data to improve request prioritization.

## Overview

The Priority ML Model uses Logistic Regression to learn which factors best predict "bad outcomes" (SLA breaches, escalations, complaints, etc.) from historical COI request data. Once trained, it can provide more accurate priority scores than manual rule-based weighting.

## Architecture

- **Python ML Model**: `priority_ml_model.py` - Core model class using scikit-learn
- **Database Module**: `database.py` - SQLite connection and data extraction
- **Training Script**: `train_priority_model.py` - Automated training pipeline
- **Prediction Script**: `predict_priority.py` - Called by Node.js for predictions
- **Node.js Integration**: `../src/services/mlPriorityService.js` - Bridge between Node.js and Python

## Setup

### 1. Install Python Dependencies

```bash
cd coi-prototype/backend/ml
pip install -r requirements.txt
```

Or using a virtual environment (recommended):

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Verify Database Connection

The Python scripts connect to the same SQLite database as the Node.js backend. The database path is determined by the `NODE_ENV` environment variable:

- `development` → `database/coi-dev.db`
- `staging` → `database/coi-staging.db`
- `production` → `database/coi.db`
- `test` → `database/coi-test.db`

Ensure the database exists and contains completed COI requests with outcome data.

### 3. Verify Python Scripts are Executable

```bash
chmod +x train_priority_model.py
chmod +x predict_priority.py
```

## Training the Model

### Prerequisites

Before training, ensure you have:
- **Minimum 500 completed requests** in the database
- **Minimum 50 "bad outcome" cases** (SLA breaches, escalations, etc.)
- Requests must be at least 6 months old (for historical data)

### Running Training

```bash
cd coi-prototype/backend/ml
python3 train_priority_model.py
```

Or with environment variable:

```bash
NODE_ENV=development python3 train_priority_model.py
```

### Training Process

1. **Extract Training Data**: Queries database for completed requests from last 6 months
2. **Validate Data**: Checks minimum record and positive case requirements
3. **Train Model**: Uses Logistic Regression with cross-validation
4. **Save Model**: Stores model file in `models/` directory
5. **Store Weights**: Records learned weights in `ml_weights` table (inactive by default)
6. **Generate Report**: Compares learned weights to manual weights

### Training Output

The script will:
- Save model file: `models/priority_model_YYYYMMDD_HHMMSS.joblib`
- Store weights in database: `ml_weights` table
- Display accuracy metrics and top factors
- Generate comparison report (manual vs learned weights)

**Important**: Models are saved as **inactive** by default. Manual activation is required after review.

## Activating the Model

After training and review, activate the model:

```sql
-- Activate the most recent model
UPDATE ml_weights 
SET is_active = 1, 
    activated_at = CURRENT_TIMESTAMP,
    activated_by = <user_id>
WHERE model_type = 'priority_weights' 
  AND model_id = <model_id>;

-- Deactivate all other models of the same type
UPDATE ml_weights 
SET is_active = 0 
WHERE model_type = 'priority_weights' 
  AND model_id != <model_id>;
```

Or use the admin API endpoint (if available).

## Integration with Node.js

The Node.js backend automatically:
1. Checks for active ML model on startup
2. Uses ML predictions if model is available and accuracy >= 70%
3. Falls back to rule-based scoring if ML unavailable or fails

### How It Works

1. **Request comes in** → `priorityService.calculatePriority(request)`
2. **Check ML availability** → `mlPriorityService.isMLModelAvailable()`
3. **If available**: Call Python script → `predict_priority.py`
4. **If unavailable**: Use rule-based → `calculatePriorityWithRules(request)`

### Prediction Flow

```
Node.js Request
    ↓
mlPriorityService.extractFeatures(request)
    ↓
execFile('python3', ['predict_priority.py', model_path, features_json])
    ↓
Python: Load model → Predict → Return JSON
    ↓
Node.js: Parse result → Log to ml_predictions table
    ↓
Return priority score
```

## Monitoring

### Prediction Logging

Every prediction (ML or rule-based) is logged to `ml_predictions` table:
- `predicted_score`: The calculated priority score
- `predicted_level`: CRITICAL, HIGH, MEDIUM, or LOW
- `prediction_method`: 'ML' or 'RULES'
- `features_snapshot`: JSON of features used
- `actual_outcome`: Filled after request is resolved (GOOD/BAD)

### Accuracy Tracking

Query prediction accuracy:

```sql
SELECT 
    prediction_method,
    predicted_level,
    COUNT(*) as total,
    SUM(CASE WHEN 
        (predicted_level IN ('CRITICAL', 'HIGH') AND actual_outcome = 'BAD') OR
        (predicted_level IN ('MEDIUM', 'LOW') AND actual_outcome = 'GOOD')
        THEN 1 ELSE 0 END) as correct,
    ROUND(SUM(CASE WHEN 
        (predicted_level IN ('CRITICAL', 'HIGH') AND actual_outcome = 'BAD') OR
        (predicted_level IN ('MEDIUM', 'LOW') AND actual_outcome = 'GOOD')
        THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as accuracy_pct
FROM ml_predictions
WHERE outcome_recorded_at >= datetime('now', '-7 days')
GROUP BY prediction_method, predicted_level;
```

## Scheduled Training

### Monthly Training (Cron)

Add to crontab for monthly training:

```bash
# Run on 1st of each month at 2 AM
0 2 1 * * cd /path/to/coi-prototype/backend/ml && python3 train_priority_model.py >> /var/log/ml_training.log 2>&1
```

### Manual Training

Run training script manually when needed:

```bash
cd coi-prototype/backend/ml
python3 train_priority_model.py
```

## Troubleshooting

### "Database file not found"

- Ensure database exists at expected path
- Check `NODE_ENV` environment variable
- Verify database initialization completed

### "Insufficient data"

- Need at least 500 completed requests
- Need at least 50 positive cases (bad outcomes)
- Wait for more data to accumulate

### "ML prediction failed"

- Check Python dependencies are installed
- Verify model file exists at path in database
- Check Python script permissions
- Review Node.js logs for error details

### "Model not available"

- Check `ml_weights` table for active model
- Verify model accuracy >= 0.7
- Ensure model file exists at stored path
- Check Node.js startup logs

## Model Features

The model uses 15 features:

1. `sla_hours_remaining` - Hours until SLA breach
2. `sla_percent_elapsed` - % of SLA time used
3. `has_external_deadline` - Binary: deadline exists
4. `days_to_deadline` - Days until external deadline
5. `is_pie` - Binary: PIE client
6. `is_international` - Binary: International operations
7. `is_statutory_audit` - Binary: Statutory audit service
8. `is_tax_compliance` - Binary: Tax compliance service
9. `escalation_count` - Number of escalations (capped at 3)
10. `current_stage` - Workflow stage (1-5)
11. `hours_in_stage` - Hours in current stage
12. `requester_workload` - Other pending items for requester (who created the request)
13. `day_of_week` - Day of week (0-6)
14. `is_end_of_month` - Binary: Last 5 days of month
15. `is_q4` - Binary: October-December (audit season)

## Target Variable

"Bad outcome" is defined as ANY of:
- SLA breach: Detected via `sla_breach_log` table (breach_type = 'BREACHED' and resolved_at IS NULL)
- Escalation: `escalation_count > 0`
- Partner override: `partner_override = 1`
- Complaint: `complaint_logged = 1`

## Model Selection

**Why Logistic Regression?**
- ✅ Explainable (coefficients = weights)
- ✅ Requires less data (~500 records)
- ✅ Fast training (seconds)
- ✅ Compliance-friendly (can explain decisions)

## Files

- `priority_ml_model.py` - Core ML model class
- `database.py` - Database connection and queries
- `train_priority_model.py` - Training pipeline
- `predict_priority.py` - Prediction script (called by Node.js)
- `requirements.txt` - Python dependencies
- `README.md` - This file
- `models/` - Directory for saved model files (created automatically)

## Support

For issues or questions:
1. Check Node.js logs: `backend/src/services/mlPriorityService.js`
2. Check Python script output
3. Review database `ml_weights` and `ml_predictions` tables
4. Verify model file exists and is readable
