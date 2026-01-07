# Dynamic Form Database Consistency Analysis

## 🔴 Current Architecture Issues

### Problem 1: Field ID to Column Mapping Mismatch

**Current Situation:**
- `DynamicForm.vue` uses `field_id` from `form_fields_config` (e.g., `field_id: 'custom_field_1'`)
- `coi_requests` table has **fixed columns** (e.g., `requestor_name`, `designation`, `entity`)
- Backend `createRequest()` expects specific column names

**What Happens:**
```javascript
// DynamicForm binds to: formData['custom_field_1']
// But backend tries to save to: coi_requests.custom_field_1 (column doesn't exist!)
// Result: Data is lost or causes SQL error
```

### Problem 2: New Fields Added to Config

**Scenario:**
1. Admin adds new field `field_id: 'new_requirement'` in Form Builder
2. User fills form with this field
3. Backend tries to save `data.new_requirement` to `coi_requests.new_requirement`
4. **Column doesn't exist** → Data lost or error

### Problem 3: Fields Removed from Config

**Scenario:**
1. Request created with field `field_id: 'old_field'`
2. Admin removes `old_field` from config
3. Old requests still have data in `coi_requests.old_field` column
4. **Data becomes orphaned** (no way to display it)

### Problem 4: Field ID Changed

**Scenario:**
1. Request created with `field_id: 'client_location'`
2. Admin renames to `field_id: 'location'`
3. Old requests have data in `client_location` column
4. New form expects `location` column
5. **Data mismatch** → Inconsistency

---

## ✅ Solutions

### Solution 1: Field Mapping Table (Recommended)

Create a mapping between `field_id` and database columns.

**Database Schema:**
```sql
CREATE TABLE form_field_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id VARCHAR(100) UNIQUE NOT NULL,
    db_column VARCHAR(100) NOT NULL,
    data_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'boolean', 'json'
    is_custom BOOLEAN DEFAULT 0, -- Custom fields stored in JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Backend Logic:**
```javascript
// Map field_id to db_column before saving
const fieldMappings = getFieldMappings() // Load from DB
const dbData = {}

fields.forEach(field => {
  const mapping = fieldMappings[field.field_id]
  if (mapping) {
    if (mapping.is_custom) {
      // Store in JSON column
      dbData.custom_fields = dbData.custom_fields || {}
      dbData.custom_fields[field.field_id] = formData[field.field_id]
    } else {
      // Store in mapped column
      dbData[mapping.db_column] = formData[field.field_id]
    }
  }
})
```

### Solution 2: JSON Storage for Dynamic Fields

Add a JSON column to store dynamic/custom fields.

**Database Schema:**
```sql
ALTER TABLE coi_requests ADD COLUMN custom_fields TEXT; -- JSON storage
ALTER TABLE coi_requests ADD COLUMN form_version INTEGER DEFAULT 1; -- Track form version
```

**Backend Logic:**
```javascript
// Separate standard fields from custom fields
const standardFields = {
  requestor_name: data.requestor_name,
  designation: data.designation,
  // ... known columns
}

const customFields = {}
const fieldMappings = getFieldMappings()

Object.keys(data).forEach(key => {
  const mapping = fieldMappings[key]
  if (mapping && mapping.is_custom) {
    customFields[key] = data[key]
  }
})

// Save standard fields to columns
// Save custom fields to JSON
db.prepare(`
  INSERT INTO coi_requests (..., custom_fields, form_version)
  VALUES (..., ?, ?)
`).run(JSON.stringify(customFields), currentFormVersion)
```

### Solution 3: Form Versioning

Track which form version was used to create each request.

**Database Schema:**
```sql
CREATE TABLE form_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_number INTEGER UNIQUE NOT NULL,
    form_config_snapshot TEXT, -- JSON snapshot of form_fields_config
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE coi_requests ADD COLUMN form_version_id INTEGER;
```

**Backend Logic:**
```javascript
// When saving form config, create version snapshot
const version = db.prepare(`
  INSERT INTO form_versions (version_number, form_config_snapshot)
  VALUES (?, ?)
`).run(nextVersion, JSON.stringify(allFields))

// When creating request, save version
db.prepare(`
  INSERT INTO coi_requests (..., form_version_id)
  VALUES (..., ?)
`).run(version.lastInsertRowid)

// When loading request, use correct form version
const request = getRequest(id)
const formVersion = getFormVersion(request.form_version_id)
// Render form using formVersion.form_config_snapshot
```

---

## 🛡️ Recommended Implementation

### Hybrid Approach: Standard Fields + JSON for Custom

**1. Keep Standard Fields as Columns:**
- Core fields (requestor_name, designation, service_type, etc.) stay as columns
- These are stable and won't change often

**2. Use JSON for Dynamic Fields:**
- New/custom fields stored in `custom_fields` JSON column
- Allows flexibility without schema changes

**3. Field Mapping:**
- Map `field_id` to either:
  - Standard column name (if exists)
  - Custom field in JSON (if new)

**Implementation:**

```javascript
// backend/src/controllers/coiController.js

// Standard field mappings (field_id -> db_column)
const STANDARD_FIELD_MAPPINGS = {
  'requestor_name': 'requestor_name',
  'designation': 'designation',
  'entity': 'entity',
  'line_of_service': 'line_of_service',
  'requested_document': 'requested_document',
  'language': 'language',
  'client_id': 'client_id',
  'client_type': 'client_type',
  'client_location': 'client_location',
  'relationship_with_client': 'relationship_with_client',
  'regulated_body': 'regulated_body',
  'pie_status': 'pie_status',
  'parent_company': 'parent_company',
  'service_type': 'service_type',
  'service_category': 'service_category',
  'service_description': 'service_description',
  'requested_service_period_start': 'requested_service_period_start',
  'requested_service_period_end': 'requested_service_period_end',
  'full_ownership_structure': 'full_ownership_structure',
  'related_affiliated_entities': 'related_affiliated_entities',
  'international_operations': 'international_operations',
  'foreign_subsidiaries': 'foreign_subsidiaries',
  'global_clearance_status': 'global_clearance_status'
}

export async function createRequest(req, res) {
  const data = req.body
  
  // Separate standard and custom fields
  const standardData = {}
  const customFields = {}
  
  Object.keys(data).forEach(key => {
    if (STANDARD_FIELD_MAPPINGS[key]) {
      standardData[STANDARD_FIELD_MAPPINGS[key]] = data[key]
    } else {
      // Custom field - store in JSON
      customFields[key] = data[key]
    }
  })
  
  // Save standard fields to columns
  const result = db.prepare(`
    INSERT INTO coi_requests (
      request_id, client_id, requester_id, department,
      requestor_name, designation, entity, line_of_service,
      requested_document, language,
      parent_company, client_location, relationship_with_client, client_type,
      service_type, service_description, requested_service_period_start, requested_service_period_end,
      full_ownership_structure, pie_status, related_affiliated_entities,
      international_operations, foreign_subsidiaries, global_clearance_status,
      custom_fields, form_version,
      status, stage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    requestId, standardData.client_id, user.id, user.department,
    standardData.requestor_name, standardData.designation, standardData.entity, standardData.line_of_service,
    standardData.requested_document, standardData.language,
    standardData.parent_company, standardData.client_location, standardData.relationship_with_client, standardData.client_type,
    standardData.service_type, standardData.service_description, standardData.requested_service_period_start, standardData.requested_service_period_end,
    standardData.full_ownership_structure, standardData.pie_status, standardData.related_affiliated_entities,
    standardData.international_operations ? 1 : 0, standardData.foreign_subsidiaries, standardData.global_clearance_status,
    Object.keys(customFields).length > 0 ? JSON.stringify(customFields) : null,
    getCurrentFormVersion(), // Track form version
    'Draft', 'Proposal'
  )
  
  res.json({ id: result.lastInsertRowid, request_id: requestId })
}
```

---

## 📋 Migration Steps

### Step 1: Add JSON Column
```sql
ALTER TABLE coi_requests ADD COLUMN custom_fields TEXT;
ALTER TABLE coi_requests ADD COLUMN form_version INTEGER DEFAULT 1;
```

### Step 2: Create Field Mapping Table
```sql
CREATE TABLE form_field_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id VARCHAR(100) UNIQUE NOT NULL,
    db_column VARCHAR(100),
    is_custom BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard mappings
INSERT INTO form_field_mappings (field_id, db_column, is_custom) VALUES
('requestor_name', 'requestor_name', 0),
('designation', 'designation', 0),
('entity', 'entity', 0),
-- ... all standard fields
```

### Step 3: Update Backend
- Modify `createRequest()` to use field mapping
- Store custom fields in JSON
- Track form version

### Step 4: Update Frontend
- `DynamicForm` can use any `field_id`
- Backend handles mapping automatically

---

## ✅ Benefits

1. **No Data Loss**: All fields saved (standard to columns, custom to JSON)
2. **Backward Compatible**: Existing requests still work
3. **Flexible**: Add new fields without schema changes
4. **Versioned**: Track which form version created each request
5. **Safe**: Field changes don't break existing data

---

## ⚠️ Current Risk

**Without these changes:**
- DynamicForm fields that don't match `coi_requests` columns will be **lost**
- New fields added to config won't be saved
- Field ID changes will cause data mismatches

**Recommendation:** Implement Solution 2 (JSON + Field Mapping) before using DynamicForm in production.


## 🔴 Current Architecture Issues

### Problem 1: Field ID to Column Mapping Mismatch

**Current Situation:**
- `DynamicForm.vue` uses `field_id` from `form_fields_config` (e.g., `field_id: 'custom_field_1'`)
- `coi_requests` table has **fixed columns** (e.g., `requestor_name`, `designation`, `entity`)
- Backend `createRequest()` expects specific column names

**What Happens:**
```javascript
// DynamicForm binds to: formData['custom_field_1']
// But backend tries to save to: coi_requests.custom_field_1 (column doesn't exist!)
// Result: Data is lost or causes SQL error
```

### Problem 2: New Fields Added to Config

**Scenario:**
1. Admin adds new field `field_id: 'new_requirement'` in Form Builder
2. User fills form with this field
3. Backend tries to save `data.new_requirement` to `coi_requests.new_requirement`
4. **Column doesn't exist** → Data lost or error

### Problem 3: Fields Removed from Config

**Scenario:**
1. Request created with field `field_id: 'old_field'`
2. Admin removes `old_field` from config
3. Old requests still have data in `coi_requests.old_field` column
4. **Data becomes orphaned** (no way to display it)

### Problem 4: Field ID Changed

**Scenario:**
1. Request created with `field_id: 'client_location'`
2. Admin renames to `field_id: 'location'`
3. Old requests have data in `client_location` column
4. New form expects `location` column
5. **Data mismatch** → Inconsistency

---

## ✅ Solutions

### Solution 1: Field Mapping Table (Recommended)

Create a mapping between `field_id` and database columns.

**Database Schema:**
```sql
CREATE TABLE form_field_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id VARCHAR(100) UNIQUE NOT NULL,
    db_column VARCHAR(100) NOT NULL,
    data_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'boolean', 'json'
    is_custom BOOLEAN DEFAULT 0, -- Custom fields stored in JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Backend Logic:**
```javascript
// Map field_id to db_column before saving
const fieldMappings = getFieldMappings() // Load from DB
const dbData = {}

fields.forEach(field => {
  const mapping = fieldMappings[field.field_id]
  if (mapping) {
    if (mapping.is_custom) {
      // Store in JSON column
      dbData.custom_fields = dbData.custom_fields || {}
      dbData.custom_fields[field.field_id] = formData[field.field_id]
    } else {
      // Store in mapped column
      dbData[mapping.db_column] = formData[field.field_id]
    }
  }
})
```

### Solution 2: JSON Storage for Dynamic Fields

Add a JSON column to store dynamic/custom fields.

**Database Schema:**
```sql
ALTER TABLE coi_requests ADD COLUMN custom_fields TEXT; -- JSON storage
ALTER TABLE coi_requests ADD COLUMN form_version INTEGER DEFAULT 1; -- Track form version
```

**Backend Logic:**
```javascript
// Separate standard fields from custom fields
const standardFields = {
  requestor_name: data.requestor_name,
  designation: data.designation,
  // ... known columns
}

const customFields = {}
const fieldMappings = getFieldMappings()

Object.keys(data).forEach(key => {
  const mapping = fieldMappings[key]
  if (mapping && mapping.is_custom) {
    customFields[key] = data[key]
  }
})

// Save standard fields to columns
// Save custom fields to JSON
db.prepare(`
  INSERT INTO coi_requests (..., custom_fields, form_version)
  VALUES (..., ?, ?)
`).run(JSON.stringify(customFields), currentFormVersion)
```

### Solution 3: Form Versioning

Track which form version was used to create each request.

**Database Schema:**
```sql
CREATE TABLE form_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_number INTEGER UNIQUE NOT NULL,
    form_config_snapshot TEXT, -- JSON snapshot of form_fields_config
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE coi_requests ADD COLUMN form_version_id INTEGER;
```

**Backend Logic:**
```javascript
// When saving form config, create version snapshot
const version = db.prepare(`
  INSERT INTO form_versions (version_number, form_config_snapshot)
  VALUES (?, ?)
`).run(nextVersion, JSON.stringify(allFields))

// When creating request, save version
db.prepare(`
  INSERT INTO coi_requests (..., form_version_id)
  VALUES (..., ?)
`).run(version.lastInsertRowid)

// When loading request, use correct form version
const request = getRequest(id)
const formVersion = getFormVersion(request.form_version_id)
// Render form using formVersion.form_config_snapshot
```

---

## 🛡️ Recommended Implementation

### Hybrid Approach: Standard Fields + JSON for Custom

**1. Keep Standard Fields as Columns:**
- Core fields (requestor_name, designation, service_type, etc.) stay as columns
- These are stable and won't change often

**2. Use JSON for Dynamic Fields:**
- New/custom fields stored in `custom_fields` JSON column
- Allows flexibility without schema changes

**3. Field Mapping:**
- Map `field_id` to either:
  - Standard column name (if exists)
  - Custom field in JSON (if new)

**Implementation:**

```javascript
// backend/src/controllers/coiController.js

// Standard field mappings (field_id -> db_column)
const STANDARD_FIELD_MAPPINGS = {
  'requestor_name': 'requestor_name',
  'designation': 'designation',
  'entity': 'entity',
  'line_of_service': 'line_of_service',
  'requested_document': 'requested_document',
  'language': 'language',
  'client_id': 'client_id',
  'client_type': 'client_type',
  'client_location': 'client_location',
  'relationship_with_client': 'relationship_with_client',
  'regulated_body': 'regulated_body',
  'pie_status': 'pie_status',
  'parent_company': 'parent_company',
  'service_type': 'service_type',
  'service_category': 'service_category',
  'service_description': 'service_description',
  'requested_service_period_start': 'requested_service_period_start',
  'requested_service_period_end': 'requested_service_period_end',
  'full_ownership_structure': 'full_ownership_structure',
  'related_affiliated_entities': 'related_affiliated_entities',
  'international_operations': 'international_operations',
  'foreign_subsidiaries': 'foreign_subsidiaries',
  'global_clearance_status': 'global_clearance_status'
}

export async function createRequest(req, res) {
  const data = req.body
  
  // Separate standard and custom fields
  const standardData = {}
  const customFields = {}
  
  Object.keys(data).forEach(key => {
    if (STANDARD_FIELD_MAPPINGS[key]) {
      standardData[STANDARD_FIELD_MAPPINGS[key]] = data[key]
    } else {
      // Custom field - store in JSON
      customFields[key] = data[key]
    }
  })
  
  // Save standard fields to columns
  const result = db.prepare(`
    INSERT INTO coi_requests (
      request_id, client_id, requester_id, department,
      requestor_name, designation, entity, line_of_service,
      requested_document, language,
      parent_company, client_location, relationship_with_client, client_type,
      service_type, service_description, requested_service_period_start, requested_service_period_end,
      full_ownership_structure, pie_status, related_affiliated_entities,
      international_operations, foreign_subsidiaries, global_clearance_status,
      custom_fields, form_version,
      status, stage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    requestId, standardData.client_id, user.id, user.department,
    standardData.requestor_name, standardData.designation, standardData.entity, standardData.line_of_service,
    standardData.requested_document, standardData.language,
    standardData.parent_company, standardData.client_location, standardData.relationship_with_client, standardData.client_type,
    standardData.service_type, standardData.service_description, standardData.requested_service_period_start, standardData.requested_service_period_end,
    standardData.full_ownership_structure, standardData.pie_status, standardData.related_affiliated_entities,
    standardData.international_operations ? 1 : 0, standardData.foreign_subsidiaries, standardData.global_clearance_status,
    Object.keys(customFields).length > 0 ? JSON.stringify(customFields) : null,
    getCurrentFormVersion(), // Track form version
    'Draft', 'Proposal'
  )
  
  res.json({ id: result.lastInsertRowid, request_id: requestId })
}
```

---

## 📋 Migration Steps

### Step 1: Add JSON Column
```sql
ALTER TABLE coi_requests ADD COLUMN custom_fields TEXT;
ALTER TABLE coi_requests ADD COLUMN form_version INTEGER DEFAULT 1;
```

### Step 2: Create Field Mapping Table
```sql
CREATE TABLE form_field_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id VARCHAR(100) UNIQUE NOT NULL,
    db_column VARCHAR(100),
    is_custom BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard mappings
INSERT INTO form_field_mappings (field_id, db_column, is_custom) VALUES
('requestor_name', 'requestor_name', 0),
('designation', 'designation', 0),
('entity', 'entity', 0),
-- ... all standard fields
```

### Step 3: Update Backend
- Modify `createRequest()` to use field mapping
- Store custom fields in JSON
- Track form version

### Step 4: Update Frontend
- `DynamicForm` can use any `field_id`
- Backend handles mapping automatically

---

## ✅ Benefits

1. **No Data Loss**: All fields saved (standard to columns, custom to JSON)
2. **Backward Compatible**: Existing requests still work
3. **Flexible**: Add new fields without schema changes
4. **Versioned**: Track which form version created each request
5. **Safe**: Field changes don't break existing data

---

## ⚠️ Current Risk

**Without these changes:**
- DynamicForm fields that don't match `coi_requests` columns will be **lost**
- New fields added to config won't be saved
- Field ID changes will cause data mismatches

**Recommendation:** Implement Solution 2 (JSON + Field Mapping) before using DynamicForm in production.

