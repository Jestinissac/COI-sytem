# LC/NC Prototype Implementation Guide

## Quick Start: Build a Simple Form Builder (Prototype Level)

This guide shows how to implement a basic LC/NC form builder that works with HRMS/PRMS hierarchy data.

---

## 1. Database Schema (Simple)

```sql
-- Form Fields Configuration
CREATE TABLE form_fields_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id VARCHAR(50) NOT NULL,
    field_id VARCHAR(100) UNIQUE NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'textarea', 'select', 'date', 'number'
    field_label VARCHAR(255) NOT NULL,
    field_placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT 0,
    is_readonly BOOLEAN DEFAULT 0,
    default_value TEXT,
    options TEXT, -- JSON array for select: ["Option1", "Option2"]
    validation_rules TEXT, -- JSON: {"min": 1, "max": 100, "pattern": "..."}
    conditions TEXT, -- JSON: {"field": "pie_status", "operator": "equals", "value": "Yes"}
    display_order INTEGER,
    source_system VARCHAR(50), -- 'HRMS', 'PRMS', 'COI', 'manual'
    source_field VARCHAR(100), -- e.g., 'user.name', 'client.client_name'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflow Configuration
CREATE TABLE workflow_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_name VARCHAR(100) NOT NULL DEFAULT 'default',
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_status VARCHAR(100) NOT NULL,
    required_role VARCHAR(50),
    is_required BOOLEAN DEFAULT 1,
    conditions TEXT, -- JSON: when to show this step
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_name, step_order)
);

-- Business Rules Configuration
CREATE TABLE business_rules_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'validation', 'workflow', 'conflict'
    condition_field VARCHAR(100),
    condition_operator VARCHAR(50), -- 'equals', 'contains', 'greater_than'
    condition_value TEXT,
    action_type VARCHAR(50), -- 'block', 'flag', 'require_approval', 'set_status'
    action_value TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Simple Form Builder Component

### 2.1 Admin UI: Form Builder

```vue
<!-- frontend/src/views/FormBuilder.vue -->
<template>
  <div class="form-builder">
    <div class="builder-header">
      <h2>Form Builder</h2>
      <button @click="saveForm" class="btn-primary">Save Form</button>
    </div>

    <div class="builder-layout">
      <!-- Left: Field Types Palette -->
      <div class="field-palette">
        <h3>Field Types</h3>
        <div 
          v-for="type in fieldTypes" 
          :key="type.value"
          class="field-type-item"
          draggable="true"
          @dragstart="handleDragStart(type)"
        >
          <span class="icon">{{ type.icon }}</span>
          <span>{{ type.label }}</span>
        </div>
      </div>

      <!-- Center: Form Canvas -->
      <div class="form-canvas" @drop="handleDrop" @dragover.prevent>
        <div class="section" v-for="section in sections" :key="section.id">
          <div class="section-header">
            <h4>{{ section.label }}</h4>
            <button @click="addFieldToSection(section.id)">+ Add Field</button>
          </div>
          
          <div class="fields-list">
            <div 
              v-for="field in getFieldsForSection(section.id)" 
              :key="field.id"
              class="field-item"
              @click="editField(field)"
            >
              <div class="field-preview">
                <label>{{ field.field_label }}</label>
                <component 
                  :is="getFieldPreviewComponent(field.field_type)"
                  :field="field"
                />
              </div>
              <div class="field-actions">
                <button @click.stop="editField(field)">Edit</button>
                <button @click.stop="deleteField(field.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Field Properties Editor -->
      <div class="properties-panel" v-if="selectedField">
        <h3>Field Properties</h3>
        <div class="property-group">
          <label>Field Label</label>
          <input v-model="selectedField.field_label" />
        </div>
        
        <div class="property-group">
          <label>Field Type</label>
          <select v-model="selectedField.field_type">
            <option value="text">Text</option>
            <option value="textarea">Textarea</option>
            <option value="select">Dropdown</option>
            <option value="date">Date</option>
            <option value="number">Number</option>
          </select>
        </div>

        <div class="property-group">
          <label>Required</label>
          <input type="checkbox" v-model="selectedField.is_required" />
        </div>

        <div class="property-group" v-if="selectedField.field_type === 'select'">
          <label>Options (one per line)</label>
          <textarea 
            v-model="optionsText" 
            rows="5"
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
        </div>

        <div class="property-group">
          <label>Data Source</label>
          <select v-model="selectedField.source_system">
            <option value="manual">Manual Entry</option>
            <option value="HRMS">HRMS</option>
            <option value="PRMS">PRMS</option>
            <option value="COI">COI System</option>
          </select>
        </div>

        <div class="property-group" v-if="selectedField.source_system !== 'manual'">
          <label>Source Field</label>
          <input 
            v-model="selectedField.source_field" 
            :placeholder="getSourceFieldPlaceholder(selectedField.source_system)"
          />
          <small>e.g., user.name, client.client_name, user.director.name</small>
        </div>

        <div class="property-group">
          <label>Conditional Display</label>
          <div class="condition-builder">
            <select v-model="conditionField">
              <option value="">No condition</option>
              <option v-for="f in allFields" :key="f.id" :value="f.field_id">
                {{ f.field_label }}
              </option>
            </select>
            <select v-if="conditionField" v-model="conditionOperator">
              <option value="equals">Equals</option>
              <option value="not_equals">Not Equals</option>
              <option value="contains">Contains</option>
            </select>
            <input 
              v-if="conditionField" 
              v-model="conditionValue" 
              placeholder="Value"
            />
          </div>
        </div>

        <button @click="saveFieldProperties" class="btn-primary">Save Properties</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const sections = ref([
  { id: 'section-1', label: 'Requestor Info' },
  { id: 'section-2', label: 'Document Type' },
  { id: 'section-3', label: 'Client Details' },
  { id: 'section-4', label: 'Service Info' },
  { id: 'section-5', label: 'Ownership' },
  { id: 'section-6', label: 'Signatories' },
  { id: 'section-7', label: 'International' }
])

const fields = ref<any[]>([])
const selectedField = ref<any>(null)
const allFields = computed(() => fields.value)

const fieldTypes = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'textarea', label: 'Textarea', icon: '📄' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'number', label: 'Number', icon: '🔢' }
]

const conditionField = ref('')
const conditionOperator = ref('equals')
const conditionValue = ref('')
const optionsText = ref('')

function getFieldsForSection(sectionId: string) {
  return fields.value.filter(f => f.section_id === sectionId)
    .sort((a, b) => a.display_order - b.display_order)
}

function handleDragStart(type: any) {
  // Store dragged field type
  event.dataTransfer.setData('fieldType', type.value)
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const fieldType = event.dataTransfer.getData('fieldType')
  if (fieldType) {
    addNewField(fieldType, 'section-1') // Default to first section
  }
}

function addNewField(fieldType: string, sectionId: string) {
  const newField = {
    id: Date.now(),
    section_id: sectionId,
    field_id: `field_${Date.now()}`,
    field_type: fieldType,
    field_label: 'New Field',
    is_required: false,
    is_readonly: false,
    source_system: 'manual',
    source_field: '',
    display_order: fields.value.length + 1
  }
  fields.value.push(newField)
  editField(newField)
}

function editField(field: any) {
  selectedField.value = { ...field }
  if (field.options) {
    optionsText.value = JSON.parse(field.options).join('\n')
  }
  if (field.conditions) {
    const cond = JSON.parse(field.conditions)
    conditionField.value = cond.field || ''
    conditionOperator.value = cond.operator || 'equals'
    conditionValue.value = cond.value || ''
  }
}

function saveFieldProperties() {
  if (!selectedField.value) return

  // Update options
  if (selectedField.value.field_type === 'select' && optionsText.value) {
    selectedField.value.options = JSON.stringify(
      optionsText.value.split('\n').filter(o => o.trim())
    )
  }

  // Update conditions
  if (conditionField.value) {
    selectedField.value.conditions = JSON.stringify({
      field: conditionField.value,
      operator: conditionOperator.value,
      value: conditionValue.value
    })
  } else {
    selectedField.value.conditions = null
  }

  // Update in fields array
  const index = fields.value.findIndex(f => f.id === selectedField.value.id)
  if (index >= 0) {
    fields.value[index] = { ...selectedField.value }
  }

  selectedField.value = null
}

async function saveForm() {
  try {
    await api.post('/config/form-fields', { fields: fields.value })
    alert('Form saved successfully!')
  } catch (error) {
    alert('Failed to save form')
  }
}

function getSourceFieldPlaceholder(system: string) {
  const placeholders: Record<string, string> = {
    'HRMS': 'user.name, user.director.name, user.department',
    'PRMS': 'client.client_name, client.client_code, client.status',
    'COI': 'request.request_id, request.status'
  }
  return placeholders[system] || ''
}

function getFieldPreviewComponent(type: string) {
  const components: Record<string, string> = {
    'text': 'InputPreview',
    'textarea': 'TextareaPreview',
    'select': 'SelectPreview',
    'date': 'DatePreview',
    'number': 'NumberPreview'
  }
  return components[type] || 'InputPreview'
}

onMounted(async () => {
  try {
    const response = await api.get('/config/form-fields')
    fields.value = response.data.fields || []
  } catch (error) {
    console.error('Failed to load form fields:', error)
  }
})
</script>
```

---

## 3. Dynamic Form Renderer

```vue
<!-- frontend/src/components/DynamicForm.vue -->
<template>
  <div class="dynamic-form">
    <div v-for="section in formSections" :key="section.id" class="form-section">
      <h3>{{ section.label }}</h3>
      
      <div 
        v-for="field in getFieldsForSection(section.id)" 
        :key="field.field_id"
        v-show="shouldShowField(field)"
        class="form-field"
      >
        <label :for="field.field_id">
          {{ field.field_label }}
          <span v-if="field.is_required" class="required">*</span>
        </label>
        
        <!-- Text Input -->
        <input
          v-if="field.field_type === 'text'"
          :id="field.field_id"
          v-model="formData[field.field_id]"
          :placeholder="field.field_placeholder"
          :required="field.is_required"
          :readonly="field.is_readonly || isFieldFromSystem(field)"
          class="form-control"
        />
        
        <!-- Textarea -->
        <textarea
          v-else-if="field.field_type === 'textarea'"
          :id="field.field_id"
          v-model="formData[field.field_id]"
          :placeholder="field.field_placeholder"
          :required="field.is_required"
          :readonly="field.is_readonly || isFieldFromSystem(field)"
          rows="3"
          class="form-control"
        />
        
        <!-- Select/Dropdown -->
        <select
          v-else-if="field.field_type === 'select'"
          :id="field.field_id"
          v-model="formData[field.field_id]"
          :required="field.is_required"
          :disabled="field.is_readonly || isFieldFromSystem(field)"
          class="form-control"
        >
          <option value="">{{ field.field_placeholder || 'Select...' }}</option>
          <option 
            v-for="option in getFieldOptions(field)" 
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
        
        <!-- Date -->
        <input
          v-else-if="field.field_type === 'date'"
          :id="field.field_id"
          v-model="formData[field.field_id]"
          type="date"
          :required="field.is_required"
          :readonly="field.is_readonly || isFieldFromSystem(field)"
          class="form-control"
        />
        
        <!-- Number -->
        <input
          v-else-if="field.field_type === 'number'"
          :id="field.field_id"
          v-model.number="formData[field.field_id]"
          type="number"
          :required="field.is_required"
          :readonly="field.is_readonly || isFieldFromSystem(field)"
          class="form-control"
        />
        
        <!-- Show source system indicator -->
        <small v-if="isFieldFromSystem(field)" class="source-indicator">
          {{ field.source_system }}: {{ field.source_field }}
        </small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  formData: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:formData', data: Record<string, any>): void
}>()

const authStore = useAuthStore()
const formFields = ref<any[]>([])
const hrmsData = ref<any>({})
const prmsData = ref<any>({})

const sections = [
  { id: 'section-1', label: 'Requestor Info' },
  { id: 'section-2', label: 'Document Type' },
  { id: 'section-3', label: 'Client Details' },
  { id: 'section-4', label: 'Service Info' },
  { id: 'section-5', label: 'Ownership' },
  { id: 'section-6', label: 'Signatories' },
  { id: 'section-7', label: 'International' }
]

const formSections = computed(() => {
  return sections.filter(section => 
    formFields.value.some(f => f.section_id === section.id)
  )
})

function getFieldsForSection(sectionId: string) {
  return formFields.value
    .filter(f => f.section_id === sectionId)
    .sort((a, b) => a.display_order - b.display_order)
}

function shouldShowField(field: any): boolean {
  if (!field.conditions) return true
  
  try {
    const condition = JSON.parse(field.conditions)
    const fieldValue = props.formData[condition.field]
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue == condition.value
      case 'not_equals':
        return fieldValue != condition.value
      case 'contains':
        return String(fieldValue).includes(condition.value)
      default:
        return true
    }
  } catch {
    return true
  }
}

function isFieldFromSystem(field: any): boolean {
  return field.source_system && field.source_system !== 'manual'
}

function getFieldOptions(field: any): string[] {
  if (field.options) {
    try {
      return JSON.parse(field.options)
    } catch {
      return []
    }
  }
  return []
}

async function loadFieldValue(field: any) {
  if (!field.source_system || !field.source_field) return

  try {
    let value = null
    
    if (field.source_system === 'HRMS') {
      // Load from HRMS data
      const path = field.source_field.split('.')
      value = path.reduce((obj, key) => obj?.[key], hrmsData.value)
    } else if (field.source_system === 'PRMS') {
      // Load from PRMS data
      const path = field.source_field.split('.')
      value = path.reduce((obj, key) => obj?.[key], prmsData.value)
    } else if (field.source_system === 'COI') {
      // Load from COI system
      const path = field.source_field.split('.')
      value = path.reduce((obj, key) => obj?.[key], props.formData)
    }
    
    if (value !== null && value !== undefined) {
      emit('update:formData', {
        ...props.formData,
        [field.field_id]: value
      })
    }
  } catch (error) {
    console.error(`Failed to load ${field.source_system} field:`, error)
  }
}

onMounted(async () => {
  // Load form configuration
  try {
    const response = await api.get('/config/form-fields')
    formFields.value = response.data.fields || []
  } catch (error) {
    console.error('Failed to load form fields:', error)
  }

  // Load HRMS data for current user
  try {
    const hrmsResponse = await api.get('/integration/hrms/user-data')
    hrmsData.value = hrmsResponse.data
  } catch (error) {
    console.error('Failed to load HRMS data:', error)
  }

  // Load PRMS data if client is selected
  if (props.formData.client_id) {
    try {
      const prmsResponse = await api.get(`/integration/prms/client/${props.formData.client_id}`)
      prmsData.value = prmsResponse.data
    } catch (error) {
      console.error('Failed to load PRMS data:', error)
    }
  }

  // Auto-populate fields from HRMS/PRMS
  formFields.value.forEach(field => {
    if (isFieldFromSystem(field)) {
      loadFieldValue(field)
    }
  })
})

// Watch for client changes to reload PRMS data
watch(() => props.formData.client_id, async (newClientId) => {
  if (newClientId) {
    try {
      const prmsResponse = await api.get(`/integration/prms/client/${newClientId}`)
      prmsData.value = prmsResponse.data
      
      // Reload PRMS-sourced fields
      formFields.value
        .filter(f => f.source_system === 'PRMS')
        .forEach(field => loadFieldValue(field))
    } catch (error) {
      console.error('Failed to load PRMS data:', error)
    }
  }
})
</script>
```

---

## 4. Backend API for Configuration

```javascript
// backend/src/controllers/configController.js
import { getDatabase } from '../database/init.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const db = getDatabase()

export async function getFormFields(req, res) {
  try {
    const fields = db.prepare(`
      SELECT * FROM form_fields_config 
      ORDER BY section_id, display_order
    `).all()
    
    res.json({ fields })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function saveFormFields(req, res) {
  try {
    const { fields } = req.body
    
    // Clear existing fields
    db.prepare('DELETE FROM form_fields_config').run()
    
    // Insert new fields
    const stmt = db.prepare(`
      INSERT INTO form_fields_config (
        section_id, field_id, field_type, field_label, field_placeholder,
        is_required, is_readonly, default_value, options, validation_rules,
        conditions, display_order, source_system, source_field
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (const field of fields) {
      stmt.run(
        field.section_id,
        field.field_id,
        field.field_type,
        field.field_label,
        field.field_placeholder || null,
        field.is_required ? 1 : 0,
        field.is_readonly ? 1 : 0,
        field.default_value || null,
        field.options || null,
        field.validation_rules || null,
        field.conditions || null,
        field.display_order || 0,
        field.source_system || 'manual',
        field.source_field || null
      )
    }
    
    res.json({ success: true, message: 'Form fields saved' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getWorkflowConfig(req, res) {
  try {
    const { workflowName = 'default' } = req.query
    const steps = db.prepare(`
      SELECT * FROM workflow_config 
      WHERE workflow_name = ?
      ORDER BY step_order
    `).all(workflowName)
    
    res.json({ workflow: steps })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function saveWorkflowConfig(req, res) {
  try {
    const { workflowName = 'default', steps } = req.body
    
    // Clear existing workflow
    db.prepare('DELETE FROM workflow_config WHERE workflow_name = ?').run(workflowName)
    
    // Insert new steps
    const stmt = db.prepare(`
      INSERT INTO workflow_config (
        workflow_name, step_order, step_name, step_status, 
        required_role, is_required, conditions
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (const step of steps) {
      stmt.run(
        workflowName,
        step.step_order,
        step.step_name,
        step.step_status,
        step.required_role || null,
        step.is_required ? 1 : 0,
        step.conditions ? JSON.stringify(step.conditions) : null
      )
    }
    
    res.json({ success: true, message: 'Workflow saved' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

---

## 5. Integration with HRMS/PRMS

```javascript
// backend/src/controllers/integrationController.js

export async function getHRMSUserData(req, res) {
  try {
    const userId = req.userId
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    
    // In production, this would query HRMS
    // For prototype, return mock data or cached data
    const hrmsData = {
      user: {
        name: user.name,
        email: user.email,
        department: user.department,
        designation: user.line_of_service
      },
      director: user.director_id ? (() => {
        const director = db.prepare('SELECT * FROM users WHERE id = ?').get(user.director_id)
        return {
          name: director.name,
          email: director.email
        }
      })() : null,
      hierarchy: {
        // Could include manager chain, department structure, etc.
      }
    }
    
    res.json(hrmsData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getPRMSClientData(req, res) {
  try {
    const { clientId } = req.params
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
    
    // In production, this would query PRMS
    const prmsData = {
      client: {
        client_name: client.client_name,
        client_code: client.client_code,
        status: client.status,
        industry: client.industry
      },
      parent_company: client.parent_company_id ? (() => {
        const parent = db.prepare('SELECT * FROM clients WHERE id = ?').get(client.parent_company_id)
        return {
          client_name: parent.client_name,
          client_code: parent.client_code
        }
      })() : null
    }
    
    res.json(prmsData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

---

## 6. Usage in COIRequestForm

```vue
<!-- Replace hardcoded form with DynamicForm -->
<template>
  <div class="coi-request-form">
    <!-- Use DynamicForm instead of hardcoded sections -->
    <DynamicForm 
      v-model="formData"
      @update:formData="formData = $event"
    />
  </div>
</template>

<script setup lang="ts">
import DynamicForm from '@/components/DynamicForm.vue'
// ... rest of component
</script>
```

---

## 7. Benefits at Prototype Level

### Immediate Benefits:
1. ✅ **Show Flexibility**: Demonstrate that system can adapt to changes
2. ✅ **Faster Iteration**: Test form changes without code deployment
3. ✅ **Business User Testing**: Let stakeholders modify forms themselves
4. ✅ **HRMS/PRMS Integration**: Show how data flows from external systems

### Prototype Demonstration:
- Admin adds "Risk Assessment" field via UI
- Field appears in form immediately
- Field auto-populates from HRMS/PRMS if configured
- No code changes needed

---

## 8. Next Steps

1. **Week 1**: Implement basic form builder (drag-drop fields)
2. **Week 2**: Add HRMS/PRMS data source integration
3. **Week 3**: Add conditional field display
4. **Week 4**: Add workflow designer
5. **Week 5-6**: Testing and refinement

---

## Summary

**LC/NC Components for Prototype**:
- ✅ Form Builder (High Priority)
- ✅ Dynamic Form Renderer
- ✅ HRMS/PRMS Data Integration
- ✅ Workflow Designer (Next Phase)
- ✅ Rule Builder (Next Phase)

**Key Feature**: Fields can be sourced from HRMS/PRMS, showing real integration capability even at prototype level.


## Quick Start: Build a Simple Form Builder (Prototype Level)

This guide shows how to implement a basic LC/NC form builder that works with HRMS/PRMS hierarchy data.

---

## 1. Database Schema (Simple)

```sql
-- Form Fields Configuration
CREATE TABLE form_fields_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id VARCHAR(50) NOT NULL,
    field_id VARCHAR(100) UNIQUE NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'textarea', 'select', 'date', 'number'
    field_label VARCHAR(255) NOT NULL,
    field_placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT 0,
    is_readonly BOOLEAN DEFAULT 0,
    default_value TEXT,
    options TEXT, -- JSON array for select: ["Option1", "Option2"]
    validation_rules TEXT, -- JSON: {"min": 1, "max": 100, "pattern": "..."}
    conditions TEXT, -- JSON: {"field": "pie_status", "operator": "equals", "value": "Yes"}
    display_order INTEGER,
    source_system VARCHAR(50), -- 'HRMS', 'PRMS', 'COI', 'manual'
    source_field VARCHAR(100), -- e.g., 'user.name', 'client.client_name'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflow Configuration
CREATE TABLE workflow_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_name VARCHAR(100) NOT NULL DEFAULT 'default',
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_status VARCHAR(100) NOT NULL,
    required_role VARCHAR(50),
    is_required BOOLEAN DEFAULT 1,
    conditions TEXT, -- JSON: when to show this step
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_name, step_order)
);

-- Business Rules Configuration
CREATE TABLE business_rules_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'validation', 'workflow', 'conflict'
    condition_field VARCHAR(100),
    condition_operator VARCHAR(50), -- 'equals', 'contains', 'greater_than'
    condition_value TEXT,
    action_type VARCHAR(50), -- 'block', 'flag', 'require_approval', 'set_status'
    action_value TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Simple Form Builder Component

### 2.1 Admin UI: Form Builder

```vue
<!-- frontend/src/views/FormBuilder.vue -->
<template>
  <div class="form-builder">
    <div class="builder-header">
      <h2>Form Builder</h2>
      <button @click="saveForm" class="btn-primary">Save Form</button>
    </div>

    <div class="builder-layout">
      <!-- Left: Field Types Palette -->
      <div class="field-palette">
        <h3>Field Types</h3>
        <div 
          v-for="type in fieldTypes" 
          :key="type.value"
          class="field-type-item"
          draggable="true"
          @dragstart="handleDragStart(type)"
        >
          <span class="icon">{{ type.icon }}</span>
          <span>{{ type.label }}</span>
        </div>
      </div>

      <!-- Center: Form Canvas -->
      <div class="form-canvas" @drop="handleDrop" @dragover.prevent>
        <div class="section" v-for="section in sections" :key="section.id">
          <div class="section-header">
            <h4>{{ section.label }}</h4>
            <button @click="addFieldToSection(section.id)">+ Add Field</button>
          </div>
          
          <div class="fields-list">
            <div 
              v-for="field in getFieldsForSection(section.id)" 
              :key="field.id"
              class="field-item"
              @click="editField(field)"
            >
              <div class="field-preview">
                <label>{{ field.field_label }}</label>
                <component 
                  :is="getFieldPreviewComponent(field.field_type)"
                  :field="field"
                />
              </div>
              <div class="field-actions">
                <button @click.stop="editField(field)">Edit</button>
                <button @click.stop="deleteField(field.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Field Properties Editor -->
      <div class="properties-panel" v-if="selectedField">
        <h3>Field Properties</h3>
        <div class="property-group">
          <label>Field Label</label>
          <input v-model="selectedField.field_label" />
        </div>
        
        <div class="property-group">
          <label>Field Type</label>
          <select v-model="selectedField.field_type">
            <option value="text">Text</option>
            <option value="textarea">Textarea</option>
            <option value="select">Dropdown</option>
            <option value="date">Date</option>
            <option value="number">Number</option>
          </select>
        </div>

        <div class="property-group">
          <label>Required</label>
          <input type="checkbox" v-model="selectedField.is_required" />
        </div>

        <div class="property-group" v-if="selectedField.field_type === 'select'">
          <label>Options (one per line)</label>
          <textarea 
            v-model="optionsText" 
            rows="5"
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
        </div>

        <div class="property-group">
          <label>Data Source</label>
          <select v-model="selectedField.source_system">
            <option value="manual">Manual Entry</option>
            <option value="HRMS">HRMS</option>
            <option value="PRMS">PRMS</option>
            <option value="COI">COI System</option>
          </select>
        </div>

        <div class="property-group" v-if="selectedField.source_system !== 'manual'">
          <label>Source Field</label>
          <input 
            v-model="selectedField.source_field" 
            :placeholder="getSourceFieldPlaceholder(selectedField.source_system)"
          />
          <small>e.g., user.name, client.client_name, user.director.name</small>
        </div>

        <div class="property-group">
          <label>Conditional Display</label>
          <div class="condition-builder">
            <select v-model="conditionField">
              <option value="">No condition</option>
              <option v-for="f in allFields" :key="f.id" :value="f.field_id">
                {{ f.field_label }}
              </option>
            </select>
            <select v-if="conditionField" v-model="conditionOperator">
              <option value="equals">Equals</option>
              <option value="not_equals">Not Equals</option>
              <option value="contains">Contains</option>
            </select>
            <input 
              v-if="conditionField" 
              v-model="conditionValue" 
              placeholder="Value"
            />
          </div>
        </div>

        <button @click="saveFieldProperties" class="btn-primary">Save Properties</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const sections = ref([
  { id: 'section-1', label: 'Requestor Info' },
  { id: 'section-2', label: 'Document Type' },
  { id: 'section-3', label: 'Client Details' },
  { id: 'section-4', label: 'Service Info' },
  { id: 'section-5', label: 'Ownership' },
  { id: 'section-6', label: 'Signatories' },
  { id: 'section-7', label: 'International' }
])

const fields = ref<any[]>([])
const selectedField = ref<any>(null)
const allFields = computed(() => fields.value)

const fieldTypes = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'textarea', label: 'Textarea', icon: '📄' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'number', label: 'Number', icon: '🔢' }
]

const conditionField = ref('')
const conditionOperator = ref('equals')
const conditionValue = ref('')
const optionsText = ref('')

function getFieldsForSection(sectionId: string) {
  return fields.value.filter(f => f.section_id === sectionId)
    .sort((a, b) => a.display_order - b.display_order)
}

function handleDragStart(type: any) {
  // Store dragged field type
  event.dataTransfer.setData('fieldType', type.value)
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const fieldType = event.dataTransfer.getData('fieldType')
  if (fieldType) {
    addNewField(fieldType, 'section-1') // Default to first section
  }
}

function addNewField(fieldType: string, sectionId: string) {
  const newField = {
    id: Date.now(),
    section_id: sectionId,
    field_id: `field_${Date.now()}`,
    field_type: fieldType,
    field_label: 'New Field',
    is_required: false,
    is_readonly: false,
    source_system: 'manual',
    source_field: '',
    display_order: fields.value.length + 1
  }
  fields.value.push(newField)
  editField(newField)
}

function editField(field: any) {
  selectedField.value = { ...field }
  if (field.options) {
    optionsText.value = JSON.parse(field.options).join('\n')
  }
  if (field.conditions) {
    const cond = JSON.parse(field.conditions)
    conditionField.value = cond.field || ''
    conditionOperator.value = cond.operator || 'equals'
    conditionValue.value = cond.value || ''
  }
}

function saveFieldProperties() {
  if (!selectedField.value) return

  // Update options
  if (selectedField.value.field_type === 'select' && optionsText.value) {
    selectedField.value.options = JSON.stringify(
      optionsText.value.split('\n').filter(o => o.trim())
    )
  }

  // Update conditions
  if (conditionField.value) {
    selectedField.value.conditions = JSON.stringify({
      field: conditionField.value,
      operator: conditionOperator.value,
      value: conditionValue.value
    })
  } else {
    selectedField.value.conditions = null
  }

  // Update in fields array
  const index = fields.value.findIndex(f => f.id === selectedField.value.id)
  if (index >= 0) {
    fields.value[index] = { ...selectedField.value }
  }

  selectedField.value = null
}

async function saveForm() {
  try {
    await api.post('/config/form-fields', { fields: fields.value })
    alert('Form saved successfully!')
  } catch (error) {
    alert('Failed to save form')
  }
}

function getSourceFieldPlaceholder(system: string) {
  const placeholders: Record<string, string> = {
    'HRMS': 'user.name, user.director.name, user.department',
    'PRMS': 'client.client_name, client.client_code, client.status',
    'COI': 'request.request_id, request.status'
  }
  return placeholders[system] || ''
}

function getFieldPreviewComponent(type: string) {
  const components: Record<string, string> = {
    'text': 'InputPreview',
    'textarea': 'TextareaPreview',
    'select': 'SelectPreview',
    'date': 'DatePreview',
    'number': 'NumberPreview'
  }
  return components[type] || 'InputPreview'
}

onMounted(async () => {
  try {
    const response = await api.get('/config/form-fields')
    fields.value = response.data.fields || []
  } catch (error) {
    console.error('Failed to load form fields:', error)
  }
})
</script>
```

---

## 3. Dynamic Form Renderer

```vue
<!-- frontend/src/components/DynamicForm.vue -->
<template>
  <div class="dynamic-form">
    <div v-for="section in formSections" :key="section.id" class="form-section">
      <h3>{{ section.label }}</h3>
      
      <div 
        v-for="field in getFieldsForSection(section.id)" 
        :key="field.field_id"
        v-show="shouldShowField(field)"
        class="form-field"
      >
        <label :for="field.field_id">
          {{ field.field_label }}
          <span v-if="field.is_required" class="required">*</span>
        </label>
        
        <!-- Text Input -->
        <input
          v-if="field.field_type === 'text'"
          :id="field.field_id"
          v-model="formData[field.field_id]"
          :placeholder="field.field_placeholder"
          :required="field.is_required"
          :readonly="field.is_readonly || isFieldFromSystem(field)"
          class="form-control"
        />
        
        <!-- Textarea -->
        <textarea
          v-else-if="field.field_type === 'textarea'"
          :id="field.field_id"
          v-model="formData[field.field_id]"
          :placeholder="field.field_placeholder"
          :required="field.is_required"
          :readonly="field.is_readonly || isFieldFromSystem(field)"
          rows="3"
          class="form-control"
        />
        
        <!-- Select/Dropdown -->
        <select
          v-else-if="field.field_type === 'select'"
          :id="field.field_id"
          v-model="formData[field.field_id]"
          :required="field.is_required"
          :disabled="field.is_readonly || isFieldFromSystem(field)"
          class="form-control"
        >
          <option value="">{{ field.field_placeholder || 'Select...' }}</option>
          <option 
            v-for="option in getFieldOptions(field)" 
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
        
        <!-- Date -->
        <input
          v-else-if="field.field_type === 'date'"
          :id="field.field_id"
          v-model="formData[field.field_id]"
          type="date"
          :required="field.is_required"
          :readonly="field.is_readonly || isFieldFromSystem(field)"
          class="form-control"
        />
        
        <!-- Number -->
        <input
          v-else-if="field.field_type === 'number'"
          :id="field.field_id"
          v-model.number="formData[field.field_id]"
          type="number"
          :required="field.is_required"
          :readonly="field.is_readonly || isFieldFromSystem(field)"
          class="form-control"
        />
        
        <!-- Show source system indicator -->
        <small v-if="isFieldFromSystem(field)" class="source-indicator">
          {{ field.source_system }}: {{ field.source_field }}
        </small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  formData: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:formData', data: Record<string, any>): void
}>()

const authStore = useAuthStore()
const formFields = ref<any[]>([])
const hrmsData = ref<any>({})
const prmsData = ref<any>({})

const sections = [
  { id: 'section-1', label: 'Requestor Info' },
  { id: 'section-2', label: 'Document Type' },
  { id: 'section-3', label: 'Client Details' },
  { id: 'section-4', label: 'Service Info' },
  { id: 'section-5', label: 'Ownership' },
  { id: 'section-6', label: 'Signatories' },
  { id: 'section-7', label: 'International' }
]

const formSections = computed(() => {
  return sections.filter(section => 
    formFields.value.some(f => f.section_id === section.id)
  )
})

function getFieldsForSection(sectionId: string) {
  return formFields.value
    .filter(f => f.section_id === sectionId)
    .sort((a, b) => a.display_order - b.display_order)
}

function shouldShowField(field: any): boolean {
  if (!field.conditions) return true
  
  try {
    const condition = JSON.parse(field.conditions)
    const fieldValue = props.formData[condition.field]
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue == condition.value
      case 'not_equals':
        return fieldValue != condition.value
      case 'contains':
        return String(fieldValue).includes(condition.value)
      default:
        return true
    }
  } catch {
    return true
  }
}

function isFieldFromSystem(field: any): boolean {
  return field.source_system && field.source_system !== 'manual'
}

function getFieldOptions(field: any): string[] {
  if (field.options) {
    try {
      return JSON.parse(field.options)
    } catch {
      return []
    }
  }
  return []
}

async function loadFieldValue(field: any) {
  if (!field.source_system || !field.source_field) return

  try {
    let value = null
    
    if (field.source_system === 'HRMS') {
      // Load from HRMS data
      const path = field.source_field.split('.')
      value = path.reduce((obj, key) => obj?.[key], hrmsData.value)
    } else if (field.source_system === 'PRMS') {
      // Load from PRMS data
      const path = field.source_field.split('.')
      value = path.reduce((obj, key) => obj?.[key], prmsData.value)
    } else if (field.source_system === 'COI') {
      // Load from COI system
      const path = field.source_field.split('.')
      value = path.reduce((obj, key) => obj?.[key], props.formData)
    }
    
    if (value !== null && value !== undefined) {
      emit('update:formData', {
        ...props.formData,
        [field.field_id]: value
      })
    }
  } catch (error) {
    console.error(`Failed to load ${field.source_system} field:`, error)
  }
}

onMounted(async () => {
  // Load form configuration
  try {
    const response = await api.get('/config/form-fields')
    formFields.value = response.data.fields || []
  } catch (error) {
    console.error('Failed to load form fields:', error)
  }

  // Load HRMS data for current user
  try {
    const hrmsResponse = await api.get('/integration/hrms/user-data')
    hrmsData.value = hrmsResponse.data
  } catch (error) {
    console.error('Failed to load HRMS data:', error)
  }

  // Load PRMS data if client is selected
  if (props.formData.client_id) {
    try {
      const prmsResponse = await api.get(`/integration/prms/client/${props.formData.client_id}`)
      prmsData.value = prmsResponse.data
    } catch (error) {
      console.error('Failed to load PRMS data:', error)
    }
  }

  // Auto-populate fields from HRMS/PRMS
  formFields.value.forEach(field => {
    if (isFieldFromSystem(field)) {
      loadFieldValue(field)
    }
  })
})

// Watch for client changes to reload PRMS data
watch(() => props.formData.client_id, async (newClientId) => {
  if (newClientId) {
    try {
      const prmsResponse = await api.get(`/integration/prms/client/${newClientId}`)
      prmsData.value = prmsResponse.data
      
      // Reload PRMS-sourced fields
      formFields.value
        .filter(f => f.source_system === 'PRMS')
        .forEach(field => loadFieldValue(field))
    } catch (error) {
      console.error('Failed to load PRMS data:', error)
    }
  }
})
</script>
```

---

## 4. Backend API for Configuration

```javascript
// backend/src/controllers/configController.js
import { getDatabase } from '../database/init.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const db = getDatabase()

export async function getFormFields(req, res) {
  try {
    const fields = db.prepare(`
      SELECT * FROM form_fields_config 
      ORDER BY section_id, display_order
    `).all()
    
    res.json({ fields })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function saveFormFields(req, res) {
  try {
    const { fields } = req.body
    
    // Clear existing fields
    db.prepare('DELETE FROM form_fields_config').run()
    
    // Insert new fields
    const stmt = db.prepare(`
      INSERT INTO form_fields_config (
        section_id, field_id, field_type, field_label, field_placeholder,
        is_required, is_readonly, default_value, options, validation_rules,
        conditions, display_order, source_system, source_field
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (const field of fields) {
      stmt.run(
        field.section_id,
        field.field_id,
        field.field_type,
        field.field_label,
        field.field_placeholder || null,
        field.is_required ? 1 : 0,
        field.is_readonly ? 1 : 0,
        field.default_value || null,
        field.options || null,
        field.validation_rules || null,
        field.conditions || null,
        field.display_order || 0,
        field.source_system || 'manual',
        field.source_field || null
      )
    }
    
    res.json({ success: true, message: 'Form fields saved' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getWorkflowConfig(req, res) {
  try {
    const { workflowName = 'default' } = req.query
    const steps = db.prepare(`
      SELECT * FROM workflow_config 
      WHERE workflow_name = ?
      ORDER BY step_order
    `).all(workflowName)
    
    res.json({ workflow: steps })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function saveWorkflowConfig(req, res) {
  try {
    const { workflowName = 'default', steps } = req.body
    
    // Clear existing workflow
    db.prepare('DELETE FROM workflow_config WHERE workflow_name = ?').run(workflowName)
    
    // Insert new steps
    const stmt = db.prepare(`
      INSERT INTO workflow_config (
        workflow_name, step_order, step_name, step_status, 
        required_role, is_required, conditions
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (const step of steps) {
      stmt.run(
        workflowName,
        step.step_order,
        step.step_name,
        step.step_status,
        step.required_role || null,
        step.is_required ? 1 : 0,
        step.conditions ? JSON.stringify(step.conditions) : null
      )
    }
    
    res.json({ success: true, message: 'Workflow saved' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

---

## 5. Integration with HRMS/PRMS

```javascript
// backend/src/controllers/integrationController.js

export async function getHRMSUserData(req, res) {
  try {
    const userId = req.userId
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    
    // In production, this would query HRMS
    // For prototype, return mock data or cached data
    const hrmsData = {
      user: {
        name: user.name,
        email: user.email,
        department: user.department,
        designation: user.line_of_service
      },
      director: user.director_id ? (() => {
        const director = db.prepare('SELECT * FROM users WHERE id = ?').get(user.director_id)
        return {
          name: director.name,
          email: director.email
        }
      })() : null,
      hierarchy: {
        // Could include manager chain, department structure, etc.
      }
    }
    
    res.json(hrmsData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getPRMSClientData(req, res) {
  try {
    const { clientId } = req.params
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
    
    // In production, this would query PRMS
    const prmsData = {
      client: {
        client_name: client.client_name,
        client_code: client.client_code,
        status: client.status,
        industry: client.industry
      },
      parent_company: client.parent_company_id ? (() => {
        const parent = db.prepare('SELECT * FROM clients WHERE id = ?').get(client.parent_company_id)
        return {
          client_name: parent.client_name,
          client_code: parent.client_code
        }
      })() : null
    }
    
    res.json(prmsData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

---

## 6. Usage in COIRequestForm

```vue
<!-- Replace hardcoded form with DynamicForm -->
<template>
  <div class="coi-request-form">
    <!-- Use DynamicForm instead of hardcoded sections -->
    <DynamicForm 
      v-model="formData"
      @update:formData="formData = $event"
    />
  </div>
</template>

<script setup lang="ts">
import DynamicForm from '@/components/DynamicForm.vue'
// ... rest of component
</script>
```

---

## 7. Benefits at Prototype Level

### Immediate Benefits:
1. ✅ **Show Flexibility**: Demonstrate that system can adapt to changes
2. ✅ **Faster Iteration**: Test form changes without code deployment
3. ✅ **Business User Testing**: Let stakeholders modify forms themselves
4. ✅ **HRMS/PRMS Integration**: Show how data flows from external systems

### Prototype Demonstration:
- Admin adds "Risk Assessment" field via UI
- Field appears in form immediately
- Field auto-populates from HRMS/PRMS if configured
- No code changes needed

---

## 8. Next Steps

1. **Week 1**: Implement basic form builder (drag-drop fields)
2. **Week 2**: Add HRMS/PRMS data source integration
3. **Week 3**: Add conditional field display
4. **Week 4**: Add workflow designer
5. **Week 5-6**: Testing and refinement

---

## Summary

**LC/NC Components for Prototype**:
- ✅ Form Builder (High Priority)
- ✅ Dynamic Form Renderer
- ✅ HRMS/PRMS Data Integration
- ✅ Workflow Designer (Next Phase)
- ✅ Rule Builder (Next Phase)

**Key Feature**: Fields can be sourced from HRMS/PRMS, showing real integration capability even at prototype level.

