# Keyboard Shortcuts Debug Guide

**Date:** January 25, 2026  
**Platform:** Mac (M1 Pro)  
**Browser:** Chrome/Edge/Safari

---

## Quick Debug Steps

### 1. Open Developer Tools
- **Mac:** `⌘ + Option + I` (Command + Option + I)
- Or right-click → "Inspect"

### 2. Check Console
Look for these messages when the page loads:

```
[Keyboard Shortcuts] Event listener attached { platform: 'MacIntel', isMac: true, shortcutsRegistered: 8 }
[Keyboard Shortcuts] Registered: cmd+k Open search
[Keyboard Shortcuts] Registered: cmd+/ Show keyboard shortcuts
[Keyboard Shortcuts] Registered: g o Go to Overview
...
```

### 3. Test a Shortcut
Press `⌘ + K` and check console for:

```
[Keyboard] Key pressed: k { ctrlKey: false, metaKey: true, ... }
[Keyboard] Normalized key: cmd+k Available shortcuts: ['cmd+k', 'cmd+/', 'g o', ...]
[Keyboard] Checking modifier shortcut: cmd+k Found: true
[Keyboard] ✅ Matched modifier shortcut: cmd+k Open search
```

---

## Common Issues & Solutions

### Issue 1: "Event listener attached" not appearing

**Problem:** Component not mounting or composable not being called

**Solution:**
1. Check if AdminDashboard component is actually loaded
2. Verify `useKeyboardShortcuts()` is called in the component
3. Check for JavaScript errors preventing execution

### Issue 2: Shortcuts registered but not working

**Problem:** Event listener not catching events

**Check:**
1. Look for `[Keyboard] Key pressed:` messages when pressing keys
2. If no messages, event listener might not be attached
3. Check if another script is preventing event propagation

### Issue 3: Normalized key doesn't match

**Problem:** Key normalization not working correctly

**Check:**
- Mac should show `cmd+k` not `ctrl+k`
- Verify `navigator.platform` detection
- Check if `metaKey` is being detected

### Issue 4: Handler not executing

**Problem:** Shortcut matches but handler doesn't run

**Check:**
1. Look for `✅ Matched modifier shortcut` message
2. Check for error messages after match
3. Verify handler function is defined correctly

---

## Debug Checklist

### ✅ Initialization
- [ ] Console shows "Event listener attached"
- [ ] Console shows shortcuts being registered
- [ ] `shortcutsRegistered` count matches expected number

### ✅ Key Press Detection
- [ ] Console shows "[Keyboard] Key pressed" when pressing keys
- [ ] `metaKey: true` when pressing ⌘ on Mac
- [ ] `ctrlKey: false` on Mac (should be false)

### ✅ Key Normalization
- [ ] Normalized key shows `cmd+k` (not `ctrl+k`) on Mac
- [ ] Available shortcuts list includes the shortcut you're testing

### ✅ Shortcut Matching
- [ ] Console shows "Checking modifier shortcut"
- [ ] "Found: true" for the shortcut you're testing
- [ ] Console shows "✅ Matched modifier shortcut"

### ✅ Handler Execution
- [ ] No error messages after match
- [ ] Expected action happens (modal opens, navigation occurs)

---

## Testing Each Shortcut

### Test 1: Search (`⌘ + K`)

**Expected Console Output:**
```
[Keyboard] Key pressed: k { metaKey: true, ... }
[Keyboard] Normalized key: cmd+k
[Keyboard] Checking modifier shortcut: cmd+k Found: true
[Keyboard] ✅ Matched modifier shortcut: cmd+k Open search
```

**Expected Behavior:** Search modal opens

### Test 2: Help (`⌘ + /`)

**Expected Console Output:**
```
[Keyboard] Key pressed: / { metaKey: true, ... }
[Keyboard] Normalized key: cmd+/
[Keyboard] Checking modifier shortcut: cmd+/ Found: true
[Keyboard] ✅ Matched modifier shortcut: cmd+/ Show keyboard shortcuts
```

**Expected Behavior:** Help modal opens

### Test 3: Navigation (`G` then `O`)

**Expected Console Output:**
```
[Keyboard] Key pressed: g { metaKey: false, ... }
[Keyboard] Normalized key: g
[Keyboard] Starting sequence: g

[Keyboard] Key pressed: o { metaKey: false, ... }
[Keyboard] Normalized key: o
[Keyboard] ✅ Matched sequence: g o Go to Overview
```

**Expected Behavior:** Overview tab becomes active

---

## Browser-Specific Notes

### Chrome/Edge
- Developer Tools: `⌘ + Option + I`
- Console: `⌘ + Option + J`
- Should work perfectly

### Safari
- Developer Tools: Enable in Preferences → Advanced
- Then `⌘ + Option + I`
- May have different event handling

### Firefox
- Developer Tools: `⌘ + Option + I`
- Should work, but test thoroughly

---

## If Nothing Works

### Step 1: Verify Code is Loaded
```javascript
// In console, type:
window.addEventListener('keydown', (e) => console.log('Key:', e.key, 'Meta:', e.metaKey))
```
Press `⌘ + K` - you should see the log. If not, browser is blocking events.

### Step 2: Check for Conflicts
```javascript
// In console, check all keydown listeners:
getEventListeners(document)
```
Look for other listeners that might be preventing propagation.

### Step 3: Test Direct Registration
```javascript
// In console, manually test:
document.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 'k') {
    console.log('⌘+K detected!')
    e.preventDefault()
  }
})
```
Press `⌘ + K` - should see message. If not, something is blocking.

---

## Expected Shortcuts on Mac

| Shortcut | Normalized Key | Description |
|----------|---------------|-------------|
| `⌘ + K` | `cmd+k` | Open search |
| `⌘ + /` | `cmd+/` | Show help |
| `G` then `O` | `g o` | Go to Overview |
| `G` then `E` | `g e` | Go to Execution |
| `G` then `M` | `g m` | Go to Monitoring |

---

## Quick Test Script

Paste this in the browser console to test:

```javascript
// Test keyboard shortcut system
console.log('=== Keyboard Shortcuts Test ===')
console.log('Platform:', navigator.platform)
console.log('Is Mac:', navigator.platform.toUpperCase().indexOf('MAC') >= 0)

// Test event detection
document.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 'k') {
    console.log('✅ ⌘+K detected!')
    e.preventDefault()
  }
}, true)

console.log('Test listener attached. Press ⌘+K to test.')
```

---

## Still Not Working?

1. **Check browser extensions** - Some extensions block keyboard events
2. **Try incognito mode** - Rules out extension conflicts
3. **Check for JavaScript errors** - Red errors in console
4. **Verify Vue is loaded** - Check if Vue app is mounted
5. **Check component mounting** - Verify AdminDashboard is actually rendered

---

*Last updated: January 25, 2026*
