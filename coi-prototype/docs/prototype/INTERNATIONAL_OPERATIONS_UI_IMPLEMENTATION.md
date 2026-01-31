# International Operations UI Implementation

## ✅ Completed

### 1. Kuwait Service List (Default)
- **Status**: ✅ Implemented
- **Behavior**: COI new request form uses Kuwait list (39 services) by default
- **API**: `GET /api/integration/service-types?entity={code}&international=false`
- **Categories**: 6 categories (Advisory grouped)

### 2. Global Service List (International Operations)
- **Status**: ✅ Implemented
- **Behavior**: When `international_operations = true`, uses global list (177+ services)
- **API**: `GET /api/integration/service-types?entity={code}&international=true`
- **Categories**: 26+ categories (all separate)

### 3. International Operations Form Card
- **Component**: `InternationalOperationsForm.vue`
- **Location**: `coi-prototype/frontend/src/components/coi/InternationalOperationsForm.vue`
- **Features**:
  - ✅ Separate UI card with blue gradient header
  - ✅ All Global COI Form fields
  - ✅ International countries section with add/remove
  - ✅ Export to Excel button
  - ✅ Form validation
  - ✅ Auto-saves data

### 4. Excel Export Functionality
- **Backend Route**: `POST /api/global/generate-excel`
- **Controller**: `globalCOIFormController.js`
- **Features**:
  - ✅ Generates Excel from form data (before submission)
  - ✅ Generates Excel from existing request (after submission)
  - ✅ Two sheets: "Global COI Form" and "Services List"
  - ✅ Matches BDO Global COI Form format

---

## 🎨 UI Structure

### COI Request Form Flow:

```
Section 1: Requestor Info
Section 2: Document Type
Section 3: Client Details
Section 4: Service Info (Uses Kuwait List - 39 services)
Section 5: Ownership
Section 6: Signatories
Section 7: International Operations
  ├─ Checkbox: "Client has international operations"
  └─ [If checked] Global COI Form Card
      ├─ Client Information
      ├─ Engagement Information
      ├─ International Countries
      └─ Export to Excel Button
```

---

## 📋 Global COI Form Fields

### Client Information:
- Client Name *
- Ultimate Parent Company
- Location *
- Client Type * (Existing/Potential)
- Client is PIE * (Yes/No)

### Engagement Information:
- Service Description *
- Nature of Engagement *
- Industry Sector
- Website
- Engagement Involves Another Party (Yes/No)

### International Operations:
- Countries (multiple)
  - Country Code
  - Entity Name

---

## 🔄 Data Flow

### 1. Form Submission:
```javascript
formData = {
  // ... regular COI fields ...
  international_operations: true,
  global_coi_form_data: {
    clientName: "...",
    ultimateParentCompany: "...",
    // ... all Global COI Form fields ...
    countries: [...]
  }
}
```

### 2. Service Types Loading:
```javascript
// Default (Kuwait List)
fetchServiceTypes() // international=false → 39 services, 6 categories

// International Operations (Global List)
fetchServiceTypes() // international=true → 177+ services, 26+ categories
```

### 3. Excel Export:
```javascript
// Before submission (from form data)
POST /api/global/generate-excel
Body: { clientName, ultimateParentCompany, ... }

// After submission (from request ID)
GET /api/global/export-excel/:requestId
```

---

## 📁 Files Created/Modified

### New Files:
1. ✅ `coi-prototype/frontend/src/components/coi/InternationalOperationsForm.vue`
2. ✅ `coi-prototype/backend/src/controllers/globalCOIFormController.js`

### Modified Files:
1. ✅ `coi-prototype/frontend/src/views/COIRequestForm.vue`
   - Added InternationalOperationsForm component
   - Updated service types to use Kuwait list by default
   - Added globalCOIFormData handling

2. ✅ `coi-prototype/backend/src/routes/global.routes.js`
   - Added `POST /api/global/generate-excel` route

---

## 🎯 Key Features

### 1. Kuwait List by Default
- ✅ Service types API returns Kuwait list (39 services) when `international=false`
- ✅ Form explicitly sets `international=false` by default
- ✅ Only switches to global list when checkbox is checked

### 2. International Operations Card
- ✅ Appears only when `international_operations = true`
- ✅ Standalone form with all Global COI Form fields
- ✅ Separate from regular COI form fields
- ✅ Can be exported to Excel independently

### 3. Excel Export
- ✅ Works before request submission (from form data)
- ✅ Works after request submission (from request ID)
- ✅ Generates proper Excel format matching BDO Global template
- ✅ Two sheets: Form data + Services list

---

## 🚀 Usage

### For Users:

1. **Regular COI Request** (Kuwait operations):
   - Fill out form normally
   - Service types show Kuwait list (39 services, 6 categories)
   - No international operations card

2. **International COI Request**:
   - Check "Client has international operations"
   - Service types switch to global list (177+ services, 26+ categories)
   - Global COI Form card appears
   - Fill out Global COI Form fields
   - Click "Export to Excel" to download
   - Submit request

### For Developers:

```typescript
// Component usage
<InternationalOperationsForm
  :request-id="formData.id"
  :initial-data="globalCOIFormData"
  :countries="countries"
  @update:data="handleGlobalCOIFormUpdate"
/>

// API calls
// Export from form data
POST /api/global/generate-excel
Body: { clientName, ultimateParentCompany, ... }

// Export from request
GET /api/global/export-excel/:requestId
```

---

## ✅ Testing Checklist

- [ ] Kuwait list loads by default (39 services, 6 categories)
- [ ] Global list loads when international_operations=true (177+ services, 26+ categories)
- [ ] International Operations card appears when checkbox checked
- [ ] Form fields save correctly
- [ ] Excel export works from form data
- [ ] Excel export works from request ID
- [ ] Excel file format matches BDO Global template
- [ ] Countries can be added/removed
- [ ] Form validation works

---

## 📊 Summary

- ✅ **Kuwait List**: Used by default (39 services, 6 categories)
- ✅ **Global List**: Used when international_operations=true (177+ services, 26+ categories)
- ✅ **UI Card**: Separate Global COI Form card for international operations
- ✅ **Excel Export**: Works from both form data and submitted requests
- ✅ **Integration**: Seamlessly integrated into COI request form
