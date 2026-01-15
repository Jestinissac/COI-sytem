# Proposal to Engagement Conversion - UI/UX Implementation Plan
**Date**: January 13, 2026  
**Requirement**: Meeting Requirement #1 - Convert proposal to engagement within the system and re-apply for COI  
**Status**: Backend ✅ Complete | Frontend ❌ **MISSING**

---

## 🎯 Business Context

### What is Proposal to Engagement Conversion?

**Business Scenario:**
1. **Proposal Stage**: Client receives a proposal for services → COI approval obtained for "proposal stage"
2. **Client Accepts**: Client signs/accepts the proposal
3. **Engagement Stage**: Services begin → **NEW COI approval required** for "engagement stage"

**Why Separate COI Approvals?**
- **Risk Profile Changes**: Proposal = potential work; Engagement = actual work (higher risk)
- **Independence Considerations**: Different safeguards apply once work begins
- **Conflict Dynamics**: New conflicts may emerge between proposal and engagement
- **Regulatory Requirements**: Many jurisdictions require separate independence checks

**Current Problem:**
- Users don't know how to convert proposals to engagements
- Manual re-entry of all data (time-consuming, error-prone)
- No tracking of proposal → engagement relationship

---

## 🔧 Backend Status (✅ Complete)

### API Endpoint:
```
POST /api/engagement/proposal/:requestId/convert
```

### Request Body:
```json
{
  "conversion_reason": "Client signed proposal on Jan 10, 2026",
  "requester_id": 5  // Optional, extracted from token
}
```

### Response:
```json
{
  "success": true,
  "message": "Proposal successfully converted to engagement",
  "original_request_id": "COI-2026-027",
  "new_request": {
    "id": 33,
    "request_id": "COI-2026-033",
    "stage": "Engagement",
    "status": "Draft",
    "client_name": "Client 031 Company",
    "service_type": "Internal Audit"
  },
  "conversion_id": 15
}
```

### Backend Logic:
1. ✅ Validates proposal stage
2. ✅ Validates approved/active status
3. ✅ Creates conversion record in `proposal_engagement_conversions` table
4. ✅ Duplicates COI request with:
   - Stage = "Engagement"
   - Status = "Draft"
   - New request ID
   - All other data copied
5. ✅ Copies attachments
6. ✅ Updates original proposal to "Active"
7. ✅ Sends email notification
8. ✅ Returns new engagement request

---

## 🎨 Frontend Implementation (REQUIRED)

### 1. COI Request Detail Page - Primary Location

#### **A. "Convert to Engagement" Button**

**Location**: Top right header (next to Export/Edit Draft buttons)

**Show When:**
```typescript
const canConvert = computed(() => {
  return request.value?.stage === 'Proposal' 
    && (request.value?.status === 'Approved' || request.value?.status === 'Active')
    && ['Requester', 'Director', 'Admin', 'Super Admin'].includes(authStore.user?.role)
})
```

**Button Design:**
```vue
<button 
  v-if="canConvert"
  @click="showConvertModal = true"
  class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
>
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
  </svg>
  Convert to Engagement
</button>
```

---

#### **B. Conversion Modal**

**Design Mockup:**

```
┌─────────────────────────────────────────────────────────────┐
│  Convert Proposal to Engagement                       [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 Current Proposal                                        │
│  ─────────────────────────────────────────────────────────  │
│  Request ID:     COI-2026-027                               │
│  Client:         Client 031 Company                         │
│  Service:        Internal Audit                             │
│  Status:         Approved                                   │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│                                                             │
│  🔄 What Happens Next?                                      │
│                                                             │
│  ✓ A new COI request will be created with:                 │
│    • Stage: Engagement                                      │
│    • Status: Draft (ready for you to review & submit)      │
│    • All data copied from this proposal                     │
│                                                             │
│  ✓ The original proposal will remain as reference          │
│  ✓ You'll need to submit the new engagement for COI        │
│    approval (fresh review required)                         │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│                                                             │
│  Conversion Reason (Required)                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Client accepted proposal and signed engagement letter │ │
│  │ on January 10, 2026. Work commences January 15, 2026.│ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│  Provide context for why this conversion is happening      │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│                                                             │
│           [Cancel]    [Convert to Engagement]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Modal Code:**

```vue
<!-- ConvertToEngagementModal.vue -->
<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Convert Proposal to Engagement</h2>
        <button @click="$emit('cancel')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-4 space-y-6">
        <!-- Current Proposal Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Current Proposal
          </h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-blue-700 font-medium">Request ID:</span>
              <span class="text-blue-900 ml-2">{{ request.request_id }}</span>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Status:</span>
              <span class="text-blue-900 ml-2">{{ request.status }}</span>
            </div>
            <div class="col-span-2">
              <span class="text-blue-700 font-medium">Client:</span>
              <span class="text-blue-900 ml-2">{{ request.client_name }}</span>
            </div>
            <div class="col-span-2">
              <span class="text-blue-700 font-medium">Service:</span>
              <span class="text-blue-900 ml-2">{{ request.service_type }}</span>
            </div>
          </div>
        </div>

        <!-- What Happens Next -->
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            What Happens Next?
          </h3>
          <ul class="space-y-2 text-sm text-purple-800">
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>A new COI request will be created with <strong>Stage: Engagement</strong> and <strong>Status: Draft</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>All data and attachments will be copied from this proposal</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>The original proposal will remain for reference</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>You'll need to <strong>review and submit</strong> the new engagement for fresh COI approval</span>
            </li>
          </ul>
        </div>

        <!-- Conversion Reason -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Conversion Reason <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="conversionReason"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Client accepted proposal and signed engagement letter on Jan 10, 2026. Work commences Jan 15, 2026."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">Provide context for this conversion (audit trail requirement)</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <button 
          @click="$emit('cancel')"
          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button 
          @click="convert"
          :disabled="!conversionReason || converting"
          class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="converting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ converting ? 'Converting...' : 'Convert to Engagement' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/services/api'

const props = defineProps<{
  show: boolean
  request: any
}>()

const emit = defineEmits(['cancel', 'converted'])

const conversionReason = ref('')
const converting = ref(false)

async function convert() {
  if (!conversionReason.value) return
  
  converting.value = true
  try {
    const response = await api.post(`/engagement/proposal/${props.request.id}/convert`, {
      conversion_reason: conversionReason.value
    })
    
    emit('converted', response.data)
    conversionReason.value = ''
  } catch (error: any) {
    console.error('Error converting proposal:', error)
    alert(error.response?.data?.error || 'Failed to convert proposal to engagement')
  } finally {
    converting.value = false
  }
}
</script>
```

---

#### **C. Conversion History Display**

**Location**: New section in the Request Detail page (after "Previous Engagements")

```vue
<!-- Conversion History -->
<div v-if="conversionHistory.length > 0" class="bg-white rounded-lg shadow-sm">
  <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
    <h2 class="font-medium text-gray-900 flex items-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
      Conversion History
    </h2>
  </div>
  <div class="p-4">
    <div v-for="conversion in conversionHistory" :key="conversion.id" class="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg mb-2">
      <div class="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </div>
      <div class="flex-1">
        <p class="text-sm text-gray-900">
          <strong>{{ conversion.original_request_id }}</strong> converted to 
          <strong class="text-purple-700">{{ conversion.new_request_id }}</strong>
        </p>
        <p class="text-xs text-gray-600 mt-1">{{ conversion.conversion_reason }}</p>
        <p class="text-xs text-gray-500 mt-1">
          By {{ conversion.converted_by_name }} on {{ formatDate(conversion.conversion_date) }}
        </p>
        <router-link 
          :to="`/coi/requests/${conversion.new_engagement_request_id}`"
          class="text-xs text-purple-600 hover:text-purple-800 mt-2 inline-block"
        >
          View Engagement Request →
        </router-link>
      </div>
    </div>
  </div>
</div>
```

---

### 2. Requester Dashboard - Secondary Location

#### **A. Quick Action Button in Table**

**Location**: "Active Engagements & Proposals" tab → Proposal Tracking

```vue
<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <!-- Existing actions -->
  <button 
    v-if="request.stage === 'Proposal' && (request.status === 'Approved' || request.status === 'Active')"
    @click="openConvertModal(request)"
    class="text-purple-600 hover:text-purple-900 mr-3"
  >
    Convert
  </button>
  <button @click="viewDetails(request)" class="text-blue-600 hover:text-blue-900">
    View
  </button>
</td>
```

---

### 3. Post-Conversion Success Flow

**After successful conversion:**

```vue
// Show success notification
<div class="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50">
  <div class="flex items-start gap-3">
    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
    </svg>
    <div>
      <h3 class="text-sm font-semibold text-green-900">Proposal Converted Successfully!</h3>
      <p class="text-sm text-green-800 mt-1">
        New engagement request <strong>{{ newRequest.request_id }}</strong> has been created.
      </p>
      <div class="mt-3 flex gap-2">
        <button 
          @click="router.push(`/coi/requests/${newRequest.id}`)"
          class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
        >
          View New Request
        </button>
        <button 
          @click="router.push(`/coi/request/edit/${newRequest.id}`)"
          class="px-3 py-1.5 bg-white text-green-700 border border-green-300 text-xs font-medium rounded hover:bg-green-50"
        >
          Review & Submit
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 📊 User Journey

### Scenario: Converting an Approved Proposal

```
1. USER: Patricia White (Requester)
   ↓
2. CONTEXT: Client 031 Company accepted the Internal Audit proposal
   ↓
3. ACTION: Opens COI-2026-027 (Approved Proposal)
   ↓
4. UI: Sees "Convert to Engagement" button (purple, prominent)
   ↓
5. CLICKS: Convert to Engagement
   ↓
6. MODAL: Shows current proposal info + what will happen
   ↓
7. FILLS: "Client accepted proposal and signed engagement letter on Jan 10"
   ↓
8. CLICKS: Convert to Engagement (in modal)
   ↓
9. SYSTEM: 
   - Creates COI-2026-033 (Engagement, Draft)
   - Copies all data
   - Records conversion history
   - Sends email notification
   ↓
10. SUCCESS: Shows success notification with options:
    - View New Request
    - Review & Submit
   ↓
11. USER CLICKS: Review & Submit
   ↓
12. UI: Opens COI-2026-033 in edit mode
   ↓
13. USER: Reviews data, makes any updates, submits
   ↓
14. WORKFLOW: COI approval process begins for engagement
```

---

## 🔐 Permissions & Access Control

| Role | Can Convert? | Notes |
|------|-------------|-------|
| **Requester** | ✅ Yes | Only their own requests |
| **Director** | ✅ Yes | Requests in their department |
| **Compliance** | ❌ No | View only |
| **Partner** | ❌ No | View only |
| **Admin** | ✅ Yes | All requests |
| **Super Admin** | ✅ Yes | All requests |

---

## 🎨 Design Tokens

### Colors:
- **Primary Action**: Purple (`bg-purple-600`)
- **Success**: Green (`bg-green-600`)
- **Info**: Blue (`bg-blue-50`)

### Icons:
- **Convert Action**: Right arrow (`→` or chevron)
- **Success**: Checkmark
- **History**: Clock/Timeline

---

## 📱 Responsive Considerations

### Desktop (≥1024px):
- Modal: 2xl width (max-w-2xl)
- Button: Full text "Convert to Engagement"

### Tablet (768px - 1023px):
- Modal: xl width (max-w-xl)
- Button: "Convert"

### Mobile (<768px):
- Modal: Full width with padding
- Button: Icon only with tooltip

---

## 🧪 Testing Checklist

### Frontend Tests:
- [ ] Button only shows for Proposal stage requests
- [ ] Button only shows for Approved/Active status
- [ ] Button hidden for non-authorized roles
- [ ] Modal opens correctly
- [ ] Conversion reason is required (validation)
- [ ] API call handles success correctly
- [ ] API call handles errors correctly
- [ ] Success notification appears
- [ ] Navigation to new request works
- [ ] Conversion history displays correctly

### Integration Tests:
- [ ] End-to-end: Convert proposal → Create engagement → Submit → Approve
- [ ] Attachments are copied correctly
- [ ] Original proposal remains unchanged (except status)
- [ ] Email notifications sent
- [ ] Conversion history tracked

### Edge Cases:
- [ ] Already converted proposal (should show history, not button)
- [ ] Proposal in Draft status (button hidden)
- [ ] Proposal already rejected (button hidden)
- [ ] Network errors during conversion
- [ ] Concurrent conversions (race condition)

---

## 📄 Implementation Files

### New Files to Create:
1. **`frontend/src/components/engagement/ConvertToEngagementModal.vue`** (250 lines)
2. **`frontend/src/components/engagement/ConversionHistory.vue`** (100 lines)

### Files to Modify:
1. **`frontend/src/views/COIRequestDetail.vue`**
   - Add button (10 lines)
   - Add modal integration (15 lines)
   - Add conversion history section (20 lines)
   - Add API call handler (25 lines)

2. **`frontend/src/views/RequesterDashboard.vue`**
   - Add quick action button in table (10 lines)
   - Add modal integration (15 lines)

3. **`frontend/src/router.ts`**
   - No changes needed (uses existing routes)

### Estimated Development Time:
- **Modal Component**: 2 hours
- **History Component**: 1 hour
- **Integration (Detail Page)**: 1.5 hours
- **Integration (Dashboard)**: 1 hour
- **Testing**: 2 hours
- **Total**: **~7.5 hours**

---

## 🚀 Priority & Dependencies

### Priority: **HIGH** ⚠️
- This is a **core business requirement**
- Backend is complete, frontend is 100% missing
- Users currently have no way to convert proposals

### Dependencies:
- ✅ Backend API (Complete)
- ✅ Authentication system (Complete)
- ✅ Routing (Complete)
- ❌ UI Components (Need to create)

### Blockers:
- None - ready to implement immediately

---

## 📚 References

### Backend Files:
- `backend/src/controllers/engagementController.js`
- `backend/src/routes/engagement.routes.js`
- `backend/database/schema.sql` (proposal_engagement_conversions table)

### Similar UI Patterns (for reference):
- `frontend/src/components/compliance/RestrictionsModal.vue` (modal pattern)
- `frontend/src/views/RequesterDashboard.vue` (action buttons in tables)
- `frontend/src/views/COIRequestDetail.vue` (detail page layout)

---

## ✅ Success Criteria

The feature will be considered complete when:

1. ✅ Users can click "Convert to Engagement" button
2. ✅ Modal explains the process clearly
3. ✅ Conversion creates new engagement request (Draft)
4. ✅ All data and attachments are copied
5. ✅ Users are guided to review and submit new request
6. ✅ Conversion history is visible
7. ✅ Email notifications are sent
8. ✅ Original proposal remains accessible
9. ✅ Proper error handling and user feedback
10. ✅ Works on all screen sizes

---

## 🎯 Next Steps

1. **Create Modal Component** (`ConvertToEngagementModal.vue`)
2. **Create History Component** (`ConversionHistory.vue`)
3. **Integrate into Detail Page** (add button and modal)
4. **Integrate into Dashboard** (quick action)
5. **Test end-to-end flow**
6. **User acceptance testing**

---

**Status**: Ready for implementation  
**Owner**: Frontend Developer  
**Estimated Completion**: 1-2 days
