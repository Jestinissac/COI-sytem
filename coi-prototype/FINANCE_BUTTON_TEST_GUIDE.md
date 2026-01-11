# Finance "Generate Code" Button - Manual Test Guide

## 🎯 Quick Test Summary

**Status**: Fix applied ✅ (Changed `type="submit" @click.prevent` to `type="button" @click`)
**Ready to test**: Yes
**Expected outcome**: Button should now work and generate engagement codes

---

## 📋 Pre-Test Checklist

- [x] Backend running on port 3000
- [x] Frontend running on port 5173
- [x] 4 pending finance requests created
- [x] Fix applied to CodeGenerationModal.vue (line 204-205)

---

## 🧪 Manual Test Steps

### Step 1: Navigate to Finance Dashboard

1. Open browser to: **http://localhost:5173/coi/finance**
2. If not logged in, use:
   - **Email**: `lisa.thomas@company.com`
   - **Password**: `password`

### Step 2: Open DevTools

Press **F12** (or Cmd+Option+I on Mac) to open DevTools

**Important tabs to watch:**
- **Console** - Shows `[CodeGenerationModal]` debug logs
- **Network** - Shows API requests to `generate-code`

### Step 3: Access Pending Requests

1. Click the **"Pending Finance"** tab
2. You should see **4 requests** with "Generate Code" buttons

### Step 4: Open Code Generation Modal

1. Click **"Generate Code"** button for any request
2. Modal should open with title: "Generate Engagement Code"
3. You should see:
   - Request information (Request ID, Client, Service Type, Department)
   - Code preview showing: `ENG-2026-XXX-#####`
   - Three required fields (Credit Terms, Currency, Risk Assessment)
   - Optional fields (Pending Amount, Notes)
   - "Generate Code" button (should be disabled/grayed)

### Step 5: Fill Required Fields

Fill in the form:
1. **Credit Terms**: Select "Net 30"
2. **Currency**: Select "KWD - Kuwaiti Dinar"
3. **Risk Assessment**: Select "Medium"

**Watch the button**: It should become **enabled** (blue, not grayed out) after filling all three fields.

### Step 6: Click Generate Code

1. Click the **"Generate Code"** button
2. Button should show "Generating..." with a spinner

**In Console tab, you should see:**
```
[CodeGenerationModal] generateCode called
[CodeGenerationModal] Form state: { credit_terms: "Net 30", currency: "KWD", risk_assessment: "Medium" }
[CodeGenerationModal] Generating code for request: [ID]
[CodeGenerationModal] Request payload: { financial_parameters: {...} }
[CodeGenerationModal] API Response received: { success: true, ... }
[CodeGenerationModal] Code generated successfully: ENG-2026-XXX-XXXXX
```

**In Network tab, you should see:**
- Request: `POST /api/coi/requests/[ID]/generate-code`
- Status: `200 OK`
- Response: `{"success":true,"engagement_code":"ENG-2026-XXX-XXXXX",...}`

### Step 7: Verify Success

After 1-2 seconds, you should see:
1. ✅ Green success message: "Engagement code generated successfully! Financial parameters have been saved."
2. 📋 The generated engagement code displayed (e.g., `ENG-2026-TAX-00009`)
3. ✅ Green "Generated" badge next to the code
4. 📄 "Copy" button to copy the code to clipboard
5. ✅ "Done" button (replaces "Generate Code" button)

### Step 8: Verify in Dashboard

1. Click **"Done"** to close the modal
2. The request should now show the engagement code instead of "Generate Code" button
3. Code should be visible in the table (e.g., `ENG-2026-TAX-00009`)

---

## 🔍 What to Check in Console

### ✅ Success Indicators

Look for these console logs (in order):

1. **Button clicked**:
   ```
   [CodeGenerationModal] generateCode called
   ```

2. **Form validated**:
   ```
   [CodeGenerationModal] Form state: {credit_terms: "Net 30", currency: "KWD", risk_assessment: "Medium", isFormValid: true}
   ```

3. **API request sent**:
   ```
   [CodeGenerationModal] Generating code for request: 29
   [CodeGenerationModal] Request payload: {"financial_parameters":{...}}
   ```

4. **API response received**:
   ```
   [CodeGenerationModal] API Response received: {success: true, engagement_code: "ENG-2026-TAX-00009", ...}
   [CodeGenerationModal] Response status: 200
   ```

5. **Code generated**:
   ```
   [CodeGenerationModal] Code generated successfully: ENG-2026-TAX-00009
   ```

### ❌ Error Indicators

If you see any of these, the test failed:

1. **Form validation error**:
   ```
   [CodeGenerationModal] Form validation failed
   ```

2. **Missing request ID**:
   ```
   [CodeGenerationModal] Request ID missing
   ```

3. **API error**:
   ```
   [CodeGenerationModal] Error generating code: [error message]
   [CodeGenerationModal] Error details: {message: ..., response: {...}, status: ...}
   ```

4. **No response data**:
   ```
   [CodeGenerationModal] No engagement code in response: {...}
   ```

---

## 🔍 What to Check in Network Tab

### Request Details

1. **Method**: POST
2. **URL**: `http://localhost:3000/api/coi/requests/[ID]/generate-code`
3. **Status**: 200 OK
4. **Headers**:
   - `Authorization: Bearer [JWT token]`
   - `Content-Type: application/json`

5. **Request Payload**:
```json
{
  "financial_parameters": {
    "credit_terms": "Net 30",
    "currency": "KWD",
    "risk_assessment": "Medium",
    "pending_amount": null,
    "notes": ""
  }
}
```

6. **Response**:
```json
{
  "success": true,
  "engagement_code": "ENG-2026-TAX-00009",
  "message": "Engagement code generated successfully"
}
```

---

## 🐛 Troubleshooting

### Issue: Button stays disabled after filling form

**Check**:
1. Are all three fields actually filled? (Check dropdown values in inspector)
2. Console log: Look for `isFormValid: false`
3. Inspect the button element - does it have `disabled` attribute?

**Solution**: If fields are filled but button disabled, there's still a validation issue.

---

### Issue: No console logs appear when clicking button

**Check**:
1. Is modal actually open?
2. Did you click the correct button? (Modal has TWO buttons - Cancel and Generate Code)
3. Is button actually clickable? (Not covered by another element)

**Solution**: Try clicking in the center of the button. Check z-index of modal.

---

### Issue: Console logs show error

**Check the error message**:
- "Request ID missing" → Request object structure issue
- "Form validation failed" → Field values not properly set
- API error → Backend issue (check backend console)

---

### Issue: Network request returns 400/500

**Check Network tab response**:
- 400: Validation error (missing required fields, invalid status, etc.)
- 401: Authentication error (token expired/invalid)
- 404: Request not found
- 500: Server error (check backend console)

---

## ✅ Success Criteria

The test passes if ALL of these are true:

1. ✅ Modal opens when clicking "Generate Code"
2. ✅ Button is disabled with empty form
3. ✅ Button enables after filling all 3 required fields
4. ✅ Clicking button shows "Generating..." state
5. ✅ Console shows all expected log messages
6. ✅ Network shows POST request with 200 response
7. ✅ Engagement code appears in modal (ENG-2026-XXX-XXXXX format)
8. ✅ Success message displays
9. ✅ "Done" button appears
10. ✅ Code shows in dashboard table after closing modal

---

## 📊 Test Results Template

Fill this out after testing:

```
Date: _____________
Tester: _____________

✅ / ❌  Modal opens
✅ / ❌  Button disabled when empty
✅ / ❌  Button enabled when filled
✅ / ❌  Console logs appear
✅ / ❌  Network request sent
✅ / ❌  API returns 200
✅ / ❌  Engagement code generated
✅ / ❌  Success message shown
✅ / ❌  Code visible in table

Engagement Code Generated: ___________________

Notes/Issues:
_________________________________________________
_________________________________________________
```

---

## 🔧 The Fix Applied

**File**: `frontend/src/components/finance/CodeGenerationModal.vue`
**Line**: 204-205

**Before** (Had conflicting handlers):
```vue
<button
  type="submit"
  @click.prevent="generateCode"
  ...
>
```

**After** (Single clear handler):
```vue
<button
  type="button"
  @click="generateCode"
  ...
>
```

**Why this fixes it**:
- `type="button"` prevents form auto-submission
- `@click` (without `.prevent`) allows handler to execute normally
- Removes conflict between form submit and button click

---

## 📞 Need Help?

If the button still doesn't work after the fix:

1. **Share console logs**: Copy all `[CodeGenerationModal]` logs
2. **Share network response**: Copy the API response from Network tab
3. **Share screenshot**: Take screenshot of the filled form with button state
4. **Check fix was applied**: Verify line 204 shows `type="button"` not `type="submit"`

---

**Generated**: 2026-01-11
**Fix Applied**: Yes ✅
**Backend Tested**: Yes ✅ (API works perfectly)
**Frontend Test**: Ready for manual verification
