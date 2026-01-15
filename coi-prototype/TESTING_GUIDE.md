# Frontend Testing Guide - Service Catalog & Global COI Export

## 🧪 Testing Checklist

### Prerequisites
1. ✅ Backend server running on `http://localhost:3000`
2. ✅ Frontend server running on `http://localhost:5173`
3. ✅ Database initialized with:
   - Entity codes (2 entities: BDO Al Nisf & Partners, BDO Consulting)
   - Global service catalog (177 services)
4. ✅ Test user account created (any role for basic testing, Super Admin for entity management)

---

## 1. Entity Codes Management Testing

### Access: Super Admin Only

**Test Steps:**
1. Login as Super Admin
2. Navigate to `/coi/entity-codes` or click "Entity Codes" button in Super Admin Dashboard
3. Verify:
   - [ ] Page loads without errors
   - [ ] Shows list of 2 entities (BDO Al Nisf & Partners, BDO Consulting)
   - [ ] Entity codes, names, catalog modes, and status are displayed correctly

**Create Entity:**
1. Click "Add Entity" button
2. Fill form:
   - Entity Code: `TEST_ENTITY`
   - Entity Name: `Test Entity`
   - Display Name: `Test Entity Display`
   - Catalog Mode: `independent`
   - Default: unchecked
3. Click "Save"
4. Verify:
   - [ ] Entity appears in list
   - [ ] Success message or no error

**Edit Entity:**
1. Click "Edit" on any entity (except default)
2. Change entity name or catalog mode
3. Click "Save"
4. Verify:
   - [ ] Changes are saved
   - [ ] Updated values appear in list

**Delete Entity:**
1. Click "Delete" on a non-default entity
2. Confirm deletion
3. Verify:
   - [ ] Entity is removed from list
   - [ ] Default entity cannot be deleted

**Access Control:**
1. Logout and login as Admin (not Super Admin)
2. Try to access `/coi/entity-codes`
3. Verify:
   - [ ] Access denied or redirect
   - [ ] Error message shown

---

## 2. Service Catalog Management Testing

### Access: Super Admin, Admin, Compliance

**Test Steps:**
1. Login as Admin or Compliance
2. Navigate to `/coi/service-catalog` or click "Service Catalog" button
3. Verify:
   - [ ] Page loads without errors
   - [ ] Shows "Select entity..." message initially

**Select Entity:**
1. Select "BDO Al Nisf & Partners" from dropdown
2. Verify:
   - [ ] Three panels load:
     - Left: Global Catalog (read-only, 177 services)
     - Center: Entity Catalog (enabled services)
     - Right: Change History
   - [ ] Loading indicators appear during fetch

**Enable Service:**
1. In Global Catalog (left panel), click on a service
2. Verify:
   - [ ] Service appears in Entity Catalog (center panel)
   - [ ] Service shows checkmark in Global Catalog
   - [ ] History entry created (right panel)
   - [ ] History shows "enabled" action

**Disable Service:**
1. In Entity Catalog (center panel), click "Disable" (X icon) on an enabled service
2. Confirm deletion
3. Verify:
   - [ ] Service removed from Entity Catalog
   - [ ] Checkmark removed from Global Catalog
   - [ ] History entry created with "disabled" action

**Add Custom Service:**
1. Click "+ Custom Service" button
2. Fill form:
   - Category: `Advisory - Custom`
   - Service Name: `Custom Service Test`
   - Description: `Test custom service`
3. Click "Add Service"
4. Verify:
   - [ ] Custom service appears in Entity Catalog
   - [ ] Shows "Custom" badge
   - [ ] History entry created with "created" action

**Search Functionality:**
1. In Global Catalog search box, type "Audit"
2. Verify:
   - [ ] Only services matching "Audit" are shown
3. In Entity Catalog search box, type a service name
4. Verify:
   - [ ] Only matching enabled services are shown

**Export Catalog:**
1. Click "Export" button in header
2. Verify:
   - [ ] File downloads (JSON format)
   - [ ] Filename includes entity code and date

**Bulk Operations:**
1. Click "Bulk Actions" button
2. Verify:
   - [ ] Modal opens with options:
     - Copy from Another Entity
     - Bulk Enable Services
     - Bulk Disable Services
   - [ ] (Note: Full implementation may be pending)

**Access Control:**
1. Login as Requester (not Admin/Compliance)
2. Try to access `/coi/service-catalog`
3. Verify:
   - [ ] Access denied or redirect
   - [ ] Error message shown

---

## 3. COI Request Form Testing

### Entity Selection & Service Filtering

**Test Steps:**
1. Login as Requester
2. Navigate to `/coi/request/new`
3. Verify:
   - [ ] Entity dropdown is present
   - [ ] Entity dropdown is populated with entities
   - [ ] Default entity is pre-selected (if available)

**Entity Change:**
1. Select different entity from dropdown
2. Verify:
   - [ ] Service Type dropdown updates
   - [ ] Only services for selected entity are shown
   - [ ] Loading indicator appears during fetch

**International Operations:**
1. Check "International Operations" checkbox
2. Verify:
   - [ ] Service Type dropdown updates
   - [ ] Shows global services (all services)
   - [ ] Entity-specific filtering is bypassed

**Service Type Selection:**
1. With entity selected, open Service Type dropdown
2. Verify:
   - [ ] Services are grouped by category
   - [ ] Services match the selected entity
   - [ ] If no entity selected, shows "Select entity first" message

**Form Submission:**
1. Fill form with entity and service type selected
2. Submit form
3. Verify:
   - [ ] Request is created successfully
   - [ ] Entity and service type are saved correctly

---

## 4. Export Global COI Form Testing

### Compliance Dashboard

**Test Steps:**
1. Login as Compliance
2. Navigate to Compliance Dashboard
3. Find a request with `international_operations = true`
4. Verify:
   - [ ] "Export" button appears next to "Review" button
   - [ ] Export button is only visible for international requests

**Export Functionality:**
1. Click "Export" button
2. Verify:
   - [ ] Button shows "Exporting..." state
   - [ ] Excel file downloads
   - [ ] Filename format: `Global_COI_Form_{request_id}_{date}.xlsx`
   - [ ] File opens correctly in Excel
   - [ ] File contains pre-populated data from COI request

**Error Handling:**
1. Try to export a request without `international_operations`
2. Verify:
   - [ ] Error message shown
   - [ ] Export button not visible

**Access Control:**
1. Login as Requester (not Compliance)
2. Navigate to Compliance Dashboard (if accessible) or request detail
3. Verify:
   - [ ] Export button is not visible

---

## 5. COI Request Detail Testing

**Test Steps:**
1. Login as Compliance
2. Navigate to a request detail page (`/coi/request/{id}`)
3. Find a request with `international_operations = true`
4. Verify:
   - [ ] "Export Global COI Form" button appears in header
   - [ ] Button is only visible for Compliance role + international requests

**Export Functionality:**
1. Click "Export Global COI Form" button
2. Verify:
   - [ ] Button shows loading state
   - [ ] Excel file downloads
   - [ ] Filename is correct format
   - [ ] File contains request data

---

## 6. Integration Testing

### End-to-End Flow

**Test Scenario: Create Request with Entity Selection**
1. Login as Requester
2. Navigate to new request form
3. Select entity: "BDO Al Nisf & Partners"
4. Verify service types are filtered
5. Select a service type
6. Fill rest of form
7. Submit request
8. Verify request is created with correct entity and service type

**Test Scenario: Enable Service and Use in Form**
1. Login as Admin
2. Navigate to Service Catalog
3. Select "BDO Al Nisf & Partners"
4. Enable a service from Global Catalog
5. Logout and login as Requester
6. Create new request
7. Select "BDO Al Nisf & Partners" entity
8. Verify the enabled service appears in Service Type dropdown

**Test Scenario: Export Flow**
1. Create a request with `international_operations = true`
2. Submit and get approval (or use existing approved request)
3. Login as Compliance
4. Navigate to request detail
5. Click "Export Global COI Form"
6. Verify Excel file downloads with correct data

---

## 7. Error Handling Testing

**Test Cases:**
1. **Network Error:**
   - Disconnect network
   - Try to fetch entities
   - Verify error message shown

2. **Invalid Entity Code:**
   - Manually enter invalid entity code in URL
   - Verify 404 or error message

3. **Unauthorized Access:**
   - Try to access Super Admin pages as regular user
   - Verify access denied

4. **Empty States:**
   - Test with no entities in database
   - Test with no services in catalog
   - Verify appropriate empty state messages

---

## 8. Performance Testing

**Test Cases:**
1. **Large Service Catalog:**
   - Test with 500+ services in global catalog
   - Verify search performance
   - Verify rendering performance

2. **Multiple Entities:**
   - Test with 10+ entities
   - Verify entity selector performance

3. **History Loading:**
   - Test with 1000+ history entries
   - Verify pagination or lazy loading

---

## 9. Browser Compatibility

**Test Browsers:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Test Features:**
- [ ] File downloads work
- [ ] Modals display correctly
- [ ] Forms submit correctly
- [ ] API calls work

---

## 10. Mobile Responsiveness

**Test Cases:**
- [ ] Entity Codes Management is usable on mobile
- [ ] Service Catalog Management adapts to mobile (may need layout changes)
- [ ] COI Request Form is mobile-friendly
- [ ] Export buttons are accessible on mobile

---

## 🐛 Known Issues to Watch For

1. **Service Type Filtering:**
   - If entity is not selected, service types should show message
   - If international_operations is checked, should show all services

2. **Export Permissions:**
   - Only Compliance role should see export buttons
   - Only requests with `international_operations = true` should be exportable

3. **Entity Default:**
   - Default entity should be pre-selected in form
   - Default entity cannot be deleted

4. **History Tracking:**
   - All catalog changes should create history entries
   - History should show user who made change

---

## ✅ Success Criteria

All tests pass when:
- [ ] All components load without errors
- [ ] All API calls succeed (with proper authentication)
- [ ] Entity selection filters services correctly
- [ ] Export functionality works for Compliance users
- [ ] Access control works correctly
- [ ] Error handling shows user-friendly messages
- [ ] Loading states appear during async operations

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Environment: Development/Staging/Production

Entity Codes Management: [ ] Pass [ ] Fail
Service Catalog Management: [ ] Pass [ ] Fail
COI Request Form: [ ] Pass [ ] Fail
Export Functionality: [ ] Pass [ ] Fail
Access Control: [ ] Pass [ ] Fail

Issues Found:
1. 
2. 
3. 

Notes:
```
