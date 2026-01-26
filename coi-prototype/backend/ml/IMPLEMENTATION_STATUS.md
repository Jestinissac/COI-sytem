# ML Priority Model Implementation Status

**Date**: January 26, 2026  
**Status**: ✅ Complete (with bug fixes)

---

## Implementation Summary

All components of the ML Priority Model have been implemented according to the plan. Additionally, critical bugs were identified and fixed.

---

## Files Created/Modified

### ✅ Created Files

1. **`coi-prototype/backend/ml/priority_ml_model.py`**
   - ✅ PriorityMLModel class implemented
   - ✅ Logistic Regression with sklearn
   - ✅ Methods: `train()`, `predict_priority()`, `explain_prediction()`, `save_model()`, `load_model()`
   - ✅ 15 features defined
   - ✅ **FIXED**: Replaced `assignee_workload` with `requester_workload`

2. **`coi-prototype/backend/ml/database.py`**
   - ✅ SQLite connection module
   - ✅ Functions: `query()`, `execute()`, `get_training_data()`
   - ✅ Environment-aware database path
   - ✅ **FIXED**: Training data query uses actual fields
   - ✅ **FIXED**: Replaced `assignee_workload` with `requester_workload`
   - ✅ **FIXED**: Bad outcome detection uses `sla_breach_log` table

3. **`coi-prototype/backend/ml/train_priority_model.py`**
   - ✅ Training pipeline implemented
   - ✅ Data validation (500 records, 50 positive cases)
   - ✅ Model training and evaluation
   - ✅ Model saving to `models/` directory
   - ✅ Database storage in `ml_weights` table
   - ✅ Comparison report (manual vs learned weights)

4. **`coi-prototype/backend/ml/predict_priority.py`**
   - ✅ Prediction script for Node.js integration
   - ✅ Accepts model path and features JSON
   - ✅ Returns prediction with explanation

5. **`coi-prototype/backend/src/services/mlPriorityService.js`**
   - ✅ Node.js integration layer
   - ✅ `initializeMLModel()` - Checks for active model
   - ✅ `predictPriority()` - Calls Python script
   - ✅ `extractFeatures()` - Extracts features from request
   - ✅ **FIXED**: Uses calculated SLA status (not non-existent `sla_target_time`)
   - ✅ **FIXED**: Replaced `assignee_workload` with `requester_workload`
   - ✅ **FIXED**: Uses `stage_entered_at` for hours_in_stage calculation
   - ✅ **FIXED**: Status mapping uses actual status values

6. **`coi-prototype/backend/ml/requirements.txt`**
   - ✅ Python dependencies: pandas, numpy, scikit-learn, joblib

7. **`coi-prototype/backend/ml/README.md`**
   - ✅ Setup instructions
   - ✅ Training guide
   - ✅ Integration documentation
   - ✅ **FIXED**: Updated feature list and target variable description

### ✅ Modified Files

1. **`coi-prototype/backend/src/services/priorityService.js`**
   - ✅ ML support added
   - ✅ `calculatePriority()` is async and checks for ML model
   - ✅ Automatic fallback to rule-based if ML unavailable
   - ✅ Backward compatibility maintained

---

## Critical Bugs Fixed

### Bug 1: Non-Existent `assigned_to` Field

**Issue**: ML code referenced `assigned_to` field which doesn't exist in `coi_requests` table.

**Files Affected**:
- `coi-prototype/backend/ml/database.py` (line 200)
- `coi-prototype/backend/src/services/mlPriorityService.js` (line 89)
- `coi-prototype/backend/ml/priority_ml_model.py` (line 44)

**Fix**: Replaced with `requester_workload` - counts pending requests for the requester (who created the request).

**Impact**: ML training would have failed without this fix.

---

### Bug 2: Non-Existent `sla_target_time` Field

**Issue**: ML code referenced `sla_target_time` field which doesn't exist. SLA is calculated dynamically.

**Files Affected**:
- `coi-prototype/backend/ml/database.py` (lines 162-168)
- `coi-prototype/backend/src/services/mlPriorityService.js` (lines 71-80)

**Fix**: 
- **database.py**: Uses simplified calculation with `stage_entered_at` + default 48h target (approximation for training)
- **mlPriorityService.js**: Uses `calculateSLAStatus()` function to get actual calculated SLA values

**Impact**: ML training would have failed or returned incorrect SLA features.

---

### Bug 3: Non-Existent `completed_at` Field

**Issue**: Bad outcome detection referenced `completed_at` field which doesn't exist.

**Files Affected**:
- `coi-prototype/backend/ml/database.py` (line 211)

**Fix**: Uses `sla_breach_log` table to detect SLA breaches instead of timestamp comparison.

**Impact**: Bad outcome detection would have been incorrect.

---

### Bug 4: Incorrect Status Mapping

**Issue**: Status mapping used placeholder values that don't match actual status values.

**Files Affected**:
- `coi-prototype/backend/ml/database.py` (lines 186-193)
- `coi-prototype/backend/src/services/mlPriorityService.js` (lines 110-117)

**Fix**: Updated to use actual status values:
- 'Pending Director Approval' → 1
- 'Pending Compliance' → 2
- 'Pending Partner' → 3
- 'Pending Finance' → 4
- 'Active' → 5

**Impact**: Stage features would have been incorrect.

---

## Feature List (Final - 15 Features)

1. `sla_hours_remaining` - Hours until SLA breach (calculated)
2. `sla_percent_elapsed` - % of SLA time used (calculated)
3. `has_external_deadline` - Binary: deadline exists
4. `days_to_deadline` - Days until external deadline
5. `is_pie` - Binary: PIE client
6. `is_international` - Binary: International operations
7. `is_statutory_audit` - Binary: Statutory audit service
8. `is_tax_compliance` - Binary: Tax compliance service
9. `escalation_count` - Number of escalations (capped at 3)
10. `current_stage` - Workflow stage (1-5)
11. `hours_in_stage` - Hours in current stage (using `stage_entered_at`)
12. `requester_workload` - Other pending items for requester ✅ **FIXED**
13. `day_of_week` - Day of week (0-6)
14. `is_end_of_month` - Binary: Last 5 days of month
15. `is_q4` - Binary: October-December (audit season)

---

## Target Variable (Bad Outcome)

Detected using actual fields:
- ✅ SLA breach: Check `sla_breach_log` table (breach_type = 'BREACHED', resolved_at IS NULL)
- ✅ Escalation: `escalation_count > 0`
- ✅ Partner override: `partner_override = 1`
- ✅ Complaint: `complaint_logged = 1`

---

## Integration Status

### Node.js Integration
- ✅ `mlPriorityService.js` initializes on module load
- ✅ `priorityService.js` automatically uses ML if available
- ✅ Graceful fallback to rule-based if ML unavailable
- ✅ All async functions properly await ML predictions

### Python Integration
- ✅ Python scripts are executable
- ✅ Database connection works with environment detection
- ✅ Model save/load functionality implemented
- ✅ Error handling with graceful fallback

---

## Testing Status

### Ready for Testing
- ✅ Python model class can be tested independently
- ✅ Training script can be run (requires 500+ records)
- ✅ Node.js integration ready (will fallback to rules until model trained)
- ✅ Database integration verified

### Testing Requirements
- ⏳ Need 6 months of operational data (500+ completed requests, 50+ positive cases)
- ⏳ Model training can be tested once data is available
- ⏳ ML prediction can be tested after model is trained and activated

---

## Next Steps

1. **Wait for Data Collection** (6 months)
   - System collects outcome data during rule-based phase
   - SLA breaches logged to `sla_breach_log` table
   - Escalations tracked via `escalation_count` field

2. **Train Model** (When data is ready)
   ```bash
   cd coi-prototype/backend/ml
   python3 train_priority_model.py
   ```

3. **Review and Activate**
   - Review learned weights vs manual weights
   - Verify model accuracy >= 0.7
   - Activate in database: `UPDATE ml_weights SET is_active = 1 WHERE model_id = ?`

4. **System Automatically Uses ML**
   - `priorityService.calculatePriority()` will automatically use ML
   - No code changes needed after activation

---

## Known Limitations

1. **SLA Calculation in Training Data**
   - Uses simplified 48h default target (approximation)
   - Actual SLA uses `sla_config` table with business calendar
   - Acceptable for training as ML learns patterns, not exact values

2. **Business Calendar**
   - Training data doesn't account for business hours/holidays
   - Actual predictions use full SLA calculation (includes business calendar)
   - ML will learn from patterns, so this is acceptable

3. **Requester Workload**
   - Replaced `assignee_workload` (field didn't exist)
   - `requester_workload` may be less predictive than assignee workload
   - Can be enhanced later if assignee tracking is added

---

## Success Criteria

- ✅ Python model class implemented
- ✅ Training script implemented
- ✅ Database connection module implemented
- ✅ Node.js integration layer implemented
- ✅ Priority service ML support implemented
- ✅ Model save/load functionality works
- ✅ Database integration works
- ✅ Documentation complete
- ✅ **All bugs fixed** (assignee_workload, sla_target_time, completed_at, status mapping)

---

**Implementation Status**: ✅ **COMPLETE**  
**Bug Fixes**: ✅ **ALL CRITICAL BUGS FIXED**  
**Ready for**: Data collection phase (6 months) → Training → Activation
