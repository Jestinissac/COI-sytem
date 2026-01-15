# Prospect to Client Conversion Flow - Current Implementation

**Date:** January 15, 2026  
**Status:** Current Build Analysis

---

## 📋 OVERVIEW

This document explains how prospect-to-client conversion is managed in the current build, specifically:
1. Where conversion happens in the UI
2. How it's managed in Engagement COI requests
3. How the client dropdown is populated
4. Whether prospects appear in the client dropdown

---

## 🔄 CURRENT FLOW

### 1. **Creating COI Request with Prospect**

**Location:** `COIRequestForm.vue`

When a user creates a new COI request:
- **Client Dropdown:** Only shows **PRMS clients** (from `clients` table where `status = 'Active'`)
- **Prospects are NOT shown** in the client dropdown
- User can select an existing PRMS client OR create a request with a prospect manually

**Code Reference:**
```typescript
// Frontend: COIRequestForm.vue
async function fetchClients() {
  const response = await api.get('/integration/clients')
  clients.value = response.data || []  // Only PRMS clients
}

// Backend: integrationController.js
export async function getClients(req, res) {
  const clients = db.prepare('SELECT * FROM clients WHERE status = ? ORDER BY client_name').all('Active')
  // Only returns clients from PRMS, NOT prospects
}
```

**Client Dropdown UI:**
```vue
<select v-model="formData.client_id">
  <option :value="null">Search or select client...</option>
  <option v-for="client in clients" :key="client.id" :value="client.id">
    {{ client.client_name || client.name }} ({{ client.client_code || client.code || '' }})
  </option>
</select>
```

---

### 2. **Prospect to Client Conversion (Proposal → Engagement)**

**Location:** `COIRequestDetail.vue`

**When it happens:**
- A COI request with `stage = 'Proposal'` and `is_prospect = true` is approved
- User clicks **"Convert to Engagement"** button
- System checks if `request.is_prospect === true`

**Conversion Modal Logic:**
```vue
<!-- COIRequestDetail.vue -->
<ConvertToEngagementModal
  v-if="!request?.is_prospect"
  :show="showConvertModal"
  :request="request"
  @converted="handleConverted"
/>

<ProspectConversionModal
  v-if="request?.is_prospect"
  :show="showConvertModal"
  :request="request"
  :prospect="prospectData"
  @converted="handleProspectConverted"
/>
```

---

### 3. **ProspectConversionModal Flow**

**Location:** `components/engagement/ProspectConversionModal.vue`

**Two-Step Process:**

#### Step 1: Conversion Reason
- User enters reason for converting proposal to engagement
- Example: "Prospect accepted proposal and signed engagement letter"

#### Step 2: Client Creation Form
- User fills `AddClientToPRMSForm` component
- Fields include:
  - Client Name
  - Legal Form
  - Industry
  - Regulatory Body
  - Parent Company
  - Contact Details
  - Physical Address
  - Billing Address
  - Description

**Submission Process:**
```typescript
async function submitAll() {
  // Step 1: Convert proposal to engagement
  const conversionResponse = await api.post(`/engagement/proposal/${props.request.id}/convert`, {
    conversion_reason: conversionReason.value
  })
  
  const newEngagementId = conversionResponse.data.new_request.id
  
  // Step 2: Submit client creation request to PRMS Admin
  await api.post('/prospect-client-creation/submit', {
    prospect_id: props.prospect.id,
    coi_request_id: newEngagementId,
    client_name: clientFormData.value.client_name,
    // ... other client data
  })
}
```

---

### 4. **PRMS Admin Validation**

**Location:** `AdminDashboard.vue` → "Client Creations" tab

**Process:**
1. PRMS Admin receives notification email
2. Admin reviews client creation request in Admin Dashboard
3. Admin validates and completes client creation:
   - Creates client in `clients` table (simulating PRMS)
   - Updates `prospects` table (status = 'Converted to Client')
   - Updates `coi_requests` table (sets `client_id`, `is_prospect = 0`)
   - Updates `prospect_client_creation_requests` (status = 'Completed')

**After PRMS Admin Approval:**
- Client is now in PRMS (`clients` table)
- Client appears in client dropdown for future COI requests
- Prospect is marked as "Converted to Client"

---

## 📊 CLIENT DROPDOWN MANAGEMENT

### Current Implementation

**Question:** Does the client dropdown show clients from PRMS + Prospects from COI system?

**Answer:** **NO** - Currently only shows PRMS clients

**Details:**

1. **API Endpoint:** `GET /api/integration/clients`
2. **Backend Query:**
   ```sql
   SELECT * FROM clients WHERE status = 'Active' ORDER BY client_name
   ```
3. **What's Included:**
   - ✅ Active clients from PRMS (`clients` table)
   - ❌ Prospects are NOT included
   - ❌ Inactive clients are NOT included

4. **Why Prospects Aren't Included:**
   - Prospects are not yet in PRMS
   - They need PRMS Admin validation first
   - Only after PRMS Admin creates the client does it appear in dropdown

---

## 🎯 WORKFLOW SUMMARY

### Scenario 1: Creating COI Request with Existing PRMS Client
```
1. User opens COI Request Form
2. Client dropdown shows all Active PRMS clients
3. User selects existing client
4. User fills form and submits
5. Request goes through approval workflow
6. When approved, can convert to engagement (if Proposal stage)
```

### Scenario 2: Creating COI Request with Prospect (Not in PRMS)
```
1. User opens COI Request Form
2. Client dropdown shows only PRMS clients (prospect not visible)
3. User creates COI request manually (prospect data entered separately)
   OR
   User selects a client but later realizes it's a prospect
4. Request is created with is_prospect = true
5. Request goes through approval workflow
6. When approved, user clicks "Convert to Engagement"
7. ProspectConversionModal appears (because is_prospect = true)
8. User fills client creation form
9. Client creation request submitted to PRMS Admin
10. PRMS Admin validates and creates client in PRMS
11. Client now appears in dropdown for future requests
```

---

## 🔍 KEY FILES

### Frontend
- **`frontend/src/views/COIRequestForm.vue`**
  - Client dropdown (lines 284-302)
  - `fetchClients()` function (lines 1074-1089)
  - Only fetches PRMS clients

- **`frontend/src/views/COIRequestDetail.vue`**
  - Conversion button and modals (lines 904-920)
  - `handleConvertToEngagement()` function (lines 1440-1451)
  - Shows `ProspectConversionModal` if `is_prospect = true`

- **`frontend/src/components/engagement/ProspectConversionModal.vue`**
  - Two-tab modal for prospect conversion
  - Tab 1: Conversion reason
  - Tab 2: Client creation form
  - Submits both conversion and client creation request

### Backend
- **`backend/src/controllers/integrationController.js`**
  - `getClients()` function (lines 5-23)
  - Only returns PRMS clients, NOT prospects

- **`backend/src/controllers/prospectClientCreationController.js`**
  - `submitClientCreationRequest()` - Creates request for PRMS Admin
  - `completeClientCreation()` - PRMS Admin creates client (validated)

- **`backend/src/controllers/engagementController.js`**
  - `convertProposalToEngagement()` - Converts proposal to engagement

---

## ❓ POTENTIAL ENHANCEMENT

### Should Prospects Appear in Client Dropdown?

**Current State:** No

**Potential Enhancement:**
- Add prospects to client dropdown with visual indicator (e.g., "Prospect" badge)
- When selected, automatically trigger prospect conversion flow
- This would make the workflow more intuitive

**Implementation would require:**
1. Modify `getClients()` to include prospects
2. Add visual distinction in dropdown (e.g., "ABC Corp (Prospect)")
3. Handle prospect selection differently in form submission
4. Auto-trigger conversion modal when prospect is selected

---

## 📝 SUMMARY

### Where Conversion Happens:
- **UI Location:** `COIRequestDetail.vue` → "Convert to Engagement" button
- **Modal:** `ProspectConversionModal.vue` (if `is_prospect = true`)

### How It's Managed in Engagement COI Request:
1. Proposal stage request with `is_prospect = true`
2. After approval, user converts to engagement
3. If prospect, shows `ProspectConversionModal`
4. User fills client creation form
5. Client creation request sent to PRMS Admin
6. PRMS Admin validates and creates client
7. Client now available in PRMS and appears in dropdown

### Client Dropdown Management:
- **Currently:** Only shows PRMS clients (`clients` table, `status = 'Active'`)
- **Does NOT include:** Prospects, inactive clients
- **Why:** Prospects need PRMS Admin validation before becoming clients
- **After conversion:** Newly created client appears in dropdown for future requests

---

**Status:** ✅ Current implementation documented  
**Next Steps:** Consider enhancement to show prospects in dropdown with visual indicator
