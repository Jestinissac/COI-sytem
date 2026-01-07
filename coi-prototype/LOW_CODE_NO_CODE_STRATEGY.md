# Low-Code/No-Code (LC/NC) Strategy for COI System

## Overview
Since hierarchy and organizational data come from HRMS/PRMS systems, implementing LC/NC components will enable business users to configure workflows, forms, and rules without developer intervention.

---

## 1. WHERE TO USE LC/NC COMPONENTS

### 1.1 High Priority (Use LC/NC Here)

#### A. Form Builder / Template Configuration
**Why**: Form structure changes frequently, fields vary by department/client type
**Current**: Hardcoded in Vue components
**LC/NC Solution**: Visual form builder

**Use Cases**:
- Add new fields to COI request form
- Change field labels/placeholders
- Reorder sections
- Make fields conditional (show/hide based on other fields)
- Change field types (text → dropdown, etc.)

**Example**:
```
User Story: "We need to add a 'Risk Assessment' field for PIE clients"
Current: Developer adds column, updates form, deploys (2-3 hours)
LC/NC: Admin opens form builder, drags "Risk Assessment" field, saves (5 minutes)
```

---

#### B. Workflow Designer
**Why**: Approval flows change based on business needs, client types, service types
**Current**: Hardcoded workflow steps in code
**LC/NC Solution**: Visual workflow designer

**Use Cases**:
- Add new approval step (e.g., "Legal Review")
- Change step order
- Skip steps conditionally (e.g., skip Director for Directors themselves)
- Create parallel approval paths
- Add approval rules (e.g., "If amount > $100k, require Partner approval")

**Example**:
```
User Story: "For international clients, add a 'Global Compliance' step"
Current: Developer updates schema, code, deploys (1-2 days)
LC/NC: Admin opens workflow designer, adds step, sets condition, saves (10 minutes)
```

---

#### C. Business Rules Engine
**Why**: Service conflict rules, validation rules change frequently
**Current**: Hardcoded in JavaScript
**LC/NC Solution**: Rule builder with visual interface

**Use Cases**:
- Define service conflict rules (e.g., "Audit + Advisory = Blocked")
- Set validation rules (e.g., "Parent Company required if International = Yes")
- Configure monitoring alerts (e.g., "Send alert 10 days before expiry")
- Define approval thresholds (e.g., "Require Partner if amount > $50k")

**Example**:
```
User Story: "Change conflict rule: Audit + Tax should be flagged, not blocked"
Current: Developer updates conflict matrix code, deploys (1 hour)
LC/NC: Admin opens rule builder, modifies rule, saves (5 minutes)
```

---

#### D. Approval Options Configuration
**Why**: Different roles need different approval options
**Current**: Same options for all roles
**LC/NC Solution**: Role-based approval option builder

**Use Cases**:
- Add new approval option (e.g., "Approve with Conditions")
- Customize options per role
- Enable/disable options
- Set required fields per option (e.g., "Restrictions" required for "Approve with Restrictions")

---

### 1.2 Medium Priority

#### E. Dashboard Builder
**Why**: Different roles need different views, KPIs change
**LC/NC Solution**: Drag-and-drop dashboard builder

**Use Cases**:
- Add new KPI cards
- Reorder dashboard sections
- Customize charts/graphs
- Add filters

---

#### F. Notification Templates
**Why**: Email templates change, need localization
**LC/NC Solution**: Email template editor with variables

**Use Cases**:
- Edit email templates
- Add new notification types
- Customize per role/department

---

### 1.3 Low Priority (Keep Coded)

#### G. Core Business Logic
- Duplication detection algorithm
- Fuzzy matching logic
- PRMS integration logic
- Authentication/authorization

**Why**: These are stable, complex, and need performance optimization

---

## 2. LC/NC TOOLS & APPROACHES

### 2.1 Option A: Build Custom LC/NC Components (Recommended for Prototype)

**Pros**:
- Full control
- Tailored to COI system needs
- No licensing costs
- Can integrate with existing codebase

**Cons**:
- Requires development time
- Need to maintain

**Implementation**:
- Use existing Vue.js framework
- Create reusable form builder components
- Store configurations in database
- Render dynamically

---

### 2.2 Option B: Use Existing LC/NC Platforms

#### A. Form.io (Open Source)
**Best For**: Form builder
**Integration**: Can embed in Vue.js
**Cost**: Free (open source) or paid (cloud)

**Example Integration**:
```javascript
// Embed Form.io form builder
import { Form } from '@formio/vue'

<Form
  :form="formConfig"
  :submission="formData"
  @submit="handleSubmit"
/>
```

---

#### B. Camunda (Workflow Engine)
**Best For**: Workflow/BPMN designer
**Integration**: REST API
**Cost**: Free (community) or paid (enterprise)

**Example**:
- Design workflows in Camunda Modeler
- Deploy BPMN files
- COI system calls Camunda API for workflow execution

---

#### C. Microsoft Power Apps
**Best For**: Forms, workflows (if using Azure)
**Integration**: REST API, Azure AD
**Cost**: Per user/month

**Example**:
- Build forms in Power Apps
- Integrate with COI system via API
- Use Power Automate for workflows

---

#### D. Retool (Internal Tools)
**Best For**: Admin panels, dashboards
**Integration**: REST API
**Cost**: Free (up to 5 users) or paid

**Example**:
- Build admin UI in Retool
- Connect to COI database/API
- Business users configure without code

---

### 2.3 Option C: Hybrid Approach (Recommended)

**Use Custom LC/NC for**:
- Form builder (integrated with Vue.js)
- Workflow designer (simple visual editor)
- Rule builder (custom UI)

**Use External Tools for**:
- Complex BPMN workflows (Camunda)
- Advanced analytics (Power BI)
- Email templates (external service)

---

## 3. PROTOTYPE-LEVEL IMPLEMENTATION

### 3.1 Phase 1: Simple Form Builder (Week 1-2)

**Goal**: Allow admins to add/edit form fields via UI

**Components Needed**:
1. **Form Builder UI** (Admin only)
   - Drag-and-drop field types
   - Field properties editor
   - Section organizer

2. **Form Renderer** (Dynamic)
   - Load form config from database
   - Render fields dynamically
   - Apply validation rules

**Database Schema**:
```sql
CREATE TABLE form_fields_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id VARCHAR(50) NOT NULL,
    field_id VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'select', 'textarea', 'date', etc.
    field_label VARCHAR(255) NOT NULL,
    field_placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT 0,
    is_readonly BOOLEAN DEFAULT 0,
    default_value TEXT,
    options TEXT, -- JSON array for select/dropdown
    validation_rules TEXT, -- JSON: {min: 1, max: 100, pattern: '...'}
    conditions TEXT, -- JSON: when to show this field
    display_order INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Simple Implementation**:
```vue
<!-- FormBuilder.vue (Admin UI) -->
<template>
  <div class="form-builder">
    <div class="field-palette">
      <h3>Field Types</h3>
      <div 
        v-for="type in fieldTypes" 
        :key="type"
        @dragstart="handleDragStart(type)"
        class="field-type"
        draggable="true"
      >
        {{ type }}
      </div>
    </div>
    
    <div class="form-canvas" @drop="handleDrop" @dragover.prevent>
      <div v-for="field in formFields" :key="field.id" class="form-field">
        <component 
          :is="getFieldComponent(field.field_type)"
          v-model="field.value"
          :field="field"
        />
        <button @click="editField(field)">Edit</button>
        <button @click="deleteField(field.id)">Delete</button>
      </div>
    </div>
  </div>
</template>
```

---

### 3.2 Phase 2: Simple Workflow Designer (Week 3-4)

**Goal**: Allow admins to configure workflow steps

**Components Needed**:
1. **Workflow Designer UI**
   - Visual step builder
   - Step properties editor
   - Condition builder

2. **Workflow Engine**
   - Load workflow config
   - Execute workflow transitions
   - Handle conditions

**Simple Implementation**:
```vue
<!-- WorkflowDesigner.vue -->
<template>
  <div class="workflow-designer">
    <div class="step-palette">
      <button @click="addStep">+ Add Step</button>
    </div>
    
    <div class="workflow-canvas">
      <div 
        v-for="step in workflowSteps" 
        :key="step.id"
        class="workflow-step"
      >
        <div class="step-header">
          {{ step.step_name }}
        </div>
        <div class="step-properties">
          <input v-model="step.required_role" placeholder="Role" />
          <input v-model="step.step_status" placeholder="Status" />
          <button @click="editStep(step)">Edit</button>
        </div>
        <div class="step-arrow">→</div>
      </div>
    </div>
  </div>
</template>
```

---

### 3.3 Phase 3: Rule Builder (Week 5-6)

**Goal**: Allow admins to configure business rules

**Simple Implementation**:
```vue
<!-- RuleBuilder.vue -->
<template>
  <div class="rule-builder">
    <div class="rule-editor">
      <select v-model="rule.condition_type">
        <option>IF</option>
        <option>IF NOT</option>
      </select>
      
      <select v-model="rule.field">
        <option>service_type</option>
        <option>client_type</option>
        <option>amount</option>
      </select>
      
      <select v-model="rule.operator">
        <option>equals</option>
        <option>contains</option>
        <option>greater than</option>
        <option>less than</option>
      </select>
      
      <input v-model="rule.value" />
      
      <select v-model="rule.action">
        <option>Block</option>
        <option>Flag</option>
        <option>Require Approval</option>
      </select>
      
      <button @click="saveRule">Save Rule</button>
    </div>
    
    <div class="rules-list">
      <div v-for="rule in rules" :key="rule.id" class="rule-item">
        IF {{ rule.field }} {{ rule.operator }} {{ rule.value }} 
        THEN {{ rule.action }}
      </div>
    </div>
  </div>
</template>
```

---

## 4. INTEGRATION WITH HRMS/PRMS

### 4.1 Hierarchy Data

**Current**: `director_id` stored in `users` table
**LC/NC Approach**: Sync from HRMS, use in rules

**Implementation**:
```javascript
// Sync hierarchy from HRMS
async function syncHierarchyFromHRMS() {
  const hrmsData = await fetchHRMSHierarchy()
  
  // Update users table
  for (const employee of hrmsData) {
    db.prepare(`
      UPDATE users 
      SET director_id = ?, department = ?, line_of_service = ?
      WHERE email = ?
    `).run(
      employee.manager_id,
      employee.department,
      employee.line_of_service,
      employee.email
    )
  }
}

// Use in workflow rules
const workflowRule = {
  condition: "user.role === 'Requester' AND user.director_id IS NOT NULL",
  action: "setStatus('Pending Director Approval')"
}
```

---

### 4.2 Client Data

**Current**: Clients from PRMS
**LC/NC Approach**: Use client attributes in rules

**Example Rule**:
```
IF client.client_type === 'PIE' 
AND service_type === 'Advisory'
THEN Block
REASON: 'PIE clients cannot receive Advisory services'
```

---

## 5. PROTOTYPE IMPLEMENTATION PLAN

### Week 1-2: Form Builder MVP
- [ ] Create `form_fields_config` table
- [ ] Build simple form builder UI (drag-drop fields)
- [ ] Create dynamic form renderer
- [ ] Test: Add field, render in form

### Week 3-4: Workflow Designer MVP
- [ ] Create `workflow_config` table
- [ ] Build simple workflow designer UI
- [ ] Update workflow engine to use config
- [ ] Test: Add step, change order

### Week 5-6: Rule Builder MVP
- [ ] Create `business_rules_config` table
- [ ] Build rule builder UI
- [ ] Create rule engine
- [ ] Test: Add rule, apply to requests

### Week 7-8: Integration & Polish
- [ ] Integrate with HRMS/PRMS sync
- [ ] Add validation
- [ ] Add audit logging
- [ ] User testing

---

## 6. EXAMPLE: COMPLETE LC/NC FLOW

### Scenario: Add "Risk Assessment" Field for PIE Clients

**Step 1: Admin Opens Form Builder**
```
Admin → Configuration → Form Builder
```

**Step 2: Add Field**
```
1. Drag "Text Area" field to form
2. Set properties:
   - Label: "Risk Assessment"
   - Field ID: "risk_assessment"
   - Required: Yes
   - Condition: Show if "pie_status === 'Yes'"
3. Save
```

**Step 3: System Updates**
```
- Field added to form_fields_config table
- Form renderer automatically shows field for PIE clients
- Validation applies automatically
- No code deployment needed
```

**Step 4: User Creates Request**
```
1. User selects PIE client
2. "Risk Assessment" field appears
3. User fills field
4. Form validates (required field)
5. Request submitted
```

---

## 7. TOOLS COMPARISON FOR PROTOTYPE

| Tool | Best For | Cost | Integration | Learning Curve |
|------|----------|------|-------------|----------------|
| **Custom Vue Components** | Forms, Workflows | Free | Native | Medium |
| **Form.io** | Forms | Free/Paid | Easy | Low |
| **Camunda** | Complex Workflows | Free/Paid | API | High |
| **Power Apps** | Forms (Azure) | Paid | Good | Medium |
| **Retool** | Admin Panels | Free/Paid | API | Low |

**Recommendation for Prototype**: 
- Start with **Custom Vue Components** (full control, no licensing)
- Consider **Form.io** if form builder becomes complex
- Use **Camunda** only if workflows become very complex (BPMN)

---

## 8. QUICK START: SIMPLE FORM BUILDER

### 8.1 Database Table
```sql
CREATE TABLE form_fields_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section VARCHAR(50),
    field_id VARCHAR(100) UNIQUE,
    field_type VARCHAR(50),
    label VARCHAR(255),
    required BOOLEAN DEFAULT 0,
    options TEXT, -- JSON
    conditions TEXT, -- JSON
    display_order INTEGER
);
```

### 8.2 Admin UI Component
```vue
<!-- FormBuilder.vue -->
<template>
  <div>
    <h2>Form Builder</h2>
    <button @click="addField">+ Add Field</button>
    <div v-for="field in fields" :key="field.id">
      <input v-model="field.label" />
      <select v-model="field.field_type">
        <option>text</option>
        <option>textarea</option>
        <option>select</option>
      </select>
      <button @click="saveField(field)">Save</button>
    </div>
  </div>
</template>
```

### 8.3 Dynamic Form Renderer
```vue
<!-- DynamicForm.vue -->
<template>
  <div>
    <component
      v-for="field in formConfig"
      :key="field.field_id"
      :is="getComponent(field.field_type)"
      v-model="formData[field.field_id]"
      :field="field"
    />
  </div>
</template>

<script>
function getComponent(type) {
  const components = {
    'text': 'InputField',
    'textarea': 'TextareaField',
    'select': 'SelectField'
  }
  return components[type] || 'InputField'
}
</script>
```

---

## 9. BENEFITS FOR PROTOTYPE

### Immediate Benefits:
- ✅ Faster iteration (no code deployment)
- ✅ Business users can test changes
- ✅ Easy to demonstrate flexibility
- ✅ Shows production-ready approach

### Long-term Benefits:
- ✅ Reduced development costs
- ✅ Faster response to business needs
- ✅ Better user adoption (users feel ownership)
- ✅ Easier compliance (audit trail of changes)

---

## 10. RECOMMENDED APPROACH

### For Prototype:
1. **Start Simple**: Build basic form builder (Week 1-2)
2. **Add Workflow Designer**: Simple step builder (Week 3-4)
3. **Add Rule Builder**: Basic IF-THEN rules (Week 5-6)
4. **Integrate**: Connect to HRMS/PRMS data

### For Production:
1. **Enhance**: Add more field types, validation
2. **Scale**: Add versioning, rollback
3. **Optimize**: Performance, caching
4. **Extend**: Add more LC/NC components

---

## Summary

**Where to Use LC/NC**:
1. ✅ Form Builder (High Priority)
2. ✅ Workflow Designer (High Priority)
3. ✅ Rule Builder (High Priority)
4. ✅ Approval Options (Medium Priority)
5. ✅ Dashboard Builder (Medium Priority)

**How to Use**:
- Start with custom Vue components (prototype)
- Store configurations in database
- Render dynamically
- Integrate with HRMS/PRMS data

**Prototype Timeline**: 6-8 weeks for MVP

**ROI**: High - Enables business users to configure system without developers


## Overview
Since hierarchy and organizational data come from HRMS/PRMS systems, implementing LC/NC components will enable business users to configure workflows, forms, and rules without developer intervention.

---

## 1. WHERE TO USE LC/NC COMPONENTS

### 1.1 High Priority (Use LC/NC Here)

#### A. Form Builder / Template Configuration
**Why**: Form structure changes frequently, fields vary by department/client type
**Current**: Hardcoded in Vue components
**LC/NC Solution**: Visual form builder

**Use Cases**:
- Add new fields to COI request form
- Change field labels/placeholders
- Reorder sections
- Make fields conditional (show/hide based on other fields)
- Change field types (text → dropdown, etc.)

**Example**:
```
User Story: "We need to add a 'Risk Assessment' field for PIE clients"
Current: Developer adds column, updates form, deploys (2-3 hours)
LC/NC: Admin opens form builder, drags "Risk Assessment" field, saves (5 minutes)
```

---

#### B. Workflow Designer
**Why**: Approval flows change based on business needs, client types, service types
**Current**: Hardcoded workflow steps in code
**LC/NC Solution**: Visual workflow designer

**Use Cases**:
- Add new approval step (e.g., "Legal Review")
- Change step order
- Skip steps conditionally (e.g., skip Director for Directors themselves)
- Create parallel approval paths
- Add approval rules (e.g., "If amount > $100k, require Partner approval")

**Example**:
```
User Story: "For international clients, add a 'Global Compliance' step"
Current: Developer updates schema, code, deploys (1-2 days)
LC/NC: Admin opens workflow designer, adds step, sets condition, saves (10 minutes)
```

---

#### C. Business Rules Engine
**Why**: Service conflict rules, validation rules change frequently
**Current**: Hardcoded in JavaScript
**LC/NC Solution**: Rule builder with visual interface

**Use Cases**:
- Define service conflict rules (e.g., "Audit + Advisory = Blocked")
- Set validation rules (e.g., "Parent Company required if International = Yes")
- Configure monitoring alerts (e.g., "Send alert 10 days before expiry")
- Define approval thresholds (e.g., "Require Partner if amount > $50k")

**Example**:
```
User Story: "Change conflict rule: Audit + Tax should be flagged, not blocked"
Current: Developer updates conflict matrix code, deploys (1 hour)
LC/NC: Admin opens rule builder, modifies rule, saves (5 minutes)
```

---

#### D. Approval Options Configuration
**Why**: Different roles need different approval options
**Current**: Same options for all roles
**LC/NC Solution**: Role-based approval option builder

**Use Cases**:
- Add new approval option (e.g., "Approve with Conditions")
- Customize options per role
- Enable/disable options
- Set required fields per option (e.g., "Restrictions" required for "Approve with Restrictions")

---

### 1.2 Medium Priority

#### E. Dashboard Builder
**Why**: Different roles need different views, KPIs change
**LC/NC Solution**: Drag-and-drop dashboard builder

**Use Cases**:
- Add new KPI cards
- Reorder dashboard sections
- Customize charts/graphs
- Add filters

---

#### F. Notification Templates
**Why**: Email templates change, need localization
**LC/NC Solution**: Email template editor with variables

**Use Cases**:
- Edit email templates
- Add new notification types
- Customize per role/department

---

### 1.3 Low Priority (Keep Coded)

#### G. Core Business Logic
- Duplication detection algorithm
- Fuzzy matching logic
- PRMS integration logic
- Authentication/authorization

**Why**: These are stable, complex, and need performance optimization

---

## 2. LC/NC TOOLS & APPROACHES

### 2.1 Option A: Build Custom LC/NC Components (Recommended for Prototype)

**Pros**:
- Full control
- Tailored to COI system needs
- No licensing costs
- Can integrate with existing codebase

**Cons**:
- Requires development time
- Need to maintain

**Implementation**:
- Use existing Vue.js framework
- Create reusable form builder components
- Store configurations in database
- Render dynamically

---

### 2.2 Option B: Use Existing LC/NC Platforms

#### A. Form.io (Open Source)
**Best For**: Form builder
**Integration**: Can embed in Vue.js
**Cost**: Free (open source) or paid (cloud)

**Example Integration**:
```javascript
// Embed Form.io form builder
import { Form } from '@formio/vue'

<Form
  :form="formConfig"
  :submission="formData"
  @submit="handleSubmit"
/>
```

---

#### B. Camunda (Workflow Engine)
**Best For**: Workflow/BPMN designer
**Integration**: REST API
**Cost**: Free (community) or paid (enterprise)

**Example**:
- Design workflows in Camunda Modeler
- Deploy BPMN files
- COI system calls Camunda API for workflow execution

---

#### C. Microsoft Power Apps
**Best For**: Forms, workflows (if using Azure)
**Integration**: REST API, Azure AD
**Cost**: Per user/month

**Example**:
- Build forms in Power Apps
- Integrate with COI system via API
- Use Power Automate for workflows

---

#### D. Retool (Internal Tools)
**Best For**: Admin panels, dashboards
**Integration**: REST API
**Cost**: Free (up to 5 users) or paid

**Example**:
- Build admin UI in Retool
- Connect to COI database/API
- Business users configure without code

---

### 2.3 Option C: Hybrid Approach (Recommended)

**Use Custom LC/NC for**:
- Form builder (integrated with Vue.js)
- Workflow designer (simple visual editor)
- Rule builder (custom UI)

**Use External Tools for**:
- Complex BPMN workflows (Camunda)
- Advanced analytics (Power BI)
- Email templates (external service)

---

## 3. PROTOTYPE-LEVEL IMPLEMENTATION

### 3.1 Phase 1: Simple Form Builder (Week 1-2)

**Goal**: Allow admins to add/edit form fields via UI

**Components Needed**:
1. **Form Builder UI** (Admin only)
   - Drag-and-drop field types
   - Field properties editor
   - Section organizer

2. **Form Renderer** (Dynamic)
   - Load form config from database
   - Render fields dynamically
   - Apply validation rules

**Database Schema**:
```sql
CREATE TABLE form_fields_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id VARCHAR(50) NOT NULL,
    field_id VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'select', 'textarea', 'date', etc.
    field_label VARCHAR(255) NOT NULL,
    field_placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT 0,
    is_readonly BOOLEAN DEFAULT 0,
    default_value TEXT,
    options TEXT, -- JSON array for select/dropdown
    validation_rules TEXT, -- JSON: {min: 1, max: 100, pattern: '...'}
    conditions TEXT, -- JSON: when to show this field
    display_order INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Simple Implementation**:
```vue
<!-- FormBuilder.vue (Admin UI) -->
<template>
  <div class="form-builder">
    <div class="field-palette">
      <h3>Field Types</h3>
      <div 
        v-for="type in fieldTypes" 
        :key="type"
        @dragstart="handleDragStart(type)"
        class="field-type"
        draggable="true"
      >
        {{ type }}
      </div>
    </div>
    
    <div class="form-canvas" @drop="handleDrop" @dragover.prevent>
      <div v-for="field in formFields" :key="field.id" class="form-field">
        <component 
          :is="getFieldComponent(field.field_type)"
          v-model="field.value"
          :field="field"
        />
        <button @click="editField(field)">Edit</button>
        <button @click="deleteField(field.id)">Delete</button>
      </div>
    </div>
  </div>
</template>
```

---

### 3.2 Phase 2: Simple Workflow Designer (Week 3-4)

**Goal**: Allow admins to configure workflow steps

**Components Needed**:
1. **Workflow Designer UI**
   - Visual step builder
   - Step properties editor
   - Condition builder

2. **Workflow Engine**
   - Load workflow config
   - Execute workflow transitions
   - Handle conditions

**Simple Implementation**:
```vue
<!-- WorkflowDesigner.vue -->
<template>
  <div class="workflow-designer">
    <div class="step-palette">
      <button @click="addStep">+ Add Step</button>
    </div>
    
    <div class="workflow-canvas">
      <div 
        v-for="step in workflowSteps" 
        :key="step.id"
        class="workflow-step"
      >
        <div class="step-header">
          {{ step.step_name }}
        </div>
        <div class="step-properties">
          <input v-model="step.required_role" placeholder="Role" />
          <input v-model="step.step_status" placeholder="Status" />
          <button @click="editStep(step)">Edit</button>
        </div>
        <div class="step-arrow">→</div>
      </div>
    </div>
  </div>
</template>
```

---

### 3.3 Phase 3: Rule Builder (Week 5-6)

**Goal**: Allow admins to configure business rules

**Simple Implementation**:
```vue
<!-- RuleBuilder.vue -->
<template>
  <div class="rule-builder">
    <div class="rule-editor">
      <select v-model="rule.condition_type">
        <option>IF</option>
        <option>IF NOT</option>
      </select>
      
      <select v-model="rule.field">
        <option>service_type</option>
        <option>client_type</option>
        <option>amount</option>
      </select>
      
      <select v-model="rule.operator">
        <option>equals</option>
        <option>contains</option>
        <option>greater than</option>
        <option>less than</option>
      </select>
      
      <input v-model="rule.value" />
      
      <select v-model="rule.action">
        <option>Block</option>
        <option>Flag</option>
        <option>Require Approval</option>
      </select>
      
      <button @click="saveRule">Save Rule</button>
    </div>
    
    <div class="rules-list">
      <div v-for="rule in rules" :key="rule.id" class="rule-item">
        IF {{ rule.field }} {{ rule.operator }} {{ rule.value }} 
        THEN {{ rule.action }}
      </div>
    </div>
  </div>
</template>
```

---

## 4. INTEGRATION WITH HRMS/PRMS

### 4.1 Hierarchy Data

**Current**: `director_id` stored in `users` table
**LC/NC Approach**: Sync from HRMS, use in rules

**Implementation**:
```javascript
// Sync hierarchy from HRMS
async function syncHierarchyFromHRMS() {
  const hrmsData = await fetchHRMSHierarchy()
  
  // Update users table
  for (const employee of hrmsData) {
    db.prepare(`
      UPDATE users 
      SET director_id = ?, department = ?, line_of_service = ?
      WHERE email = ?
    `).run(
      employee.manager_id,
      employee.department,
      employee.line_of_service,
      employee.email
    )
  }
}

// Use in workflow rules
const workflowRule = {
  condition: "user.role === 'Requester' AND user.director_id IS NOT NULL",
  action: "setStatus('Pending Director Approval')"
}
```

---

### 4.2 Client Data

**Current**: Clients from PRMS
**LC/NC Approach**: Use client attributes in rules

**Example Rule**:
```
IF client.client_type === 'PIE' 
AND service_type === 'Advisory'
THEN Block
REASON: 'PIE clients cannot receive Advisory services'
```

---

## 5. PROTOTYPE IMPLEMENTATION PLAN

### Week 1-2: Form Builder MVP
- [ ] Create `form_fields_config` table
- [ ] Build simple form builder UI (drag-drop fields)
- [ ] Create dynamic form renderer
- [ ] Test: Add field, render in form

### Week 3-4: Workflow Designer MVP
- [ ] Create `workflow_config` table
- [ ] Build simple workflow designer UI
- [ ] Update workflow engine to use config
- [ ] Test: Add step, change order

### Week 5-6: Rule Builder MVP
- [ ] Create `business_rules_config` table
- [ ] Build rule builder UI
- [ ] Create rule engine
- [ ] Test: Add rule, apply to requests

### Week 7-8: Integration & Polish
- [ ] Integrate with HRMS/PRMS sync
- [ ] Add validation
- [ ] Add audit logging
- [ ] User testing

---

## 6. EXAMPLE: COMPLETE LC/NC FLOW

### Scenario: Add "Risk Assessment" Field for PIE Clients

**Step 1: Admin Opens Form Builder**
```
Admin → Configuration → Form Builder
```

**Step 2: Add Field**
```
1. Drag "Text Area" field to form
2. Set properties:
   - Label: "Risk Assessment"
   - Field ID: "risk_assessment"
   - Required: Yes
   - Condition: Show if "pie_status === 'Yes'"
3. Save
```

**Step 3: System Updates**
```
- Field added to form_fields_config table
- Form renderer automatically shows field for PIE clients
- Validation applies automatically
- No code deployment needed
```

**Step 4: User Creates Request**
```
1. User selects PIE client
2. "Risk Assessment" field appears
3. User fills field
4. Form validates (required field)
5. Request submitted
```

---

## 7. TOOLS COMPARISON FOR PROTOTYPE

| Tool | Best For | Cost | Integration | Learning Curve |
|------|----------|------|-------------|----------------|
| **Custom Vue Components** | Forms, Workflows | Free | Native | Medium |
| **Form.io** | Forms | Free/Paid | Easy | Low |
| **Camunda** | Complex Workflows | Free/Paid | API | High |
| **Power Apps** | Forms (Azure) | Paid | Good | Medium |
| **Retool** | Admin Panels | Free/Paid | API | Low |

**Recommendation for Prototype**: 
- Start with **Custom Vue Components** (full control, no licensing)
- Consider **Form.io** if form builder becomes complex
- Use **Camunda** only if workflows become very complex (BPMN)

---

## 8. QUICK START: SIMPLE FORM BUILDER

### 8.1 Database Table
```sql
CREATE TABLE form_fields_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section VARCHAR(50),
    field_id VARCHAR(100) UNIQUE,
    field_type VARCHAR(50),
    label VARCHAR(255),
    required BOOLEAN DEFAULT 0,
    options TEXT, -- JSON
    conditions TEXT, -- JSON
    display_order INTEGER
);
```

### 8.2 Admin UI Component
```vue
<!-- FormBuilder.vue -->
<template>
  <div>
    <h2>Form Builder</h2>
    <button @click="addField">+ Add Field</button>
    <div v-for="field in fields" :key="field.id">
      <input v-model="field.label" />
      <select v-model="field.field_type">
        <option>text</option>
        <option>textarea</option>
        <option>select</option>
      </select>
      <button @click="saveField(field)">Save</button>
    </div>
  </div>
</template>
```

### 8.3 Dynamic Form Renderer
```vue
<!-- DynamicForm.vue -->
<template>
  <div>
    <component
      v-for="field in formConfig"
      :key="field.field_id"
      :is="getComponent(field.field_type)"
      v-model="formData[field.field_id]"
      :field="field"
    />
  </div>
</template>

<script>
function getComponent(type) {
  const components = {
    'text': 'InputField',
    'textarea': 'TextareaField',
    'select': 'SelectField'
  }
  return components[type] || 'InputField'
}
</script>
```

---

## 9. BENEFITS FOR PROTOTYPE

### Immediate Benefits:
- ✅ Faster iteration (no code deployment)
- ✅ Business users can test changes
- ✅ Easy to demonstrate flexibility
- ✅ Shows production-ready approach

### Long-term Benefits:
- ✅ Reduced development costs
- ✅ Faster response to business needs
- ✅ Better user adoption (users feel ownership)
- ✅ Easier compliance (audit trail of changes)

---

## 10. RECOMMENDED APPROACH

### For Prototype:
1. **Start Simple**: Build basic form builder (Week 1-2)
2. **Add Workflow Designer**: Simple step builder (Week 3-4)
3. **Add Rule Builder**: Basic IF-THEN rules (Week 5-6)
4. **Integrate**: Connect to HRMS/PRMS data

### For Production:
1. **Enhance**: Add more field types, validation
2. **Scale**: Add versioning, rollback
3. **Optimize**: Performance, caching
4. **Extend**: Add more LC/NC components

---

## Summary

**Where to Use LC/NC**:
1. ✅ Form Builder (High Priority)
2. ✅ Workflow Designer (High Priority)
3. ✅ Rule Builder (High Priority)
4. ✅ Approval Options (Medium Priority)
5. ✅ Dashboard Builder (Medium Priority)

**How to Use**:
- Start with custom Vue components (prototype)
- Store configurations in database
- Render dynamically
- Integrate with HRMS/PRMS data

**Prototype Timeline**: 6-8 weeks for MVP

**ROI**: High - Enables business users to configure system without developers

