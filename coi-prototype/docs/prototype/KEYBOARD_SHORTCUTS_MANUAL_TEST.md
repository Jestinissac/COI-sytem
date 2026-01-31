# Keyboard Shortcuts Manual Test Guide

**Date:** January 25, 2026  
**Browser:** Chrome/Edge/Safari on Mac  
**Status:** Ready for Testing

---

## Pre-Test Setup

### 1. Open Admin Dashboard
1. Navigate to: `http://localhost:5173/coi/admin`
2. If redirected to login, use:
   - **Email:** `james.jackson@company.com`
   - **Password:** `password`

### 2. Open Developer Console
- Press: `⌘ + Option + I` (Command + Option + I)
- Or: Right-click → "Inspect" → Console tab

### 3. Clear Console
- Click the 🚫 icon or press `⌘ + K` in console

---

## Test 1: Initialization Check

### Expected Console Output (on page load)

Look for these messages:

```
[AdminDashboard] Registering keyboard shortcuts
[Keyboard Shortcuts] Registered: cmd+k Open search { originalModifier: 'ctrl', normalizedModifier: 'cmd', isMac: true }
[Keyboard Shortcuts] Registered: cmd+/ Show keyboard shortcuts { originalModifier: 'ctrl', normalizedModifier: 'cmd', isMac: true }
[Keyboard Shortcuts] Registered: g o Go to Overview { ... }
[Keyboard Shortcuts] Registered: g e Go to Execution Queue { ... }
[Keyboard Shortcuts] Registered: g m Go to Monitoring { ... }
[Keyboard Shortcuts] Registered: g r Go to Renewals { ... }
[Keyboard Shortcuts] Registered: g u Go to User Management { ... }
[Keyboard Shortcuts] Registered: g c Go to Configuration { ... }
[Keyboard Shortcuts] Event listener attached { platform: 'MacIntel', isMac: true, shortcutsRegistered: 8 }
```

### ✅ Pass Criteria
- [ ] See "Event listener attached" message
- [ ] `isMac: true` (if on Mac)
- [ ] `shortcutsRegistered: 8` (all shortcuts registered)
- [ ] All shortcuts show `normalizedModifier: 'cmd'` (not 'ctrl')

### ❌ Fail Indicators
- No console messages → Component not loading
- `normalizedModifier: 'ctrl'` on Mac → Bug not fixed
- `shortcutsRegistered: 0` → Shortcuts not registering

---

## Test 2: Search Shortcut (⌘ + K)

### Steps
1. Click anywhere on the page (not in an input field)
2. Press: `⌘ + K` (Command + K)

### Expected Console Output

```
[Keyboard] Key pressed: k { metaKey: true, ctrlKey: false, shiftKey: false, altKey: false, shortcutsCount: 8, activeElement: 'BODY' }
[Keyboard] Normalized key: cmd+k Available shortcuts: ['cmd+k', 'cmd+/', 'g o', 'g e', 'g m', 'g r', 'g u', 'g c']
[Keyboard] Checking modifier shortcut: cmd+k Found: true
[Keyboard] ✅ Matched modifier shortcut: cmd+k Open search
```

### Expected Behavior
- ✅ Search modal opens (overlay with search input)
- ✅ Search input is focused
- ✅ Can type to search

### ✅ Pass Criteria
- [ ] Console shows "✅ Matched modifier shortcut: cmd+k"
- [ ] Search modal opens
- [ ] No errors in console

### ❌ Fail Indicators
- No console messages → Event listener not working
- "Found: false" → Shortcut not registered correctly
- "Normalized key: ctrl+k" on Mac → Normalization bug
- Modal doesn't open → Handler not executing

---

## Test 3: Help Shortcut (⌘ + /)

### Steps
1. Click anywhere on the page
2. Press: `⌘ + /` (Command + /)

### Expected Console Output

```
[Keyboard] Key pressed: / { metaKey: true, ctrlKey: false, ... }
[Keyboard] Normalized key: cmd+/ Available shortcuts: [...]
[Keyboard] Checking modifier shortcut: cmd+/ Found: true
[Keyboard] ✅ Matched modifier shortcut: cmd+/ Show keyboard shortcuts
```

### Expected Behavior
- ✅ Help modal opens showing all shortcuts
- ✅ Modal displays shortcuts grouped by category
- ✅ Shows `⌘` symbols (not "Ctrl")

### ✅ Pass Criteria
- [ ] Console shows "✅ Matched modifier shortcut: cmd+/"
- [ ] Help modal opens
- [ ] All shortcuts listed correctly
- [ ] Shows `⌘` symbols for Mac

---

## Test 4: Navigation Sequence (G then O)

### Steps
1. Click anywhere on the page
2. Press: `G` (single key)
3. Within 1 second, press: `O` (single key)

### Expected Console Output

**First key (G):**
```
[Keyboard] Key pressed: g { metaKey: false, ... }
[Keyboard] Normalized key: g Available shortcuts: [...]
```

**Second key (O):**
```
[Keyboard] Key pressed: o { metaKey: false, ... }
[Keyboard] Normalized key: o Available shortcuts: [...]
[Keyboard] ✅ Matched sequence: g o Go to Overview
```

### Expected Behavior
- ✅ Overview tab becomes active
- ✅ Overview content is displayed
- ✅ Left sidebar shows "Overview" as selected

### ✅ Pass Criteria
- [ ] Console shows sequence matching
- [ ] Overview tab activates
- [ ] Content changes to Overview

---

## Test 5: Other Navigation Sequences

### Test G then E (Execution Queue)
1. Press: `G` then `E`
2. ✅ Should navigate to Execution Queue tab

### Test G then M (Monitoring)
1. Press: `G` then `M`
2. ✅ Should navigate to Monitoring tab

### Test G then C (Configuration)
1. Press: `G` then `C`
2. ✅ Should navigate to Configuration tab

---

## Test 6: Input Field Behavior

### Steps
1. Click in any input field (if available)
2. Press: `⌘ + K`
3. Press: `G` (without modifier)

### Expected Behavior
- ✅ `⌘ + K` should still work (modifier keys work in inputs)
- ✅ `G` should NOT trigger navigation (single keys disabled in inputs)

### Expected Console Output

**When pressing G in input:**
```
[Keyboard] Key pressed: g { ... }
[Keyboard] Normalized key: g Available shortcuts: [...]
(No match - should return early due to isInput check)
```

---

## Test 7: Escape Key

### Steps
1. Open search modal (`⌘ + K`)
2. Press: `Esc`

### Expected Behavior
- ✅ Search modal closes
- ✅ Focus returns to page

---

## Common Issues & Solutions

### Issue 1: No Console Messages

**Symptoms:**
- No "[Keyboard] Key pressed" messages
- No "[Keyboard Shortcuts] Event listener attached"

**Possible Causes:**
- Component not mounting
- JavaScript errors preventing execution
- Event listener not attached

**Solution:**
1. Check for JavaScript errors (red messages in console)
2. Verify AdminDashboard component is loaded
3. Check if Vue app is mounted

### Issue 2: "Found: false" in Console

**Symptoms:**
- Console shows "Checking modifier shortcut: cmd+k Found: false"
- Shortcuts registered but not matching

**Possible Causes:**
- Modifier normalization mismatch
- Shortcut not registered correctly

**Solution:**
1. Check registration logs - should show `normalizedModifier: 'cmd'`
2. Check normalized key matches registered key
3. Verify platform detection is correct

### Issue 3: Handler Not Executing

**Symptoms:**
- Console shows "✅ Matched modifier shortcut"
- But modal doesn't open

**Possible Causes:**
- Handler function error
- Modal component not loaded
- State variable not reactive

**Solution:**
1. Check for error messages after match
2. Verify `showSearch.value = true` is being called
3. Check if GlobalSearch component is in template

---

## Quick Debug Commands

### Check if Event Listener is Attached

Paste in console:
```javascript
// Check all keydown listeners
getEventListeners(document).keydown
```

Should show at least one listener.

### Test Key Detection Manually

Paste in console:
```javascript
document.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 'k') {
    console.log('✅ ⌘+K detected manually!', e);
    e.preventDefault();
  }
}, true);
```

Press `⌘ + K` - should see message.

### Check Registered Shortcuts

Paste in console (if shortcuts Map is accessible):
```javascript
// This won't work if shortcuts is not exported, but try:
console.log('Shortcuts registered:', window.__shortcuts)
```

---

## Test Results Template

Copy and fill out:

```
=== Keyboard Shortcuts Test Results ===
Date: ___________
Browser: ___________
Platform: Mac / Windows / Linux

Test 1: Initialization
[ ] Pass [ ] Fail
Notes: ___________

Test 2: Search (⌘+K)
[ ] Pass [ ] Fail
Notes: ___________

Test 3: Help (⌘+/)
[ ] Pass [ ] Fail
Notes: ___________

Test 4: Navigation (G then O)
[ ] Pass [ ] Fail
Notes: ___________

Test 5: Other Navigation
[ ] Pass [ ] Fail
Notes: ___________

Test 6: Input Field Behavior
[ ] Pass [ ] Fail
Notes: ___________

Test 7: Escape Key
[ ] Pass [ ] Fail
Notes: ___________

Overall: [ ] All Pass [ ] Some Fail [ ] All Fail
```

---

## Success Criteria

**All tests pass if:**
- ✅ All shortcuts register correctly
- ✅ Modifier normalization works (cmd on Mac, ctrl on Windows)
- ✅ Search modal opens with ⌘+K
- ✅ Help modal opens with ⌘+/
- ✅ Navigation sequences work (G then O, etc.)
- ✅ Input field detection works correctly
- ✅ No JavaScript errors

---

*Manual test guide created: January 25, 2026*
