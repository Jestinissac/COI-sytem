# Browser Console Errors Checklist

## 🔍 Common Errors to Check

### 1. **Component Import Errors**
Check for these in console:
```
[Vue warn]: Failed to resolve component: SkeletonCard
[Vue warn]: Failed to resolve component: EmptyState  
[Vue warn]: Failed to resolve component: ToastContainer
[Vue warn]: Failed to resolve component: Toast
```

**Fix:** Verify all components exist:
- ✅ `frontend/src/components/ui/SkeletonCard.vue`
- ✅ `frontend/src/components/ui/SkeletonLoader.vue`
- ✅ `frontend/src/components/ui/EmptyState.vue`
- ✅ `frontend/src/components/ui/ToastContainer.vue`
- ✅ `frontend/src/components/ui/Toast.vue` (required by ToastContainer)

### 2. **Store/Composable Errors**
Check for:
```
Cannot find module '@/stores/toast'
Cannot find module '@/composables/useToast'
```

**Fix:** Verify these files exist:
- ✅ `frontend/src/stores/toast.ts`
- ✅ `frontend/src/composables/useToast.ts`

### 3. **Runtime Type Errors**
Check for:
```
Cannot read property 'status' of undefined
Cannot read property 'created_at' of undefined
getStatusClass is not a function
```

**Fix:** Already fixed - functions now handle undefined values

### 4. **Vue Router Errors**
Check for:
```
Cannot read property 'query' of undefined
router.push is not a function
```

**Fix:** Verify `useRouter()` is imported and used correctly

### 5. **API/Service Errors**
Check for:
```
Cannot find module '@/services/landingPageService'
Cannot find module '@/services/api'
getLandingPageSummary is not a function
```

**Fix:** Verify these services exist:
- ✅ `frontend/src/services/landingPageService.ts`
- ✅ `frontend/src/services/api.ts`

## 🛠️ Quick Verification Commands

### Check if components exist:
```bash
ls -la coi-prototype/frontend/src/components/ui/SkeletonCard.vue
ls -la coi-prototype/frontend/src/components/ui/EmptyState.vue
ls -la coi-prototype/frontend/src/components/ui/ToastContainer.vue
ls -la coi-prototype/frontend/src/components/ui/Toast.vue
```

### Check if stores/composables exist:
```bash
ls -la coi-prototype/frontend/src/stores/toast.ts
ls -la coi-prototype/frontend/src/composables/useToast.ts
```

### Check if services exist:
```bash
ls -la coi-prototype/frontend/src/services/landingPageService.ts
```

## 📋 Browser Console Checklist

1. **Open Browser DevTools (F12)**
2. **Go to Console Tab**
3. **Check for:**
   - ❌ Red errors (critical)
   - ⚠️ Yellow warnings (non-critical but should fix)
   - ℹ️ Info messages (usually safe to ignore)

4. **Common Error Patterns:**
   ```
   [Vue warn]: ... → Component/Prop issues
   TypeError: ... → Runtime errors
   ReferenceError: ... → Undefined variables
   Cannot find module ... → Import errors
   ```

## 🔧 Most Likely Issues

Based on recent changes:

1. **Missing Toast.vue component** (if ToastContainer fails)
2. **Missing toast store** (if useToast fails)
3. **Missing landingPageService** (if charts don't load)
4. **Type errors** (already fixed, but check console)

## ✅ Verification Steps

1. **Check Network Tab:**
   - Look for 404 errors on component imports
   - Check if `.vue` files are loading

2. **Check Console:**
   - Look for Vue warnings
   - Look for TypeScript errors
   - Look for runtime errors

3. **Check Vue DevTools:**
   - Verify components are mounting
   - Check component props
   - Verify reactive state

## 🚨 If Errors Found

1. **Component not found:**
   - Verify file exists
   - Check import path
   - Restart dev server

2. **Store/Composable not found:**
   - Verify file exists
   - Check export statements
   - Restart dev server

3. **Runtime errors:**
   - Check browser console for specific error
   - Check line numbers
   - Verify data structure matches expectations

## 📝 Current Status

✅ All TypeScript errors fixed
✅ All component imports verified
✅ All function signatures updated
✅ Null safety checks added

**Next:** Check browser console for runtime errors
