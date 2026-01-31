# Intelligent Notification Management: Reducing System-Generated Noise

## Executive Summary

The COI System implements a two-layer intelligent filtering mechanism that reduces notification volume by 70-82% while ensuring critical items receive immediate attention. The system uses Service Level Agreement (SLA) thresholds for time-based urgency classification and machine learning (ML) priority scoring for predictive importance ranking. This approach transforms notification management from a reactive, volume-driven process to a proactive, intelligence-driven workflow.

**Key Metrics:**
- **70-82% reduction** in total notification volume
- **Immediate delivery** for critical SLA breaches (0-2 hour response window)
- **Batched digest** for routine items (5-minute aggregation window)
- **Priority-based sorting** ensures high-risk items appear first
- **Automatic filtering** of low-priority items when volume exceeds thresholds

---

## Business Challenge: Notification Overload

In a typical operational scenario, approvers may receive 25 or more pending COI requests requiring attention. Without intelligent filtering, this results in:

- **Volume overload**: One email per request, creating inbox clutter
- **Priority confusion**: Urgent items buried among routine notifications
- **Decision fatigue**: Manual sorting required to identify critical items
- **Missed deadlines**: Important items overlooked due to noise

This creates operational inefficiency and increases the risk of compliance violations and client service failures.

---

## Solution Architecture: Two-Layer Intelligent Filtering

The system employs a hierarchical filtering approach that evaluates notifications through two distinct layers:

1. **Layer 1: Time-Based Urgency Classification (SLA Filter)**
   - Evaluates deadline proximity using Service Level Agreement thresholds
   - Separates urgent items requiring immediate action from routine items

2. **Layer 2: Predictive Importance Ranking (ML Priority Filter)**
   - Scores items based on historical risk patterns
   - Sorts batched notifications by predicted likelihood of issues
   - Filters low-priority items when volume exceeds configured thresholds

---

## Layer 1: Time-Based Urgency Classification

### Operational Logic

The SLA filter evaluates each request's position relative to its deadline using dynamically calculated Service Level Agreement status. The system calculates SLA status in real-time using:
- Stage entry timestamp (`stage_entered_at`)
- Configured target hours per workflow stage (from `sla_config` table)
- Business calendar for working hours calculation

**Classification Rules:**

| SLA Status | Threshold | Delivery Method | Rationale |
|------------|-----------|-----------------|-----------|
| **BREACHED** | ≥100% of target time | Immediate notification | Request has exceeded deadline; requires urgent intervention |
| **CRITICAL** | ≥90% of target time | Immediate notification | Request approaching deadline; high risk of breach |
| **WARNING** | 75-90% of target time | Batched digest | Request needs attention soon; can be grouped with similar items |

### Implementation Details

- **Immediate alerts**: Sent within seconds of detection for BREACHED and CRITICAL status
- **Batched digest**: WARNING status items aggregated into 5-minute windows
- **Breach logging**: All SLA breaches recorded in `sla_breach_log` table for audit and analysis

### Business Impact

**Noise Reduction**: Approximately 80% reduction in urgent email volume
- Without filtering: 25 separate urgent emails
- With filtering: 3-5 immediate alerts + 1 digest with 20-22 routine items

---

## Layer 2: Predictive Importance Ranking

### Current Implementation: Rule-Based Scoring

The system currently uses configurable business rules to calculate priority scores (0-100 scale) based on:

- **SLA Status**: Calculated dynamically using stage entry time and target hours
- **External Deadline**: Presence and proximity of client-imposed deadlines
- **PIE Status**: Public Interest Entity classification (higher regulatory scrutiny)
- **International Operations**: Cross-border engagement complexity
- **Service Type**: Complexity and regulatory requirements vary by service category
- **Escalation History**: Number of times request has been escalated (`escalation_count` field)

**Priority Levels:**
- **CRITICAL** (80-100): Highest risk of issues; requires immediate attention
- **HIGH** (60-79): Elevated risk; should be prioritized
- **MEDIUM** (40-59): Moderate risk; standard processing
- **LOW** (0-39): Minimal risk; can be deferred if volume is high

### Future Enhancement: ML-Enhanced Scoring

After 6 months of operational data collection, the system will transition to machine learning-based priority scoring. The ML model will learn from historical outcomes to identify patterns that predict issues.

**Data Collection During Rule-Based Phase:**

The system continuously collects outcome data for ML training:

1. **SLA Breach Detection**: 
   - Recorded in `sla_breach_log` table when breach occurs
   - Calculated using `calculateSLAStatus()` function comparing elapsed time to target hours

2. **Escalation Tracking**: 
   - Stored in `escalation_count` field (incremented on each escalation)
   - Available for analysis of escalation patterns

3. **Partner Intervention**: 
   - Tracked via `partner_override` field (boolean flag)
   - Indicates requests requiring partner-level decision override

4. **Client Complaints**: 
   - Recorded in `complaint_logged` field (boolean flag)
   - Captures service quality issues

5. **Request Resolution**: 
   - Tracked via `status` field transitions (e.g., 'Active', 'Rejected', 'Lapsed')
   - Completion determined by status change, not timestamp field

**ML Learning Process:**

The ML model will analyze historical data to identify correlations between request characteristics and outcomes:

- **Pattern Recognition**: Identifies which combinations of factors (PIE status + service type + external deadline) correlate with SLA breaches
- **Weight Optimization**: Adjusts priority factor weights based on actual outcomes rather than assumptions
- **Continuous Improvement**: Model retrained quarterly with new data to adapt to changing patterns

**Example Learning Scenario (Hypothetical):**

*Note: The following is a hypothetical example for illustration purposes only. Actual patterns will be determined by historical data analysis after 6 months of operation.*

- **Initial Rule**: "PIE clients are always high priority" (assumption-based)
- **ML Discovery**: Analysis reveals "PIE clients in Tax Advisory services with external deadlines have 85% higher likelihood of SLA breach" (data-driven)
- **Result**: ML model automatically adjusts weights to prioritize this combination more accurately

**Important Clarification:**

ML predictions represent probability estimates based on historical patterns, not guarantees. A request with 85% predicted risk means that, historically, requests with similar characteristics had an 85% likelihood of experiencing issues. This is a statistical probability, not a deterministic outcome.

### Operational Behavior

**For Batched Notifications:**

When multiple notifications are queued for digest delivery:

1. **Priority Calculation**: Each notification's associated request is scored using priority service
2. **Relevance Ranking**: Notifications sorted by priority score (highest first)
3. **SLA Severity Secondary Sort**: Within same priority level, sorted by SLA severity (BREACHED > CRITICAL > WARNING)
4. **Temporal Tertiary Sort**: Finally sorted by creation timestamp (oldest first)

**Volume-Based Filtering:**

When digest contains more than 10 items:
- All CRITICAL and HIGH priority items included
- Top MEDIUM priority items included (up to threshold)
- LOW priority items automatically filtered out
- Ensures approvers focus on items requiring attention

**Noise Reduction**: Approximately 40% reduction in digest items through low-priority filtering

---

## Combined System Performance

### Notification Volume Reduction

| Scenario | Pending Requests | Without Filtering | With Filtering | Reduction |
|----------|------------------|-------------------|----------------|-----------|
| Normal Day | 10 | 10 emails | 3 emails (2 immediate + 1 digest) | 70% |
| Busy Day | 25 | 25 emails | 6 emails (5 immediate + 1 digest) | 76% |
| Very Busy Day | 50 | 50 emails | 9 emails (8 immediate + 1 digest) | 82% |

### Notification Delivery Format

**Immediate Alerts (Layer 1 Output):**

```
Subject: URGENT: Request COI-2026-032 - SLA Critical
Subject: URGENT: Request COI-2026-028 - SLA Breached
```

These notifications are delivered immediately upon detection, bypassing batching to ensure urgent items receive prompt attention.

**Digest Email (Layer 1 + Layer 2 Combined Output):**

```
Subject: COI System Digest - 10 notifications

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL PRIORITY (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SLA Warning: Request COI-2026-045
   Priority Score: 85/100 (CRITICAL)
   SLA Status: WARNING
   Top Factors: SLA Status: WARNING, External Deadline: Yes
   Request: COI-2026-045
   Client: ABC Corporation

2. SLA Warning: Request COI-2026-042
   Priority Score: 78/100 (CRITICAL)
   SLA Status: WARNING
   Top Factors: PIE Status: Yes, Service Type: Tax Advisory
   Request: COI-2026-042
   Client: XYZ Ltd

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HIGH PRIORITY (5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. SLA Warning: Request COI-2026-040
   Priority Score: 65/100 (HIGH)
   ...
```

**Digest Characteristics:**
- Grouped by priority level (CRITICAL, HIGH, MEDIUM)
- Sorted within groups by SLA severity and creation time
- Each item displays priority score and contributing factors
- Low-priority items filtered when volume exceeds threshold

---

## Machine Learning Model Development

### Data Collection Phase (Months 1-6)

During the initial rule-based operation period, the system collects comprehensive outcome data:

**Outcome Metrics Tracked:**
- SLA breach occurrences (via `sla_breach_log` table)
- Escalation frequency (via `escalation_count` field)
- Partner intervention events (via `partner_override` field)
- Client complaint incidents (via `complaint_logged` field)
- Request resolution patterns (via `status` field transitions)

**Feature Data Available:**
- SLA status (calculated dynamically)
- External deadline presence and proximity
- PIE client classification
- International operations flag
- Service type category
- Escalation count
- Workflow stage and duration

### Model Training Phase (Month 6)

After sufficient data collection (minimum 500 completed requests, minimum 50 with negative outcomes):

1. **Feature Extraction**: Historical requests analyzed to extract predictive features
2. **Outcome Labeling**: Each request labeled as "good outcome" or "bad outcome" based on:
   - SLA breach occurrence
   - Escalation requirement
   - Partner intervention
   - Client complaint
3. **Model Training**: Logistic regression model trained to learn optimal feature weights
4. **Validation**: Model accuracy validated against test dataset (target: ≥70% accuracy)
5. **Business Review**: Model weights reviewed by stakeholders for business reasonableness

### Model Activation (Month 7+)

Upon successful training and validation:

1. **Activation**: ML model weights stored in `ml_weights` table and marked as active
2. **Automatic Integration**: Priority service automatically uses ML weights instead of rule-based weights
3. **Fallback Mechanism**: System reverts to rule-based scoring if ML model unavailable or underperforming
4. **Continuous Monitoring**: Model performance tracked via `ml_predictions` table

### Model Improvement Cycle

- **Daily**: Prediction distribution monitoring
- **Weekly**: Accuracy report review
- **Monthly**: Model drift detection
- **Quarterly**: Model retraining with updated data

---

## Business Benefits

### For Approvers

- **Reduced Email Volume**: 70-82% fewer notifications to process
- **Immediate Urgency Visibility**: Critical items delivered instantly, bypassing batching
- **Intelligent Prioritization**: System guides attention to high-risk items
- **Transparency**: Priority scores and contributing factors visible for decision support
- **Reduced Cognitive Load**: Automated sorting eliminates manual prioritization effort

### For the Organization

- **Improved Compliance**: Urgent items receive immediate attention, reducing SLA breach risk
- **Optimized Resource Allocation**: Approvers focus on high-risk items first
- **Data-Driven Decision Making**: ML model learns from actual outcomes, not assumptions
- **Scalable Operations**: System handles increasing volume without proportional notification growth
- **Continuous Improvement**: ML model adapts to changing patterns over time

---

## Data Governance and Compliance

### Data Collection

- **Purpose**: ML model training for priority prediction
- **Retention**: Historical data retained for model retraining and audit
- **Access Control**: Outcome data accessible only to authorized administrators
- **Privacy**: No personally identifiable information used in ML features

### Model Governance

- **Transparency**: All model weights and predictions logged for audit
- **Explainability**: Priority scores include breakdown of contributing factors
- **Fallback**: Automatic reversion to rule-based scoring if ML model fails
- **Review Process**: Model activation requires stakeholder approval

### Compliance Considerations

- **Audit Trail**: All priority calculations and predictions logged
- **Explainability**: System can explain why each request received its priority score
- **Human Oversight**: Approvers retain full decision authority; system provides guidance only
- **Bias Mitigation**: Model training includes validation for fairness across client types and service categories

---

## Technical Implementation Summary

**Layer 1 (SLA Filter):**
- **Evaluation**: Real-time SLA status calculation using `calculateSLAStatus()`
- **Classification**: BREACHED/CRITICAL → immediate delivery; WARNING → batched
- **Data Source**: `stage_entered_at`, `sla_config` table, business calendar

**Layer 2 (Priority Filter):**
- **Current**: Rule-based scoring using `calculatePriority()` from `priorityService.js`
- **Future**: ML-enhanced scoring using learned weights from `ml_weights` table
- **Data Source**: Request fields (PIE status, service type, escalation count, etc.)

**Integration:**
- Both layers operate independently; Layer 2 processes only batched notifications from Layer 1
- Priority calculation uses same `calculatePriority()` function regardless of rule-based or ML mode
- Seamless transition from rule-based to ML when model activated

---

## System Status

**Current Implementation:**
- ✅ Layer 1 (SLA Filter): Active and operational
- ✅ Layer 2 (Priority Filter): Active with rule-based scoring
- ⏳ ML Model: Awaiting 6 months of operational data for training

**Activation Timeline:**
- **Months 1-6**: Rule-based operation with data collection
- **Month 6**: ML model training and validation
- **Month 7+**: ML model activation (pending validation and approval)

---

*Document Version: 2.0*  
*Last Updated: January 2026*  
*Classification: Internal Use*
