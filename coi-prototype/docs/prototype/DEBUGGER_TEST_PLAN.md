# Debugger Test Plan - Global Search Implementation

**Date:** January 25, 2026  
**Feature:** Global Search with Role-Based Filtering  
**Status:** Ready for Testing

---

## Test Objectives

1. Verify search functionality works across all user roles
2. Verify role-based filtering prevents unauthorized data access
3. Verify keyboard shortcuts work on Mac and Windows
4. Verify user journeys are complete with search integration
5. Verify business logic compliance
6. Verify design compliance (Dieter Rams)

---

## Test Environment Setup

### Prerequisites
1. Backend server running (`npm run dev` in `coi-prototype/backend`)
2. Frontend server running (`npm run dev` in `coi-prototype/frontend`)
3. Database seeded with test data
4. Multiple test users with different roles

### Test Users
- **Requester:** patricia.white@company.com
- **Director:** john.smith@company.com
- **Compliance:** emily.davis@company.com
- **Partner:** robert.taylor@company.com
- **Finance:** lisa.thomas@company.com
- **Admin:** james.jackson@company.com
- **Super Admin:** admin@company.com

---

## Test Cases

### TC1: Requester Search Journey

**Objective:** Verify Requester can search only their own requests

**Steps:**
1. Login as Requester (patricia.white@company.com)
2. Navigate to Requester Dashboard
3. Press `⌘/Ctrl + K` to open search
4. Verify search modal opens
5. Type "COI-2026" in search box
6. Verify only Requester's own requests appear
7. Verify no other users' requests appear
8. Click on a search result
9. Verify navigation to request detail page works
10. Search for a client name
11. Verify client results appear
12. Click on client result
13. Verify navigation works

**Expected Results:**
- ✅ Search modal opens with `⌘/Ctrl + K`
- ✅ Only Requester's requests appear in results
- ✅ No other users' requests visible
- ✅ Navigation via search results works
- ✅ Client search works

**Business Logic:**
- ✅ Data segregation enforced (Requester only sees own data)
- ✅ No unauthorized data access

---

### TC2: Director Search Journey

**Objective:** Verify Director can search department requests + team members

**Steps:**
1. Login as Director (john.smith@company.com)
2. Navigate to Director Dashboard
3. Press `⌘/Ctrl + K` to open search
4. Type department request ID
5. Verify department requests appear
6. Verify team member requests appear
7. Verify other departments' requests do NOT appear
8. Search for client name
9. Verify all clients appear (for selection)
10. Navigate via search result

**Expected Results:**
- ✅ Department requests visible
- ✅ Team member requests visible
- ✅ Other departments' requests NOT visible
- ✅ Client search works
- ✅ Navigation works

**Business Logic:**
- ✅ Department segregation enforced
- ✅ Team member access works
- ✅ No cross-department data access

---

### TC3: Compliance Search Journey

**Objective:** Verify Compliance can search all requests

**Steps:**
1. Login as Compliance (emily.davis@company.com)
2. Navigate to Compliance Dashboard
3. Press `⌘/Ctrl + K` to open search
4. Type any request ID
5. Verify all requests appear (backend filtered)
6. Search for client name
7. Verify all clients appear
8. Verify user search does NOT appear
9. Navigate via search result

**Expected Results:**
- ✅ All requests visible (backend filtered)
- ✅ All clients visible
- ✅ User search NOT available
- ✅ Navigation works

**Business Logic:**
- ✅ Compliance sees all requests
- ✅ No user search access (correct)
- ✅ Backend filtering works

---

### TC4: Admin Search Journey

**Objective:** Verify Admin can search everything including users

**Steps:**
1. Login as Admin (james.jackson@company.com)
2. Navigate to Admin Dashboard
3. Press `⌘/Ctrl + K` to open search
4. Search for request ID
5. Verify all requests appear
6. Search for user name
7. Verify user results appear
8. Search for navigation item (e.g., "SLA Configuration")
9. Verify navigation items appear
10. Click on navigation result
11. Verify navigation works
12. Search for client name
13. Verify all clients appear

**Expected Results:**
- ✅ All requests visible
- ✅ User search works
- ✅ Navigation items appear
- ✅ All clients visible
- ✅ Navigation works

**Business Logic:**
- ✅ Admin has full access
- ✅ User search available
- ✅ Navigation shortcuts work

---

### TC5: Super Admin Search Journey

**Objective:** Verify Super Admin has full access

**Steps:**
1. Login as Super Admin
2. Navigate to Super Admin Dashboard
3. Press `⌘/Ctrl + K` to open search
4. Verify all search types work:
   - Requests
   - Clients
   - Users
   - Navigation items
5. Verify all results appear
6. Navigate via search results

**Expected Results:**
- ✅ All search types work
- ✅ All results visible
- ✅ Navigation works

**Business Logic:**
- ✅ Super Admin has full access
- ✅ All features available

---

### TC6: Keyboard Shortcuts - Mac

**Objective:** Verify keyboard shortcuts work on Mac

**Steps:**
1. Login as any user (Mac)
2. Press `⌘ + K`
3. Verify search opens
4. Press `⌘ + /`
5. Verify help modal opens
6. Press `Esc`
7. Verify modal closes
8. Test sequence shortcuts (Admin only):
   - Press `G` then `O` (Go to Overview)
   - Press `G` then `E` (Go to Execution Queue)
   - Press `G` then `C` (Go to Configuration)

**Expected Results:**
- ✅ `⌘ + K` opens search
- ✅ `⌘ + /` opens help
- ✅ `Esc` closes modals
- ✅ Sequence shortcuts work (Admin)

**Platform:** Mac (⌘ key)

---

### TC7: Keyboard Shortcuts - Windows/Linux

**Objective:** Verify keyboard shortcuts work on Windows/Linux

**Steps:**
1. Login as any user (Windows/Linux)
2. Press `Ctrl + K`
3. Verify search opens
4. Press `Ctrl + /`
5. Verify help modal opens
6. Press `Esc`
7. Verify modal closes
8. Test sequence shortcuts (Admin only):
   - Press `G` then `O` (Go to Overview)
   - Press `G` then `E` (Go to Execution Queue)
   - Press `G` then `C` (Go to Configuration)

**Expected Results:**
- ✅ `Ctrl + K` opens search
- ✅ `Ctrl + /` opens help
- ✅ `Esc` closes modals
- ✅ Sequence shortcuts work (Admin)

**Platform:** Windows/Linux (Ctrl key)

---

### TC8: Role-Based Security Test

**Objective:** Verify unauthorized data access is prevented

**Steps:**
1. Login as Requester
2. Open browser console
3. Open search modal
4. Check network requests
5. Verify API only returns Requester's requests
6. Try to search for another user's request ID
7. Verify request does NOT appear
8. Login as Director
9. Search for other department's request
10. Verify request does NOT appear
11. Login as Compliance
12. Verify can see all requests (correct)
13. Verify cannot search users (correct)

**Expected Results:**
- ✅ API filters by role
- ✅ Frontend filters by role
- ✅ No unauthorized data visible
- ✅ Double-layer security works

**Security:**
- ✅ Frontend filtering
- ✅ Backend filtering
- ✅ No data leakage

---

### TC9: Error Handling

**Objective:** Verify error handling works correctly

**Steps:**
1. Login as any user
2. Open search modal
3. Type query with no results (e.g., "XYZ123NOTFOUND")
4. Verify "No results" message appears
5. Disconnect network
6. Try to search
7. Verify error message appears
8. Reconnect network
9. Verify search works again
10. Type very short query (1 character)
11. Verify "Type at least 2 characters" message appears

**Expected Results:**
- ✅ "No results" message appears
- ✅ Network error handled gracefully
- ✅ Minimum query length enforced
- ✅ Error messages are clear

---

### TC10: Design Compliance

**Objective:** Verify design follows Dieter Rams principles

**Steps:**
1. Open search modal
2. Inspect component styling
3. Verify:
   - No gradient backgrounds
   - No decorative colored backgrounds
   - Spacing follows 8px grid
   - Colors match approved palette
   - Minimal shadows (`shadow-sm`)
   - Neutral borders
   - Clean, minimal design

**Expected Results:**
- ✅ No design violations
- ✅ Follows Dieter Rams principles
- ✅ Consistent with system design

---

## Test Execution Checklist

### Pre-Test
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Database seeded
- [ ] Test users available
- [ ] Browser console open (for debugging)

### Test Execution
- [ ] TC1: Requester Search Journey
- [ ] TC2: Director Search Journey
- [ ] TC3: Compliance Search Journey
- [ ] TC4: Admin Search Journey
- [ ] TC5: Super Admin Search Journey
- [ ] TC6: Keyboard Shortcuts - Mac
- [ ] TC7: Keyboard Shortcuts - Windows/Linux
- [ ] TC8: Role-Based Security Test
- [ ] TC9: Error Handling
- [ ] TC10: Design Compliance

### Post-Test
- [ ] Document any issues found
- [ ] Verify all tests pass
- [ ] Update test results

---

## Expected Test Results

### ✅ All Tests Should Pass
- Search functionality works for all roles
- Role-based filtering prevents unauthorized access
- Keyboard shortcuts work on all platforms
- User journeys are complete
- Business logic is enforced
- Design is compliant

### ⚠️ Known Issues
- Pre-existing TypeScript build errors (not related to search)
- These don't affect runtime functionality

---

## Test Results Template

```
Test Case: TC1 - Requester Search Journey
Status: ✅ PASS / ❌ FAIL
Notes: [Any issues found]

Test Case: TC2 - Director Search Journey
Status: ✅ PASS / ❌ FAIL
Notes: [Any issues found]

...
```

---

## Debugging Tips

### If Search Doesn't Open
1. Check browser console for errors
2. Verify keyboard shortcut listener is attached
3. Check if another component is capturing the event
4. Verify `useKeyboardShortcuts` is initialized

### If Results Don't Appear
1. Check network tab for API calls
2. Verify API returns data
3. Check console for filtering errors
4. Verify role-based filtering logic

### If Navigation Doesn't Work
1. Check router configuration
2. Verify route paths are correct
3. Check console for navigation errors
4. Verify search result route format

---

**Test Plan Created:** January 25, 2026  
**Ready for Debugger Execution**
