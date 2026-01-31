# PRMS Integration - Current State & Production Requirements

**Last Updated:** January 28, 2026  
**Status:** Prototype (Mock) | Production (TODO)

---

## 🔍 CURRENT STATE: PROTOTYPE (Mock Integration)

### What is Currently Implemented

The system currently uses **MOCK PRMS integration** for the prototype. This means:

1. **PRMS Client Check** - Checks local `clients` table (not real PRMS)
2. **Client Creation** - Creates client in local `clients` table (simulates PRMS)
3. **No Real API Calls** - All PRMS operations are simulated

---

## 📊 HOW IT WORKS NOW (Prototype)

### 1. Proposal to Engagement Conversion

**Current Flow:**
```
Proposal Approved
    ↓
Requester clicks "Convert to Engagement"
    ↓
System checks: is_prospect = true?
    ├─ NO  → Standard conversion (creates engagement request)
    └─ YES → Prospect conversion (creates engagement + client creation request)
```

**PRMS Reflection:**
- ❌ **No direct PRMS interaction** during conversion
- ✅ Creates engagement request in COI system
- ✅ If prospect, triggers client creation workflow

---

### 2. Prospect to Client Creation

**Current Flow:**
```
Prospect reaches engagement stage
    ↓
Requester submits client creation form
    ↓
PRMS Admin reviews in Admin Dashboard
    ↓
Admin approves → Creates client in local `clients` table
    ↓
System updates:
  - prospects table (status = 'Converted to Client')
  - coi_requests table (client_id = new_id, is_prospect = 0)
  - prospect_client_creation_requests (status = 'Completed')
```

**PRMS Reflection (Current - Mock):**
- ✅ Creates client in **local `clients` table** (simulates PRMS Client Master)
- ✅ Generates `client_code` (format: `CLI-{timestamp}`)
- ✅ Updates all related COI records
- ❌ **Does NOT call real PRMS API**

**Code Location:**
- `backend/src/controllers/prospectClientCreationController.js` - `completeClientCreation()` function
- Lines 273-331: Creates client in local database (simulating PRMS)

---

### 3. PRMS Client Check

**Current Implementation:**
```javascript
// backend/src/controllers/prospectController.js - checkPRMSClient()
// TODO: Integrate with PRMS API
// For now, return mock response
const exists = db.prepare('SELECT id FROM clients WHERE client_code = ?').get(prms_client_code)
```

**What It Does:**
- ✅ Checks local `clients` table for matching `client_code`
- ❌ **Does NOT call real PRMS API**

**When It's Used:**
- During prospect creation (to link prospect to existing PRMS client)
- When requester manually checks if client exists in PRMS

---

## 🔄 PRODUCTION REQUIREMENTS

### What Needs to Change for Production

#### 1. PRMS Client Check API Integration

**Current (Mock):**
```javascript
// Checks local clients table
const exists = db.prepare('SELECT id FROM clients WHERE client_code = ?').get(prms_client_code)
```

**Production (Required):**
```javascript
// Call real PRMS API
const prmsResponse = await fetch(`${PRMS_API_URL}/api/clients/check`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${prmsToken}` },
  body: JSON.stringify({ client_code: prms_client_code })
})
const exists = prmsResponse.data.exists
```

**PRMS API Endpoint Needed:**
- `GET /api/clients/check?client_code={code}` or
- `POST /api/clients/validate` with `{ client_code: string }`

**Returns:**
```json
{
  "exists": true,
  "client_code": "CLI-001",
  "client_id": "12345",
  "client_name": "ABC Corp",
  "status": "Active"
}
```

---

#### 2. Client Creation in PRMS

**Current (Mock):**
```javascript
// Creates in local clients table
const clientResult = db.prepare(`
  INSERT INTO clients (client_code, client_name, ...) 
  VALUES (?, ?, ...)
`).run(...)
```

**Production (Required):**
```javascript
// Step 1: Create client in PRMS
const prmsResponse = await fetch(`${PRMS_API_URL}/api/clients`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${prmsToken}` },
  body: JSON.stringify({
    client_name: client_data.client_name,
    legal_form: client_data.legal_form,
    industry: client_data.industry,
    regulatory_body: client_data.regulatory_body,
    parent_company: client_data.parent_company,
    contact_details: client_data.contacts,
    physical_address: client_data.physical_address,
    billing_address: client_data.billing_address,
    // ... other fields
  })
})

const prmsClient = prmsResponse.data
const prmsClientCode = prmsClient.client_code
const prmsClientId = prmsClient.client_id

// Step 2: Create/update in COI clients table (for reference)
const clientResult = db.prepare(`
  INSERT INTO clients (
    client_code,      -- From PRMS
    client_name,
    prms_client_id,   -- PRMS internal ID
    prms_synced,      -- 1 (true)
    prms_sync_date,   -- CURRENT_TIMESTAMP
    ...
  ) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, ...)
`).run(prmsClientCode, ...)
```

**PRMS API Endpoint Needed:**
- `POST /api/clients` - Create new client in PRMS Client Master

**Request Body:**
```json
{
  "client_name": "ABC Corporation",
  "legal_form": "W.L.L.",
  "industry": "Technology",
  "regulatory_body": "MOCI",
  "parent_company": "Parent Corp",
  "contact_details": [
    { "name": "John Doe", "email": "john@abc.com", "phone": "+965..." }
  ],
  "physical_address": "Kuwait City, Kuwait",
  "billing_address": "Same as physical",
  "description": "New client from COI prospect conversion"
}
```

**Response:**
```json
{
  "success": true,
  "client_id": "PRMS-12345",
  "client_code": "CLI-001",
  "client_name": "ABC Corporation",
  "status": "Active",
  "created_at": "2026-01-15T10:30:00Z"
}
```

---

#### 3. PRMS Project Creation (After Engagement Approval)

**Current Implementation:**
- `POST /api/integration/projects` - Creates project in local `prms_projects` table
- Validates engagement code exists and is Active
- Database constraint prevents invalid codes

**Production (Required):**
```javascript
// After engagement is approved and engagement code is generated
const prmsResponse = await fetch(`${PRMS_API_URL}/api/projects`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${prmsToken}` },
  body: JSON.stringify({
    engagement_code: engagementCode,  // From COI system
    client_code: clientCode,           // From PRMS Client Master
    project_name: `${clientName} - ${serviceType}`,
    service_type: serviceType,
    start_date: requested_service_period_start,
    billing_currency: financial_parameters.currency,
    project_value: financial_parameters.pending_amount,
    risks: financial_parameters.risk_assessment,
    // ... other fields
  })
})
```

**PRMS API Endpoint Needed:**
- `POST /api/projects` - Create new project in PRMS

**Note:** PRMS must have `EngagementCode` as a **MANDATORY field** in project creation form.

---

## 📋 PRMS INTEGRATION CHECKLIST

### Phase 1: Client Operations (Priority: HIGH)

- [ ] **PRMS Client Check API**
  - [ ] Endpoint: `GET /api/clients/check?client_code={code}`
  - [ ] Authentication/Authorization
  - [ ] Error handling
  - [ ] Update `checkPRMSClient()` function

- [ ] **PRMS Client Creation API**
  - [ ] Endpoint: `POST /api/clients`
  - [ ] Map COI client form fields to PRMS fields
  - [ ] Handle PRMS validation errors
  - [ ] Update `completeClientCreation()` function
  - [ ] Store PRMS client_id in COI clients table

- [ ] **PRMS Client Sync**
  - [ ] Store `prms_client_id` in `clients` table
  - [ ] Store `prms_synced = 1` flag
  - [ ] Store `prms_sync_date` timestamp

### Phase 2: Project Operations (Priority: MEDIUM)

- [ ] **PRMS Project Creation API**
  - [ ] Endpoint: `POST /api/projects`
  - [ ] Map engagement code + client code
  - [ ] Map financial parameters (currency, risk, etc.)
  - [ ] Update `createProject()` function

- [ ] **Engagement Code Validation**
  - [ ] PRMS validates engagement code before project creation
  - [ ] Database constraint already enforces this
  - [ ] Add API-level validation

### Phase 3: Data Sync (Priority: LOW)

- [ ] **Bidirectional Sync**
  - [ ] Sync client updates from PRMS to COI
  - [ ] Sync project status from PRMS to COI
  - [ ] Handle conflicts

- [ ] **Webhooks/Events**
  - [ ] PRMS notifies COI when client is updated
  - [ ] PRMS notifies COI when project status changes

---

## 📋 PARENT COMPANY BIDIRECTIONAL SYNC (Implemented in Prototype)

**Context:** PRMS Client Master often has parent company labelled **"TBD"**. Users may capture or update parent in COI or in PRMS; both systems should stay aligned. **Rule:** If data is first updated in COI, pushing to PRMS must go through **PRMS admin approval**.

### Current Implementation (Prototype)

| Scenario | Behaviour |
|----------|-----------|
| **Load existing BDO client** | `GET /integration/clients` and `GET /integration/prms/client/:clientId` return `parent_company`; value **"TBD"** or empty is normalized to null for pre-fill so the user can enter parent in COI. |
| **User fills/updates parent in COI** (existing client, PRMS has TBD/empty) | On create or submit request, backend creates a **parent company update request** (table `parent_company_update_requests`, status Pending). No direct PRMS write. |
| **PRMS Admin approves** | Admin Dashboard → "Parent Company Updates" tab → Approve. Prototype: updates local `clients.parent_company` (mock PRMS write). Production: call PRMS API to update client parent, then mark request Approved. |
| **PRMS Admin rejects** | Reject with optional note; no PRMS write. |

### Client vs Prospect vs New Prospect

| Entity | PRMS integration |
|--------|------------------|
| **Existing client (BDO list)** | **Required**: Read client (and parent) from PRMS when loading. Parent updates from COI → parent company update request → PRMS admin approval → write to PRMS. |
| **Prospect** | Not in PRMS until conversion. On conversion, client creation request → PRMS Admin completes → create client in PRMS (including parent from COI request). |
| **New prospect** | Same as prospect; PRMS integration at conversion with admin approval. |

### Production Requirements

- **GET client (by id/code)** from PRMS Client Master including `parent_company`; contract for TBD/empty (treat as empty for pre-fill).
- **PATCH/PUT client parent_company** (or equivalent) used **only after PRMS admin approval** from COI (parent company update request workflow).
- **Sync back PRMS → COI:** When PRMS is updated (by PRMS users or after approved COI-originated update), COI should be notified (webhook, poll, or event) and `coi_requests`/`clients` updated so both systems stay aligned.

### Code Locations

- **Table:** `parent_company_update_requests` (see `backend/src/database/init.js`, migration `database/migrations/20260128_parent_company_update_requests.sql`).
- **API:** `backend/src/controllers/parentCompanyUpdateController.js`, routes `backend/src/routes/parentCompanyUpdate.routes.js` (`/api/parent-company-update-requests`).
- **COI create/submit:** `backend/src/controllers/coiController.js` creates parent update request when existing client + parent set and PRMS has TBD/empty.
- **Admin UI:** Admin Dashboard → "Parent Company Updates" tab → `ParentCompanyUpdateRequestsPanel.vue`.

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Current (Prototype):
- No authentication required (local database)

### Production (Required):
```javascript
// PRMS API Authentication
const PRMS_API_URL = process.env.PRMS_API_URL
const PRMS_API_KEY = process.env.PRMS_API_KEY
const PRMS_API_SECRET = process.env.PRMS_API_SECRET

// OAuth 2.0 or API Key authentication
const prmsToken = await getPRMSToken() // OAuth flow or API key
```

**Options:**
1. **API Key** - Simple, for server-to-server
2. **OAuth 2.0** - More secure, for user-based access
3. **Service Account** - Dedicated service user for COI system

---

## 📝 CODE LOCATIONS TO UPDATE

### Files That Need PRMS Integration:

1. **`backend/src/controllers/prospectController.js`**
   - Line 298-321: `checkPRMSClient()` - Replace mock with real API call

2. **`backend/src/controllers/prospectClientCreationController.js`**
   - Line 250-382: `completeClientCreation()` - Replace local insert with PRMS API call

3. **`backend/src/controllers/integrationController.js`**
   - Line 55-95: `createProject()` - Replace local insert with PRMS API call

4. **`backend/src/controllers/coiController.js`**
   - Line 448-461: PRMS client check during prospect creation - Replace mock with real API

### New Files Needed:

1. **`backend/src/services/prmsService.js`** (NEW)
   - `checkPRMSClient(clientCode)` - Check if client exists
   - `createPRMSClient(clientData)` - Create client in PRMS
   - `createPRMSProject(projectData)` - Create project in PRMS
   - `getPRMSToken()` - Handle authentication

2. **`backend/src/config/prms.config.js`** (NEW)
   - PRMS API URL
   - API credentials
   - Timeout settings
   - Retry logic

---

## 🎯 SUMMARY

### Current State (Prototype):
- ✅ **Workflow is complete** - All business logic implemented
- ✅ **Database structure ready** - Tables support PRMS integration
- ✅ **UI/UX complete** - All forms and workflows functional
- ⚠️ **PRMS calls are mocked** - Uses local database instead of PRMS API

### Production Requirements:
- 🔄 **Replace mock calls with real PRMS API calls**
- 🔐 **Add PRMS authentication**
- 📊 **Map COI data fields to PRMS fields**
- ⚠️ **Handle PRMS errors and edge cases**
- 🔄 **Add retry logic for failed API calls**
- 📝 **Add logging for PRMS operations**

### Key Insight:
**The system is architected correctly for PRMS integration.** All the workflow, database structure, and UI are production-ready. Only the actual API calls need to be replaced from mock to real PRMS endpoints.

---

## 📚 RELATED DOCUMENTATION

- `PRMS_INTEGRATION_ANALYSIS.md` - PRMS form field analysis
- `PRMS_FINANCIAL_DATA_INTEGRATION_ANALYSIS.md` - Financial parameters mapping
- `docs/production-handover/Prototype_vs_Production_Handoff_Guide.md` - Production handoff guide
- `PROPOSAL_TO_ENGAGEMENT_IMPLEMENTATION_SUMMARY.md` - Implementation details

---

**Last Reviewed:** January 28, 2026  
**Status:** Ready for PRMS API Integration ✅
