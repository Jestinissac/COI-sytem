# Configuration Quick Reference

## Hardcoded vs Dynamic Values

| Component | Current State | Location | Impact of Change |
|-----------|--------------|----------|------------------|
| **Workflow Steps** | 🔴 Hardcoded | `schema.sql`, `COIRequestDetail.vue` | Requires code + DB migration |
| **Status Values** | 🔴 Hardcoded | `schema.sql` CHECK constraints | Requires DB migration |
| **Approval Options** | 🔴 Hardcoded | `schema.sql` CHECK constraints | Requires DB migration |
| **Form Sections** | 🔴 Hardcoded | `COIRequestForm.vue` | Requires code changes |
| **Form Fields** | 🔴 Hardcoded | `schema.sql` columns | Requires DB migration |
| **Field Validation** | 🔴 Hardcoded | `COIRequestForm.vue` | Requires code changes |
| **Service Conflicts** | 🔴 Hardcoded | `duplicationCheckService.js` | Requires code changes |
| **Monitoring Intervals** | 🔴 Hardcoded | `monitoringService.js` | Requires code changes |
| **Role Permissions** | 🔴 Hardcoded | Multiple files | Requires code changes |
| **User Roles** | 🟢 Dynamic | `users` table | Can add via Super Admin UI |
| **Clients** | 🟢 Dynamic | `clients` table, PRMS | Can add/update |
| **Departments** | 🟢 Dynamic | `users` table | Can update per user |

---

## How to Handle Changes

### Scenario 1: Template Format Changes

**Current Limitation**: 
- Form fields are database columns (hardcoded)
- Sections are hardcoded in Vue component
- Field labels are hardcoded

**To Add New Field**:
1. ❌ Add column to `coi_requests` table
2. ❌ Update `COIRequestForm.vue` to add input
3. ❌ Update validation logic
4. ❌ Deploy code

**Recommended Solution**:
- Create `form_template_config` table
- Store field definitions as JSON
- Render form dynamically from configuration
- **Result**: Add fields via admin UI, no code changes

---

### Scenario 2: Approval Flow Changes

**Current Limitation**:
- Workflow steps hardcoded in database CHECK constraints
- Step order hardcoded in frontend
- Role-to-step mapping hardcoded

**To Add New Step (e.g., "Legal Review")**:
1. ❌ Update database schema (add new status)
2. ❌ Update `coiController.js` to handle new status
3. ❌ Update `COIRequestDetail.vue` workflow display
4. ❌ Update all status checks throughout codebase
5. ❌ Deploy and test

**Recommended Solution**:
- Create `workflow_config` table
- Store workflow steps as configuration
- Load workflow dynamically
- **Result**: Add steps via admin UI, reorder without code

---

### Scenario 3: Approval Options Changes

**Current Limitation**:
- Approval options hardcoded in CHECK constraints
- Same options for all roles

**To Add New Option (e.g., "Approve with Conditions")**:
1. ❌ Update database schema
2. ❌ Update frontend modals
3. ❌ Update backend handlers
4. ❌ Deploy

**Recommended Solution**:
- Create `approval_options_config` table
- Configure options per role
- **Result**: Add options via admin UI, customize per role

---

## Quick Decision Matrix

| Change Type | Current Effort | With Config System | Priority |
|-------------|---------------|-------------------|----------|
| Add form field | 2-3 hours | 5 minutes | High |
| Change workflow step | 1-2 days | 10 minutes | High |
| Add approval option | 4-6 hours | 5 minutes | Medium |
| Change monitoring interval | 1 hour | 2 minutes | Medium |
| Modify service conflict rule | 2-3 hours | 10 minutes | Low |
| Reorder form sections | 1 hour | 5 minutes | Medium |

---

## Current Workarounds (Until Config System)

### For Template Changes:
- Use `JSON` column to store additional fields
- Example: `additional_data TEXT` (JSON)
- Store extra fields as: `{"custom_field_1": "value", ...}`

### For Workflow Changes:
- Use generic status values
- Handle logic in code based on status
- Example: `status = 'Pending Review'` instead of specific role

### For Approval Options:
- Use `notes` field for custom approvals
- Store approval type in JSON format
- Example: `{"approval_type": "custom", "details": "..."}`

---

## Recommended Implementation Order

1. **Phase 1** (Week 1-2): Workflow Configuration
   - Most requested feature
   - High business value
   - Medium complexity

2. **Phase 2** (Week 3-4): Approval Options Configuration
   - Frequently changes
   - Medium complexity

3. **Phase 3** (Week 5-6): Form Template Configuration
   - High complexity
   - Requires dynamic form renderer

4. **Phase 4** (Week 7-8): Monitoring & Validation Configuration
   - Lower priority
   - Easier to implement

---

## Key Files to Modify for Configuration System

### Backend:
- `database/schema.sql` - Add configuration tables
- `backend/src/services/workflowService.js` - NEW: Load workflow config
- `backend/src/services/formTemplateService.js` - NEW: Load form config
- `backend/src/controllers/coiController.js` - Use config instead of hardcoded
- `backend/src/routes/config.routes.js` - NEW: Admin API for config

### Frontend:
- `frontend/src/views/ConfigManagement.vue` - NEW: Admin UI
- `frontend/src/components/DynamicForm.vue` - NEW: Render form from config
- `frontend/src/views/COIRequestForm.vue` - Use DynamicForm
- `frontend/src/views/COIRequestDetail.vue` - Use workflow config

---

## Example: Before vs After

### Before (Hardcoded):
```javascript
// Adding "Legal Review" step requires:
// 1. Database migration
ALTER TABLE coi_requests 
ADD COLUMN legal_review_status VARCHAR(50) 
CHECK (legal_review_status IN ('Pending', 'Approved', 'Rejected'));

// 2. Backend code
if (status === 'Pending Partner') {
  newStatus = 'Pending Legal Review'
}

// 3. Frontend code
{ name: 'Legal', index: 5, ... }

// Total: 2-3 hours + deployment
```

### After (Configuration):
```sql
-- Admin UI: Add workflow step
INSERT INTO workflow_config 
(workflow_name, step_order, step_name, step_status, required_role) 
VALUES 
('default', 5, 'Legal', 'Pending Legal Review', 'Legal');

-- Total: 2 minutes, no deployment needed
```

---

## Summary

**Current System**: 
- 🔴 80% hardcoded
- 🟢 20% configurable
- ⚠️ Changes require developer + deployment

**Target System**:
- 🔴 20% hardcoded (core business logic)
- 🟢 80% configurable (workflow, forms, rules)
- ✅ Changes via admin UI, no deployment

**ROI**: 
- Faster response to business changes
- Reduced development costs
- Business users can self-serve
- Better compliance (audit trail of changes)


## Hardcoded vs Dynamic Values

| Component | Current State | Location | Impact of Change |
|-----------|--------------|----------|------------------|
| **Workflow Steps** | 🔴 Hardcoded | `schema.sql`, `COIRequestDetail.vue` | Requires code + DB migration |
| **Status Values** | 🔴 Hardcoded | `schema.sql` CHECK constraints | Requires DB migration |
| **Approval Options** | 🔴 Hardcoded | `schema.sql` CHECK constraints | Requires DB migration |
| **Form Sections** | 🔴 Hardcoded | `COIRequestForm.vue` | Requires code changes |
| **Form Fields** | 🔴 Hardcoded | `schema.sql` columns | Requires DB migration |
| **Field Validation** | 🔴 Hardcoded | `COIRequestForm.vue` | Requires code changes |
| **Service Conflicts** | 🔴 Hardcoded | `duplicationCheckService.js` | Requires code changes |
| **Monitoring Intervals** | 🔴 Hardcoded | `monitoringService.js` | Requires code changes |
| **Role Permissions** | 🔴 Hardcoded | Multiple files | Requires code changes |
| **User Roles** | 🟢 Dynamic | `users` table | Can add via Super Admin UI |
| **Clients** | 🟢 Dynamic | `clients` table, PRMS | Can add/update |
| **Departments** | 🟢 Dynamic | `users` table | Can update per user |

---

## How to Handle Changes

### Scenario 1: Template Format Changes

**Current Limitation**: 
- Form fields are database columns (hardcoded)
- Sections are hardcoded in Vue component
- Field labels are hardcoded

**To Add New Field**:
1. ❌ Add column to `coi_requests` table
2. ❌ Update `COIRequestForm.vue` to add input
3. ❌ Update validation logic
4. ❌ Deploy code

**Recommended Solution**:
- Create `form_template_config` table
- Store field definitions as JSON
- Render form dynamically from configuration
- **Result**: Add fields via admin UI, no code changes

---

### Scenario 2: Approval Flow Changes

**Current Limitation**:
- Workflow steps hardcoded in database CHECK constraints
- Step order hardcoded in frontend
- Role-to-step mapping hardcoded

**To Add New Step (e.g., "Legal Review")**:
1. ❌ Update database schema (add new status)
2. ❌ Update `coiController.js` to handle new status
3. ❌ Update `COIRequestDetail.vue` workflow display
4. ❌ Update all status checks throughout codebase
5. ❌ Deploy and test

**Recommended Solution**:
- Create `workflow_config` table
- Store workflow steps as configuration
- Load workflow dynamically
- **Result**: Add steps via admin UI, reorder without code

---

### Scenario 3: Approval Options Changes

**Current Limitation**:
- Approval options hardcoded in CHECK constraints
- Same options for all roles

**To Add New Option (e.g., "Approve with Conditions")**:
1. ❌ Update database schema
2. ❌ Update frontend modals
3. ❌ Update backend handlers
4. ❌ Deploy

**Recommended Solution**:
- Create `approval_options_config` table
- Configure options per role
- **Result**: Add options via admin UI, customize per role

---

## Quick Decision Matrix

| Change Type | Current Effort | With Config System | Priority |
|-------------|---------------|-------------------|----------|
| Add form field | 2-3 hours | 5 minutes | High |
| Change workflow step | 1-2 days | 10 minutes | High |
| Add approval option | 4-6 hours | 5 minutes | Medium |
| Change monitoring interval | 1 hour | 2 minutes | Medium |
| Modify service conflict rule | 2-3 hours | 10 minutes | Low |
| Reorder form sections | 1 hour | 5 minutes | Medium |

---

## Current Workarounds (Until Config System)

### For Template Changes:
- Use `JSON` column to store additional fields
- Example: `additional_data TEXT` (JSON)
- Store extra fields as: `{"custom_field_1": "value", ...}`

### For Workflow Changes:
- Use generic status values
- Handle logic in code based on status
- Example: `status = 'Pending Review'` instead of specific role

### For Approval Options:
- Use `notes` field for custom approvals
- Store approval type in JSON format
- Example: `{"approval_type": "custom", "details": "..."}`

---

## Recommended Implementation Order

1. **Phase 1** (Week 1-2): Workflow Configuration
   - Most requested feature
   - High business value
   - Medium complexity

2. **Phase 2** (Week 3-4): Approval Options Configuration
   - Frequently changes
   - Medium complexity

3. **Phase 3** (Week 5-6): Form Template Configuration
   - High complexity
   - Requires dynamic form renderer

4. **Phase 4** (Week 7-8): Monitoring & Validation Configuration
   - Lower priority
   - Easier to implement

---

## Key Files to Modify for Configuration System

### Backend:
- `database/schema.sql` - Add configuration tables
- `backend/src/services/workflowService.js` - NEW: Load workflow config
- `backend/src/services/formTemplateService.js` - NEW: Load form config
- `backend/src/controllers/coiController.js` - Use config instead of hardcoded
- `backend/src/routes/config.routes.js` - NEW: Admin API for config

### Frontend:
- `frontend/src/views/ConfigManagement.vue` - NEW: Admin UI
- `frontend/src/components/DynamicForm.vue` - NEW: Render form from config
- `frontend/src/views/COIRequestForm.vue` - Use DynamicForm
- `frontend/src/views/COIRequestDetail.vue` - Use workflow config

---

## Example: Before vs After

### Before (Hardcoded):
```javascript
// Adding "Legal Review" step requires:
// 1. Database migration
ALTER TABLE coi_requests 
ADD COLUMN legal_review_status VARCHAR(50) 
CHECK (legal_review_status IN ('Pending', 'Approved', 'Rejected'));

// 2. Backend code
if (status === 'Pending Partner') {
  newStatus = 'Pending Legal Review'
}

// 3. Frontend code
{ name: 'Legal', index: 5, ... }

// Total: 2-3 hours + deployment
```

### After (Configuration):
```sql
-- Admin UI: Add workflow step
INSERT INTO workflow_config 
(workflow_name, step_order, step_name, step_status, required_role) 
VALUES 
('default', 5, 'Legal', 'Pending Legal Review', 'Legal');

-- Total: 2 minutes, no deployment needed
```

---

## Summary

**Current System**: 
- 🔴 80% hardcoded
- 🟢 20% configurable
- ⚠️ Changes require developer + deployment

**Target System**:
- 🔴 20% hardcoded (core business logic)
- 🟢 80% configurable (workflow, forms, rules)
- ✅ Changes via admin UI, no deployment

**ROI**: 
- Faster response to business changes
- Reduced development costs
- Business users can self-serve
- Better compliance (audit trail of changes)

