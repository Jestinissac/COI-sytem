# LC/NC Implementation - File Changes Location

## 📁 All Files Created/Modified

### 🗄️ Database Layer

#### 1. **database/schema.sql** (MODIFIED)
   - **Location**: `/coi-prototype/database/schema.sql`
   - **Changes**: Added 3 new tables at the end of the file:
     - `form_fields_config` - Form field configurations
     - `workflow_config` - Workflow step configurations  
     - `business_rules_config` - Business rule configurations
   - **Lines**: ~405-450 (added after existing indexes)

---

### 🔧 Backend - Controllers

#### 2. **backend/src/controllers/configController.js** (NEW)
   - **Location**: `/coi-prototype/backend/src/controllers/configController.js`
   - **Purpose**: Handles all configuration API endpoints
   - **Functions**:
     - `getFormFields()` - Get all form fields
     - `saveFormFields()` - Save form field configuration
     - `getFormField()` - Get single field
     - `updateFormField()` - Update field
     - `deleteFormField()` - Delete field
     - `getWorkflowConfig()` - Get workflow steps
     - `saveWorkflowConfig()` - Save workflow
     - `getBusinessRules()` - Get business rules
     - `saveBusinessRule()` - Save rule
     - `deleteBusinessRule()` - Delete rule

---

### 🛣️ Backend - Routes

#### 3. **backend/src/routes/config.routes.js** (NEW)
   - **Location**: `/coi-prototype/backend/src/routes/config.routes.js`
   - **Purpose**: API routes for configuration
   - **Endpoints**:
     - `GET /api/config/form-fields` - List all fields
     - `POST /api/config/form-fields` - Save fields (Admin only)
     - `GET /api/config/form-fields/:id` - Get single field
     - `PUT /api/config/form-fields/:id` - Update field (Admin only)
     - `DELETE /api/config/form-fields/:id` - Delete field (Admin only)
     - `GET /api/config/workflow` - Get workflow
     - `POST /api/config/workflow` - Save workflow (Admin only)
     - `GET /api/config/business-rules` - Get rules
     - `POST /api/config/business-rules` - Save rule (Admin only)
     - `DELETE /api/config/business-rules/:id` - Delete rule (Admin only)

#### 4. **backend/src/routes/integration.routes.js** (MODIFIED)
   - **Location**: `/coi-prototype/backend/src/routes/integration.routes.js`
   - **Changes**: Added 2 new endpoints:
     - `GET /api/integration/hrms/user-data` - Get HRMS user data
     - `GET /api/integration/prms/client/:clientId` - Get PRMS client data
   - **Lines**: Added after existing routes (~line 12-60)

---

### ⚙️ Backend - Core

#### 5. **backend/src/index.js** (MODIFIED)
   - **Location**: `/coi-prototype/backend/src/index.js`
   - **Changes**: 
     - Added import: `import configRoutes from './routes/config.routes.js'`
     - Added route: `app.use('/api/config', configRoutes)`
   - **Lines**: ~75-78

#### 6. **backend/src/database/init.js** (MODIFIED)
   - **Location**: `/coi-prototype/backend/src/database/init.js`
   - **Changes**: Added auto-seeding of form fields if table is empty
   - **Lines**: ~77-90 (after existing trigger creation)

---

### 📜 Backend - Scripts

#### 7. **backend/src/scripts/seedFormFields.js** (NEW)
   - **Location**: `/coi-prototype/backend/src/scripts/seedFormFields.js`
   - **Purpose**: Seeds initial form field configuration
   - **Content**: Pre-defined form fields matching current COI template
   - **Runs**: Automatically on database init if table is empty

---

### 🎨 Frontend - Components

#### 8. **frontend/src/components/DynamicForm.vue** (NEW)
   - **Location**: `/coi-prototype/frontend/src/components/DynamicForm.vue`
   - **Purpose**: Renders forms dynamically from configuration
   - **Features**:
     - Auto-loads form fields from API
     - Auto-populates from HRMS/PRMS
     - Conditional field display
     - Multiple field types support
   - **Usage**: Can be used in any form (e.g., COIRequestForm)

#### 9. **frontend/src/views/FormBuilder.vue** (NEW)
   - **Location**: `/coi-prototype/frontend/src/views/FormBuilder.vue`
   - **Purpose**: Admin UI for building/editing forms
   - **Features**:
     - Drag-and-drop field types
     - Field properties editor
     - Section-based organization
     - Conditional rules
     - Data source mapping
   - **Access**: `/coi/form-builder` (Admin/Super Admin only)

---

### 🧭 Frontend - Routing

#### 10. **frontend/src/router/index.ts** (MODIFIED)
   - **Location**: `/coi-prototype/frontend/src/router/index.ts`
   - **Changes**: Added new route:
     ```typescript
     {
       path: 'form-builder',
       name: 'FormBuilder',
       component: () => import('@/views/FormBuilder.vue'),
       meta: { roles: ['Admin', 'Super Admin'] }
     }
     ```
   - **Lines**: ~100-105 (after prms-demo route)

---

### 🛠️ Frontend - Utilities

#### 11. **frontend/src/composables/useToast.ts** (NEW)
   - **Location**: `/coi-prototype/frontend/src/composables/useToast.ts`
   - **Purpose**: Toast notification composable
   - **Usage**: Used by FormBuilder for success/error messages

---

## 📊 Summary by Category

### New Files Created (7)
1. ✅ `backend/src/controllers/configController.js`
2. ✅ `backend/src/routes/config.routes.js`
3. ✅ `backend/src/scripts/seedFormFields.js`
4. ✅ `frontend/src/components/DynamicForm.vue`
5. ✅ `frontend/src/views/FormBuilder.vue`
6. ✅ `frontend/src/composables/useToast.ts`
7. ✅ `LCNC_IMPLEMENTATION_SUMMARY.md` (documentation)

### Modified Files (5)
1. ✅ `database/schema.sql` - Added 3 tables
2. ✅ `backend/src/index.js` - Added config route
3. ✅ `backend/src/routes/integration.routes.js` - Added HRMS/PRMS endpoints
4. ✅ `backend/src/database/init.js` - Added auto-seeding
5. ✅ `frontend/src/router/index.ts` - Added form-builder route

---

## 🗺️ File Structure

```
coi-prototype/
├── database/
│   └── schema.sql                    [MODIFIED] ✏️
│
├── backend/
│   └── src/
│       ├── controllers/
│       │   └── configController.js    [NEW] ✨
│       ├── routes/
│       │   ├── config.routes.js      [NEW] ✨
│       │   └── integration.routes.js [MODIFIED] ✏️
│       ├── scripts/
│       │   └── seedFormFields.js     [NEW] ✨
│       ├── database/
│       │   └── init.js               [MODIFIED] ✏️
│       └── index.js                  [MODIFIED] ✏️
│
└── frontend/
    └── src/
        ├── components/
        │   └── DynamicForm.vue        [NEW] ✨
        ├── views/
        │   └── FormBuilder.vue       [NEW] ✨
        ├── router/
        │   └── index.ts              [MODIFIED] ✏️
        └── composables/
            └── useToast.ts            [NEW] ✨
```

---

## 🔍 Quick Reference

### To Access Form Builder:
- **URL**: `http://localhost:5173/coi/form-builder`
- **Role Required**: Admin or Super Admin
- **Login**: Use admin credentials

### To Use Dynamic Form:
- **Component**: `<DynamicForm :formData="formData" />`
- **Location**: Can be integrated into `COIRequestForm.vue`
- **Auto-loads**: Form configuration from `/api/config/form-fields`

### API Endpoints:
- **Form Fields**: `GET/POST /api/config/form-fields`
- **Workflow**: `GET/POST /api/config/workflow`
- **Business Rules**: `GET/POST /api/config/business-rules`
- **HRMS Data**: `GET /api/integration/hrms/user-data`
- **PRMS Data**: `GET /api/integration/prms/client/:id`

---

## ✅ All Changes Complete

All files have been created/modified and are ready for testing!

