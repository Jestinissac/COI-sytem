# Configuration Analysis: Hardcoded vs Dynamic Values

## Overview
This document analyzes what is currently hardcoded in the COI system versus what is configurable, and provides recommendations for making the system more flexible to handle template format changes and approval workflow modifications.

---

## 1. CURRENT STATE: Hardcoded Values

### 1.1 Workflow Status Values (HARDCODED)

**Location**: `database/schema.sql`, `frontend/src/views/COIRequestDetail.vue`, `backend/src/controllers/coiController.js`

**Hardcoded Statuses**:
```sql
-- Database CHECK constraint
status IN ('Draft', 'Pending Director Approval', 'Pending Compliance', 
           'Pending Partner', 'Pending Finance', 'Approved', 'Rejected', 
           'Lapsed', 'Active')
```

**Frontend Hardcoded**:
```javascript
// COIRequestDetail.vue
const workflowSteps = computed(() => {
  return [
    { name: 'Draft', index: 1, ... },
    { name: 'Director', index: 2, ... },
    { name: 'Compliance', index: 3, ... },
    { name: 'Partner', index: 4, ... },
    { name: 'Finance', index: 5, ... },
    { name: 'Active', index: 6, ... }
  ]
})
```

**Impact**: 
- ❌ Cannot add new workflow steps without code changes
- ❌ Cannot change step order without code changes
- ❌ Cannot skip steps conditionally
- ❌ Database migration required for status changes

---

### 1.2 Approval Status Values (HARDCODED)

**Location**: `database/schema.sql`

**Hardcoded**:
```sql
director_approval_status IN ('Pending', 'Approved', 'Approved with Restrictions', 
                             'Need More Info', 'Rejected')
compliance_review_status IN ('Pending', 'Approved', 'Approved with Restrictions', 
                             'Need More Info', 'Rejected')
partner_approval_status IN ('Pending', 'Approved', 'Approved with Restrictions', 
                            'Need More Info', 'Rejected')
```

**Impact**:
- ❌ Cannot add new approval types without schema changes
- ❌ Cannot customize approval options per role

---

### 1.3 Form Fields / Template Structure (HARDCODED)

**Location**: `frontend/src/views/COIRequestForm.vue`, `database/schema.sql`

**Hardcoded Sections**:
```javascript
const sections = [
  { id: 'section-1', number: 1, label: 'Requestor Info' },
  { id: 'section-2', number: 2, label: 'Document Type' },
  { id: 'section-3', number: 3, label: 'Client Details' },
  { id: 'section-4', number: 4, label: 'Service Info' },
  { id: 'section-5', number: 5, label: 'Ownership' },
  { id: 'section-6', number: 6, label: 'Signatories' },
  { id: 'section-7', number: 7, label: 'International' }
]
```

**Hardcoded Database Columns**:
```sql
-- All columns are fixed in schema
requestor_name VARCHAR(255),
designation VARCHAR(50),
entity VARCHAR(100),
line_of_service VARCHAR(100),
requested_document VARCHAR(50),
language VARCHAR(50),
-- ... 30+ more columns
```

**Impact**:
- ❌ Cannot add new form fields without database migration
- ❌ Cannot reorder sections without code changes
- ❌ Cannot make fields conditional without code changes
- ❌ Cannot change field labels without code changes

---

### 1.4 Service Type Conflict Matrix (HARDCODED)

**Location**: `backend/src/services/duplicationCheckService.js`

**Hardcoded**:
```javascript
const SERVICE_CATEGORIES = {
  AUDIT: ['Statutory Audit', 'External Audit', 'Group Audit', 'IFRS Audit'],
  INTERNAL_AUDIT: ['Internal Audit', 'Internal Controls Review'],
  ADVISORY: ['Management Consulting', 'Business Advisory', ...],
  // ...
}

const CONFLICT_MATRIX = {
  AUDIT: {
    blocked: ['ADVISORY', 'ACCOUNTING', 'VALUATION', 'INTERNAL_AUDIT'],
    flagged: ['TAX', 'DUE_DILIGENCE', 'IT_ADVISORY'],
    // ...
  }
}
```

**Impact**:
- ❌ Cannot add new service types without code changes
- ❌ Cannot modify conflict rules without code changes
- ❌ Cannot customize rules per client type

---

### 1.5 Role-Based Permissions (HARDCODED)

**Location**: `frontend/src/views/COIRequestDetail.vue`, `backend/src/controllers/coiController.js`

**Hardcoded**:
```javascript
const canApprove = computed(() => {
  if (role === 'Director' && status === 'Pending Director Approval') return true
  if (role === 'Compliance' && status === 'Pending Compliance') return true
  if (role === 'Partner' && status === 'Pending Partner') return true
  if (role === 'Finance' && status === 'Pending Finance') return true
  // ...
})
```

**Impact**:
- ❌ Cannot change who can approve what without code changes
- ❌ Cannot add new roles without code changes

---

### 1.6 Monitoring Intervals (HARDCODED)

**Location**: `backend/src/services/monitoringService.js`

**Hardcoded**:
```javascript
// 10-day, 20-day, 30-day intervals
const ALERT_INTERVALS = [10, 20, 30] // days
const RENEWAL_ALERTS = [90, 60, 30] // days before renewal
```

**Impact**:
- ❌ Cannot change alert intervals without code changes
- ❌ Cannot customize intervals per request type

---

### 1.7 Field Validation Rules (HARDCODED)

**Location**: `frontend/src/views/COIRequestForm.vue`

**Hardcoded**:
```javascript
function isSectionComplete(sectionId: string): boolean {
  switch (sectionId) {
    case 'section-1':
      return !!(formData.value.designation && formData.value.entity)
    case 'section-3':
      return !!(formData.value.client_id)
    // ...
  }
}
```

**Impact**:
- ❌ Cannot change required fields without code changes
- ❌ Cannot add conditional validation without code changes

---

## 2. CURRENT STATE: Dynamic/Configurable Values

### 2.1 User Roles (CONFIGURABLE)

**Location**: `database/schema.sql` (users table)

**Dynamic**:
- Roles stored in database
- Can add new roles via Super Admin UI
- Role assignment per user

**Limitation**: Role permissions are still hardcoded in code

---

### 2.2 Clients (DYNAMIC)

**Location**: `database/clients` table, PRMS integration

**Dynamic**:
- Clients loaded from database/PRMS
- Can add new clients
- Client data can be updated

---

### 2.3 Service Types (PARTIALLY DYNAMIC)

**Location**: Form dropdowns

**Dynamic**:
- Service types shown in dropdown (from database or hardcoded list)

**Hardcoded**:
- Conflict matrix rules
- Service categories

---

### 2.4 Department/Line of Service (DYNAMIC)

**Location**: User profile, form fields

**Dynamic**:
- Departments stored in database
- Can be updated per user

---

## 3. RECOMMENDED SOLUTION: Configuration Tables

To make the system flexible for template and workflow changes, implement configuration tables:

### 3.1 Workflow Configuration Table

```sql
CREATE TABLE workflow_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_status VARCHAR(100) NOT NULL, -- e.g., 'Pending Director Approval'
    required_role VARCHAR(50), -- Who can approve at this step
    is_required BOOLEAN DEFAULT 1, -- Can this step be skipped?
    conditions TEXT, -- JSON: when to show this step
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_name, step_order)
);

-- Example data
INSERT INTO workflow_config (workflow_name, step_order, step_name, step_status, required_role) VALUES
('default', 1, 'Draft', 'Draft', NULL),
('default', 2, 'Director', 'Pending Director Approval', 'Director'),
('default', 3, 'Compliance', 'Pending Compliance', 'Compliance'),
('default', 4, 'Partner', 'Pending Partner', 'Partner'),
('default', 5, 'Finance', 'Pending Finance', 'Finance'),
('default', 6, 'Active', 'Active', NULL);
```

**Benefits**:
- ✅ Add/remove workflow steps via admin UI
- ✅ Reorder steps without code changes
- ✅ Skip steps conditionally
- ✅ Multiple workflow types (e.g., 'fast-track', 'standard')

---

### 3.2 Form Template Configuration Table

```sql
CREATE TABLE form_template_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name VARCHAR(100) NOT NULL,
    section_order INTEGER NOT NULL,
    section_id VARCHAR(50) NOT NULL,
    section_label VARCHAR(255) NOT NULL,
    fields TEXT NOT NULL, -- JSON array of field definitions
    is_required BOOLEAN DEFAULT 1,
    conditions TEXT, -- JSON: when to show this section
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_name, section_order)
);

-- Example field definition JSON
{
  "fields": [
    {
      "id": "requestor_name",
      "label": "Requestor Name",
      "type": "text",
      "required": true,
      "readonly": true,
      "source": "user.name"
    },
    {
      "id": "designation",
      "label": "Designation",
      "type": "select",
      "required": true,
      "options": ["Director", "Partner", "Manager", "Senior Manager"]
    }
  ]
}
```

**Benefits**:
- ✅ Add/remove form fields via admin UI
- ✅ Change field labels without code changes
- ✅ Reorder sections
- ✅ Make fields conditional
- ✅ Multiple template versions

---

### 3.3 Approval Options Configuration

```sql
CREATE TABLE approval_options_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role VARCHAR(50) NOT NULL,
    option_value VARCHAR(100) NOT NULL, -- e.g., 'Approved', 'Approved with Restrictions'
    option_label VARCHAR(255) NOT NULL,
    requires_comment BOOLEAN DEFAULT 0,
    requires_restrictions BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO approval_options_config (role, option_value, option_label, requires_comment, requires_restrictions) VALUES
('Director', 'Approved', 'Approve', 0, 0),
('Director', 'Approved with Restrictions', 'Approve with Restrictions', 1, 1),
('Director', 'Need More Info', 'Need More Information', 1, 0),
('Director', 'Rejected', 'Reject', 1, 0);
```

**Benefits**:
- ✅ Add new approval options per role
- ✅ Change option labels
- ✅ Enable/disable options
- ✅ Customize per role

---

### 3.4 Service Type Conflict Configuration

```sql
CREATE TABLE service_conflict_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_category VARCHAR(100) NOT NULL,
    conflicting_category VARCHAR(100) NOT NULL,
    conflict_type VARCHAR(50) NOT NULL, -- 'blocked', 'flagged', 'warning'
    severity VARCHAR(50) NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM'
    reason TEXT,
    applies_to_pie BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO service_conflict_config (service_category, conflicting_category, conflict_type, severity, reason) VALUES
('AUDIT', 'ADVISORY', 'blocked', 'CRITICAL', 'Management consulting threatens auditor independence'),
('AUDIT', 'TAX', 'flagged', 'HIGH', 'Tax services for audit client require fee cap review');
```

**Benefits**:
- ✅ Add new service types via admin
- ✅ Modify conflict rules without code
- ✅ Customize rules per client type (PIE)

---

### 3.5 Field Validation Configuration

```sql
CREATE TABLE field_validation_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name VARCHAR(100) NOT NULL,
    field_id VARCHAR(100) NOT NULL,
    validation_type VARCHAR(50) NOT NULL, -- 'required', 'min_length', 'max_length', 'pattern', 'conditional'
    validation_value TEXT, -- JSON: validation parameters
    error_message VARCHAR(255),
    conditions TEXT, -- JSON: when this validation applies
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO field_validation_config (template_name, field_id, validation_type, validation_value, error_message) VALUES
('default', 'designation', 'required', '{}', 'Designation is required'),
('default', 'client_id', 'required', '{}', 'Client selection is required'),
('default', 'parent_company', 'required', '{"condition": "international_operations = true OR pie_status = Yes"}', 'Parent company required for international/PIE clients');
```

**Benefits**:
- ✅ Change required fields via admin
- ✅ Add conditional validation
- ✅ Customize error messages

---

### 3.6 Monitoring Configuration

```sql
CREATE TABLE monitoring_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_name VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'proposal_expiry', 'renewal_reminder'
    interval_days INTEGER NOT NULL,
    recipients TEXT, -- JSON array of roles/emails
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO monitoring_config (config_name, alert_type, interval_days, recipients) VALUES
('proposal_10_day', 'proposal_expiry', 10, '["Requester", "Admin", "Partner"]'),
('proposal_20_day', 'proposal_expiry', 20, '["Requester", "Admin", "Partner"]'),
('proposal_30_day', 'proposal_expiry', 30, '["Requester", "Admin", "Partner"]'),
('renewal_90_day', 'renewal_reminder', 90, '["Admin"]'),
('renewal_60_day', 'renewal_reminder', 60, '["Admin"]'),
('renewal_30_day', 'renewal_reminder', 30, '["Admin"]');
```

**Benefits**:
- ✅ Change alert intervals without code
- ✅ Add new alert types
- ✅ Customize recipients per alert

---

## 4. IMPLEMENTATION APPROACH

### Phase 1: Add Configuration Tables (Non-Breaking)

1. Create new configuration tables
2. Populate with current hardcoded values
3. Keep existing code working (backward compatible)

### Phase 2: Create Admin UI for Configuration

1. **Workflow Management UI**
   - Add/edit/delete workflow steps
   - Reorder steps
   - Set conditions

2. **Form Template Management UI**
   - Add/edit/delete sections
   - Add/edit/delete fields
   - Set field properties (type, required, readonly)
   - Set validation rules

3. **Approval Options Management UI**
   - Configure approval options per role
   - Enable/disable options

4. **Service Conflict Management UI**
   - Add/edit service types
   - Configure conflict rules

5. **Monitoring Configuration UI**
   - Set alert intervals
   - Configure recipients

### Phase 3: Refactor Code to Use Configuration

1. Update backend to read from configuration tables
2. Update frontend to render forms dynamically
3. Update workflow logic to use configuration
4. Remove hardcoded values

### Phase 4: Dynamic Form Rendering

1. Create generic form renderer component
2. Load form structure from configuration
3. Apply validation rules from configuration
4. Handle conditional fields

---

## 5. CODE CHANGES REQUIRED

### 5.1 Backend Changes

**Current** (Hardcoded):
```javascript
// coiController.js
let newStatus = 'Pending Compliance'
if (user.role === 'Requester' && user.director_id) {
  newStatus = 'Pending Director Approval'
}
```

**New** (Configuration-based):
```javascript
// coiController.js
import { getWorkflowConfig } from '../services/workflowService.js'

async function getNextStatus(currentStatus, user) {
  const workflow = await getWorkflowConfig('default')
  const currentStep = workflow.find(s => s.step_status === currentStatus)
  const nextStep = workflow.find(s => s.step_order === currentStep.step_order + 1)
  
  // Check conditions
  if (nextStep.conditions) {
    const conditions = JSON.parse(nextStep.conditions)
    if (conditions.skip_if_team_member && user.role === 'Requester' && user.director_id) {
      // Skip to next step
      return getNextStatus(nextStep.step_status, user)
    }
  }
  
  return nextStep.step_status
}
```

### 5.2 Frontend Changes

**Current** (Hardcoded):
```vue
<!-- COIRequestForm.vue -->
<section id="section-1">
  <input v-model="formData.requestor_name" />
  <input v-model="formData.designation" />
</section>
```

**New** (Dynamic):
```vue
<!-- COIRequestForm.vue -->
<template v-for="section in formTemplate" :key="section.id">
  <section :id="section.section_id">
    <DynamicFormField
      v-for="field in section.fields"
      :key="field.id"
      :field="field"
      v-model="formData[field.id]"
    />
  </section>
</template>
```

---

## 6. MIGRATION STRATEGY

### Option A: Big Bang (Not Recommended)
- Replace all hardcoded values at once
- High risk, requires extensive testing

### Option B: Gradual Migration (Recommended)
1. **Week 1-2**: Add configuration tables, populate with current values
2. **Week 3-4**: Create admin UI for configuration
3. **Week 5-6**: Refactor one module at a time (workflow → form → validation)
4. **Week 7-8**: Testing and refinement

### Option C: Hybrid Approach
- Keep critical paths hardcoded (for stability)
- Make non-critical features configurable
- Gradually migrate critical paths

---

## 7. BENEFITS OF CONFIGURATION-BASED APPROACH

### For Template Changes
- ✅ Add new fields without code deployment
- ✅ Change field labels/placeholders
- ✅ Reorder sections
- ✅ Make fields conditional
- ✅ Change validation rules
- ✅ A/B test different templates

### For Workflow Changes
- ✅ Add/remove approval steps
- ✅ Change step order
- ✅ Skip steps conditionally
- ✅ Add parallel approval paths
- ✅ Create workflow variants (fast-track, standard)

### For Business Rules
- ✅ Modify service conflict rules
- ✅ Change monitoring intervals
- ✅ Update approval options
- ✅ Customize per client type

### For Compliance
- ✅ Adapt to regulatory changes
- ✅ Support multiple jurisdictions
- ✅ Version control configurations
- ✅ Audit trail of changes

---

## 8. CURRENT LIMITATIONS & WORKAROUNDS

### Until Configuration System is Implemented

**Template Changes**:
- ❌ Requires code changes and deployment
- ⚠️ Workaround: Use generic JSON field to store additional data

**Workflow Changes**:
- ❌ Requires database migration and code changes
- ⚠️ Workaround: Use status field more generically, handle in code

**Approval Options**:
- ❌ Limited to hardcoded options
- ⚠️ Workaround: Use notes/comments field for custom approvals

---

## 9. RECOMMENDED PRIORITY

### High Priority (Implement First)
1. ✅ Workflow Configuration (most requested change)
2. ✅ Approval Options Configuration
3. ✅ Monitoring Configuration

### Medium Priority
4. ✅ Form Template Configuration
5. ✅ Field Validation Configuration

### Low Priority
6. ✅ Service Conflict Configuration (changes less frequently)

---

## 10. EXAMPLE: Adding a New Workflow Step

### Current Process (Hardcoded)
1. Update database schema (add new status)
2. Update backend code (add status handling)
3. Update frontend code (add UI for new step)
4. Deploy and test
5. **Time**: 2-3 days

### With Configuration System
1. Admin logs into system
2. Navigates to "Workflow Configuration"
3. Clicks "Add Step"
4. Enters step details (name, order, role)
5. Saves
6. **Time**: 5 minutes

---

## Summary

**Current State**: ~80% hardcoded, ~20% configurable
**Target State**: ~20% hardcoded (core logic), ~80% configurable

**Key Hardcoded Areas**:
- Workflow steps and statuses
- Form template structure
- Approval options
- Service conflict rules
- Validation rules
- Monitoring intervals

**Recommended Solution**: Configuration tables + Admin UI for dynamic management

**Migration Effort**: 6-8 weeks for full implementation

**ROI**: High - enables business users to adapt system without developer intervention


## Overview
This document analyzes what is currently hardcoded in the COI system versus what is configurable, and provides recommendations for making the system more flexible to handle template format changes and approval workflow modifications.

---

## 1. CURRENT STATE: Hardcoded Values

### 1.1 Workflow Status Values (HARDCODED)

**Location**: `database/schema.sql`, `frontend/src/views/COIRequestDetail.vue`, `backend/src/controllers/coiController.js`

**Hardcoded Statuses**:
```sql
-- Database CHECK constraint
status IN ('Draft', 'Pending Director Approval', 'Pending Compliance', 
           'Pending Partner', 'Pending Finance', 'Approved', 'Rejected', 
           'Lapsed', 'Active')
```

**Frontend Hardcoded**:
```javascript
// COIRequestDetail.vue
const workflowSteps = computed(() => {
  return [
    { name: 'Draft', index: 1, ... },
    { name: 'Director', index: 2, ... },
    { name: 'Compliance', index: 3, ... },
    { name: 'Partner', index: 4, ... },
    { name: 'Finance', index: 5, ... },
    { name: 'Active', index: 6, ... }
  ]
})
```

**Impact**: 
- ❌ Cannot add new workflow steps without code changes
- ❌ Cannot change step order without code changes
- ❌ Cannot skip steps conditionally
- ❌ Database migration required for status changes

---

### 1.2 Approval Status Values (HARDCODED)

**Location**: `database/schema.sql`

**Hardcoded**:
```sql
director_approval_status IN ('Pending', 'Approved', 'Approved with Restrictions', 
                             'Need More Info', 'Rejected')
compliance_review_status IN ('Pending', 'Approved', 'Approved with Restrictions', 
                             'Need More Info', 'Rejected')
partner_approval_status IN ('Pending', 'Approved', 'Approved with Restrictions', 
                            'Need More Info', 'Rejected')
```

**Impact**:
- ❌ Cannot add new approval types without schema changes
- ❌ Cannot customize approval options per role

---

### 1.3 Form Fields / Template Structure (HARDCODED)

**Location**: `frontend/src/views/COIRequestForm.vue`, `database/schema.sql`

**Hardcoded Sections**:
```javascript
const sections = [
  { id: 'section-1', number: 1, label: 'Requestor Info' },
  { id: 'section-2', number: 2, label: 'Document Type' },
  { id: 'section-3', number: 3, label: 'Client Details' },
  { id: 'section-4', number: 4, label: 'Service Info' },
  { id: 'section-5', number: 5, label: 'Ownership' },
  { id: 'section-6', number: 6, label: 'Signatories' },
  { id: 'section-7', number: 7, label: 'International' }
]
```

**Hardcoded Database Columns**:
```sql
-- All columns are fixed in schema
requestor_name VARCHAR(255),
designation VARCHAR(50),
entity VARCHAR(100),
line_of_service VARCHAR(100),
requested_document VARCHAR(50),
language VARCHAR(50),
-- ... 30+ more columns
```

**Impact**:
- ❌ Cannot add new form fields without database migration
- ❌ Cannot reorder sections without code changes
- ❌ Cannot make fields conditional without code changes
- ❌ Cannot change field labels without code changes

---

### 1.4 Service Type Conflict Matrix (HARDCODED)

**Location**: `backend/src/services/duplicationCheckService.js`

**Hardcoded**:
```javascript
const SERVICE_CATEGORIES = {
  AUDIT: ['Statutory Audit', 'External Audit', 'Group Audit', 'IFRS Audit'],
  INTERNAL_AUDIT: ['Internal Audit', 'Internal Controls Review'],
  ADVISORY: ['Management Consulting', 'Business Advisory', ...],
  // ...
}

const CONFLICT_MATRIX = {
  AUDIT: {
    blocked: ['ADVISORY', 'ACCOUNTING', 'VALUATION', 'INTERNAL_AUDIT'],
    flagged: ['TAX', 'DUE_DILIGENCE', 'IT_ADVISORY'],
    // ...
  }
}
```

**Impact**:
- ❌ Cannot add new service types without code changes
- ❌ Cannot modify conflict rules without code changes
- ❌ Cannot customize rules per client type

---

### 1.5 Role-Based Permissions (HARDCODED)

**Location**: `frontend/src/views/COIRequestDetail.vue`, `backend/src/controllers/coiController.js`

**Hardcoded**:
```javascript
const canApprove = computed(() => {
  if (role === 'Director' && status === 'Pending Director Approval') return true
  if (role === 'Compliance' && status === 'Pending Compliance') return true
  if (role === 'Partner' && status === 'Pending Partner') return true
  if (role === 'Finance' && status === 'Pending Finance') return true
  // ...
})
```

**Impact**:
- ❌ Cannot change who can approve what without code changes
- ❌ Cannot add new roles without code changes

---

### 1.6 Monitoring Intervals (HARDCODED)

**Location**: `backend/src/services/monitoringService.js`

**Hardcoded**:
```javascript
// 10-day, 20-day, 30-day intervals
const ALERT_INTERVALS = [10, 20, 30] // days
const RENEWAL_ALERTS = [90, 60, 30] // days before renewal
```

**Impact**:
- ❌ Cannot change alert intervals without code changes
- ❌ Cannot customize intervals per request type

---

### 1.7 Field Validation Rules (HARDCODED)

**Location**: `frontend/src/views/COIRequestForm.vue`

**Hardcoded**:
```javascript
function isSectionComplete(sectionId: string): boolean {
  switch (sectionId) {
    case 'section-1':
      return !!(formData.value.designation && formData.value.entity)
    case 'section-3':
      return !!(formData.value.client_id)
    // ...
  }
}
```

**Impact**:
- ❌ Cannot change required fields without code changes
- ❌ Cannot add conditional validation without code changes

---

## 2. CURRENT STATE: Dynamic/Configurable Values

### 2.1 User Roles (CONFIGURABLE)

**Location**: `database/schema.sql` (users table)

**Dynamic**:
- Roles stored in database
- Can add new roles via Super Admin UI
- Role assignment per user

**Limitation**: Role permissions are still hardcoded in code

---

### 2.2 Clients (DYNAMIC)

**Location**: `database/clients` table, PRMS integration

**Dynamic**:
- Clients loaded from database/PRMS
- Can add new clients
- Client data can be updated

---

### 2.3 Service Types (PARTIALLY DYNAMIC)

**Location**: Form dropdowns

**Dynamic**:
- Service types shown in dropdown (from database or hardcoded list)

**Hardcoded**:
- Conflict matrix rules
- Service categories

---

### 2.4 Department/Line of Service (DYNAMIC)

**Location**: User profile, form fields

**Dynamic**:
- Departments stored in database
- Can be updated per user

---

## 3. RECOMMENDED SOLUTION: Configuration Tables

To make the system flexible for template and workflow changes, implement configuration tables:

### 3.1 Workflow Configuration Table

```sql
CREATE TABLE workflow_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_status VARCHAR(100) NOT NULL, -- e.g., 'Pending Director Approval'
    required_role VARCHAR(50), -- Who can approve at this step
    is_required BOOLEAN DEFAULT 1, -- Can this step be skipped?
    conditions TEXT, -- JSON: when to show this step
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_name, step_order)
);

-- Example data
INSERT INTO workflow_config (workflow_name, step_order, step_name, step_status, required_role) VALUES
('default', 1, 'Draft', 'Draft', NULL),
('default', 2, 'Director', 'Pending Director Approval', 'Director'),
('default', 3, 'Compliance', 'Pending Compliance', 'Compliance'),
('default', 4, 'Partner', 'Pending Partner', 'Partner'),
('default', 5, 'Finance', 'Pending Finance', 'Finance'),
('default', 6, 'Active', 'Active', NULL);
```

**Benefits**:
- ✅ Add/remove workflow steps via admin UI
- ✅ Reorder steps without code changes
- ✅ Skip steps conditionally
- ✅ Multiple workflow types (e.g., 'fast-track', 'standard')

---

### 3.2 Form Template Configuration Table

```sql
CREATE TABLE form_template_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name VARCHAR(100) NOT NULL,
    section_order INTEGER NOT NULL,
    section_id VARCHAR(50) NOT NULL,
    section_label VARCHAR(255) NOT NULL,
    fields TEXT NOT NULL, -- JSON array of field definitions
    is_required BOOLEAN DEFAULT 1,
    conditions TEXT, -- JSON: when to show this section
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_name, section_order)
);

-- Example field definition JSON
{
  "fields": [
    {
      "id": "requestor_name",
      "label": "Requestor Name",
      "type": "text",
      "required": true,
      "readonly": true,
      "source": "user.name"
    },
    {
      "id": "designation",
      "label": "Designation",
      "type": "select",
      "required": true,
      "options": ["Director", "Partner", "Manager", "Senior Manager"]
    }
  ]
}
```

**Benefits**:
- ✅ Add/remove form fields via admin UI
- ✅ Change field labels without code changes
- ✅ Reorder sections
- ✅ Make fields conditional
- ✅ Multiple template versions

---

### 3.3 Approval Options Configuration

```sql
CREATE TABLE approval_options_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role VARCHAR(50) NOT NULL,
    option_value VARCHAR(100) NOT NULL, -- e.g., 'Approved', 'Approved with Restrictions'
    option_label VARCHAR(255) NOT NULL,
    requires_comment BOOLEAN DEFAULT 0,
    requires_restrictions BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO approval_options_config (role, option_value, option_label, requires_comment, requires_restrictions) VALUES
('Director', 'Approved', 'Approve', 0, 0),
('Director', 'Approved with Restrictions', 'Approve with Restrictions', 1, 1),
('Director', 'Need More Info', 'Need More Information', 1, 0),
('Director', 'Rejected', 'Reject', 1, 0);
```

**Benefits**:
- ✅ Add new approval options per role
- ✅ Change option labels
- ✅ Enable/disable options
- ✅ Customize per role

---

### 3.4 Service Type Conflict Configuration

```sql
CREATE TABLE service_conflict_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_category VARCHAR(100) NOT NULL,
    conflicting_category VARCHAR(100) NOT NULL,
    conflict_type VARCHAR(50) NOT NULL, -- 'blocked', 'flagged', 'warning'
    severity VARCHAR(50) NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM'
    reason TEXT,
    applies_to_pie BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO service_conflict_config (service_category, conflicting_category, conflict_type, severity, reason) VALUES
('AUDIT', 'ADVISORY', 'blocked', 'CRITICAL', 'Management consulting threatens auditor independence'),
('AUDIT', 'TAX', 'flagged', 'HIGH', 'Tax services for audit client require fee cap review');
```

**Benefits**:
- ✅ Add new service types via admin
- ✅ Modify conflict rules without code
- ✅ Customize rules per client type (PIE)

---

### 3.5 Field Validation Configuration

```sql
CREATE TABLE field_validation_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name VARCHAR(100) NOT NULL,
    field_id VARCHAR(100) NOT NULL,
    validation_type VARCHAR(50) NOT NULL, -- 'required', 'min_length', 'max_length', 'pattern', 'conditional'
    validation_value TEXT, -- JSON: validation parameters
    error_message VARCHAR(255),
    conditions TEXT, -- JSON: when this validation applies
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO field_validation_config (template_name, field_id, validation_type, validation_value, error_message) VALUES
('default', 'designation', 'required', '{}', 'Designation is required'),
('default', 'client_id', 'required', '{}', 'Client selection is required'),
('default', 'parent_company', 'required', '{"condition": "international_operations = true OR pie_status = Yes"}', 'Parent company required for international/PIE clients');
```

**Benefits**:
- ✅ Change required fields via admin
- ✅ Add conditional validation
- ✅ Customize error messages

---

### 3.6 Monitoring Configuration

```sql
CREATE TABLE monitoring_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_name VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'proposal_expiry', 'renewal_reminder'
    interval_days INTEGER NOT NULL,
    recipients TEXT, -- JSON array of roles/emails
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO monitoring_config (config_name, alert_type, interval_days, recipients) VALUES
('proposal_10_day', 'proposal_expiry', 10, '["Requester", "Admin", "Partner"]'),
('proposal_20_day', 'proposal_expiry', 20, '["Requester", "Admin", "Partner"]'),
('proposal_30_day', 'proposal_expiry', 30, '["Requester", "Admin", "Partner"]'),
('renewal_90_day', 'renewal_reminder', 90, '["Admin"]'),
('renewal_60_day', 'renewal_reminder', 60, '["Admin"]'),
('renewal_30_day', 'renewal_reminder', 30, '["Admin"]');
```

**Benefits**:
- ✅ Change alert intervals without code
- ✅ Add new alert types
- ✅ Customize recipients per alert

---

## 4. IMPLEMENTATION APPROACH

### Phase 1: Add Configuration Tables (Non-Breaking)

1. Create new configuration tables
2. Populate with current hardcoded values
3. Keep existing code working (backward compatible)

### Phase 2: Create Admin UI for Configuration

1. **Workflow Management UI**
   - Add/edit/delete workflow steps
   - Reorder steps
   - Set conditions

2. **Form Template Management UI**
   - Add/edit/delete sections
   - Add/edit/delete fields
   - Set field properties (type, required, readonly)
   - Set validation rules

3. **Approval Options Management UI**
   - Configure approval options per role
   - Enable/disable options

4. **Service Conflict Management UI**
   - Add/edit service types
   - Configure conflict rules

5. **Monitoring Configuration UI**
   - Set alert intervals
   - Configure recipients

### Phase 3: Refactor Code to Use Configuration

1. Update backend to read from configuration tables
2. Update frontend to render forms dynamically
3. Update workflow logic to use configuration
4. Remove hardcoded values

### Phase 4: Dynamic Form Rendering

1. Create generic form renderer component
2. Load form structure from configuration
3. Apply validation rules from configuration
4. Handle conditional fields

---

## 5. CODE CHANGES REQUIRED

### 5.1 Backend Changes

**Current** (Hardcoded):
```javascript
// coiController.js
let newStatus = 'Pending Compliance'
if (user.role === 'Requester' && user.director_id) {
  newStatus = 'Pending Director Approval'
}
```

**New** (Configuration-based):
```javascript
// coiController.js
import { getWorkflowConfig } from '../services/workflowService.js'

async function getNextStatus(currentStatus, user) {
  const workflow = await getWorkflowConfig('default')
  const currentStep = workflow.find(s => s.step_status === currentStatus)
  const nextStep = workflow.find(s => s.step_order === currentStep.step_order + 1)
  
  // Check conditions
  if (nextStep.conditions) {
    const conditions = JSON.parse(nextStep.conditions)
    if (conditions.skip_if_team_member && user.role === 'Requester' && user.director_id) {
      // Skip to next step
      return getNextStatus(nextStep.step_status, user)
    }
  }
  
  return nextStep.step_status
}
```

### 5.2 Frontend Changes

**Current** (Hardcoded):
```vue
<!-- COIRequestForm.vue -->
<section id="section-1">
  <input v-model="formData.requestor_name" />
  <input v-model="formData.designation" />
</section>
```

**New** (Dynamic):
```vue
<!-- COIRequestForm.vue -->
<template v-for="section in formTemplate" :key="section.id">
  <section :id="section.section_id">
    <DynamicFormField
      v-for="field in section.fields"
      :key="field.id"
      :field="field"
      v-model="formData[field.id]"
    />
  </section>
</template>
```

---

## 6. MIGRATION STRATEGY

### Option A: Big Bang (Not Recommended)
- Replace all hardcoded values at once
- High risk, requires extensive testing

### Option B: Gradual Migration (Recommended)
1. **Week 1-2**: Add configuration tables, populate with current values
2. **Week 3-4**: Create admin UI for configuration
3. **Week 5-6**: Refactor one module at a time (workflow → form → validation)
4. **Week 7-8**: Testing and refinement

### Option C: Hybrid Approach
- Keep critical paths hardcoded (for stability)
- Make non-critical features configurable
- Gradually migrate critical paths

---

## 7. BENEFITS OF CONFIGURATION-BASED APPROACH

### For Template Changes
- ✅ Add new fields without code deployment
- ✅ Change field labels/placeholders
- ✅ Reorder sections
- ✅ Make fields conditional
- ✅ Change validation rules
- ✅ A/B test different templates

### For Workflow Changes
- ✅ Add/remove approval steps
- ✅ Change step order
- ✅ Skip steps conditionally
- ✅ Add parallel approval paths
- ✅ Create workflow variants (fast-track, standard)

### For Business Rules
- ✅ Modify service conflict rules
- ✅ Change monitoring intervals
- ✅ Update approval options
- ✅ Customize per client type

### For Compliance
- ✅ Adapt to regulatory changes
- ✅ Support multiple jurisdictions
- ✅ Version control configurations
- ✅ Audit trail of changes

---

## 8. CURRENT LIMITATIONS & WORKAROUNDS

### Until Configuration System is Implemented

**Template Changes**:
- ❌ Requires code changes and deployment
- ⚠️ Workaround: Use generic JSON field to store additional data

**Workflow Changes**:
- ❌ Requires database migration and code changes
- ⚠️ Workaround: Use status field more generically, handle in code

**Approval Options**:
- ❌ Limited to hardcoded options
- ⚠️ Workaround: Use notes/comments field for custom approvals

---

## 9. RECOMMENDED PRIORITY

### High Priority (Implement First)
1. ✅ Workflow Configuration (most requested change)
2. ✅ Approval Options Configuration
3. ✅ Monitoring Configuration

### Medium Priority
4. ✅ Form Template Configuration
5. ✅ Field Validation Configuration

### Low Priority
6. ✅ Service Conflict Configuration (changes less frequently)

---

## 10. EXAMPLE: Adding a New Workflow Step

### Current Process (Hardcoded)
1. Update database schema (add new status)
2. Update backend code (add status handling)
3. Update frontend code (add UI for new step)
4. Deploy and test
5. **Time**: 2-3 days

### With Configuration System
1. Admin logs into system
2. Navigates to "Workflow Configuration"
3. Clicks "Add Step"
4. Enters step details (name, order, role)
5. Saves
6. **Time**: 5 minutes

---

## Summary

**Current State**: ~80% hardcoded, ~20% configurable
**Target State**: ~20% hardcoded (core logic), ~80% configurable

**Key Hardcoded Areas**:
- Workflow steps and statuses
- Form template structure
- Approval options
- Service conflict rules
- Validation rules
- Monitoring intervals

**Recommended Solution**: Configuration tables + Admin UI for dynamic management

**Migration Effort**: 6-8 weeks for full implementation

**ROI**: High - enables business users to adapt system without developer intervention

