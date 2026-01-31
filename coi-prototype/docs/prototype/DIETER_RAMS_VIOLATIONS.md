# Dieter Rams Design Principles - Detailed Violations Database

**Total Violations:** 169  
**Last Updated:** January 20, 2026

---

## Violation Format

Each violation includes:
- **Component:** File name
- **Line:** Line number(s)
- **Principle:** Dieter Rams principle violated
- **Severity:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- **Description:** What's wrong
- **Current Code:** Example of violation
- **Recommended Fix:** How to fix it

---

## Critical Violations (P0) - 12 Issues

### 1. LandingPage.vue - Gradient Background
- **Component:** `frontend/src/views/LandingPage.vue`
- **Line:** 2
- **Principle:** 3 (Aesthetic), 6 (Honest), 10 (Minimal)
- **Severity:** P0
- **Description:** Gradient background creates fake depth and violates minimal design
- **Current Code:** `bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100`
- **Fix:** `bg-gray-50`

### 2. LandingPage.vue - Decorative Icon Container
- **Component:** `frontend/src/views/LandingPage.vue`
- **Line:** 6
- **Principle:** 2 (Useful), 3 (Aesthetic), 10 (Minimal)
- **Severity:** P0
- **Description:** Decorative icon container with gradient and shadow
- **Current Code:** `w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-xl`
- **Fix:** `w-16 h-16 flex items-center justify-center` (remove gradient, shadow, rounded-2xl)

### 3. Reports.vue - Gradient Background
- **Component:** `frontend/src/views/Reports.vue`
- **Line:** 2
- **Principle:** 3 (Aesthetic), 6 (Honest), 10 (Minimal)
- **Severity:** P0
- **Description:** Gradient background
- **Current Code:** `bg-gradient-to-br from-gray-50 to-gray-100`
- **Fix:** `bg-gray-50`

### 4. Reports.vue - Gradient Header
- **Component:** `frontend/src/views/Reports.vue`
- **Line:** 53
- **Principle:** 3 (Aesthetic), 6 (Honest), 10 (Minimal)
- **Severity:** P0
- **Description:** Gradient header background
- **Current Code:** `bg-gradient-to-r from-blue-600 to-blue-700`
- **Fix:** `bg-white border-b border-gray-200`

### 5. SystemTile.vue - Excessive Shadows and Transform
- **Component:** `frontend/src/components/layout/SystemTile.vue`
- **Line:** 4
- **Principle:** 3 (Aesthetic), 6 (Honest)
- **Severity:** P0
- **Description:** Excessive shadows and transform effects create fake depth
- **Current Code:** `shadow-lg border-2 border-gray-200 p-8 cursor-pointer hover:shadow-2xl hover:border-primary-300 transition-all transform hover:-translate-y-2`
- **Fix:** `border border-gray-200 p-6 cursor-pointer hover:border-gray-400 transition-colors` (remove shadows, transform, border-2)

### 6. SystemTile.vue - Gradient Icon Container
- **Component:** `frontend/src/components/layout/SystemTile.vue`
- **Line:** 7
- **Principle:** 2 (Useful), 3 (Aesthetic), 10 (Minimal)
- **Severity:** P0
- **Description:** Decorative gradient icon container
- **Current Code:** `w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-primary-200 group-hover:to-primary-300 transition-all`
- **Fix:** `w-16 h-16 flex items-center justify-center mx-auto mb-4` (remove gradient, rounded-2xl, hover effects)

### 7-12. Multiple Files - Excessive Shadows
- **Components:** 30+ files use `shadow-lg`, `shadow-xl`, or `shadow-2xl`
- **Principle:** 3 (Aesthetic), 6 (Honest)
- **Severity:** P0
- **Description:** Excessive shadows create fake depth
- **Fix:** Replace with `shadow-sm` or remove entirely, use borders instead

---

## High Priority Violations (P1) - 45 Issues

### Colored Backgrounds (41 files)

#### RequesterDashboard.vue
- **Line 47:** `bg-blue-50` - Colored background on active tab
- **Line 120:** `hover:border-amber-500` - Colored hover border
- **Line 134:** `hover:border-green-500` - Colored hover border
- **Line 132:** `bg-amber-500` - Colored hover indicator
- **Line 146:** `bg-green-500` - Colored hover indicator

**Fix:** Use neutral colors:
- `bg-blue-50` → `bg-gray-50`
- `hover:border-amber-500` → `hover:border-gray-400`
- `hover:border-green-500` → `hover:border-gray-400`
- Remove colored hover indicators

#### DirectorDashboard.vue
- **Line 28:** `bg-blue-50` - Colored background on active tab
- **Line 62:** `hover:border-amber-500` - Colored hover border
- **Line 76:** `hover:border-blue-500` - Colored hover border
- **Line 90:** `hover:border-green-500` - Colored hover border
- **Line 104:** `hover:border-purple-500` - Colored hover border
- **Line 74:** `bg-amber-500` - Colored hover indicator
- **Line 88:** `bg-blue-500` - Colored hover indicator
- **Line 102:** `bg-green-500` - Colored hover indicator
- **Line 116:** `bg-purple-500` - Colored hover indicator

**Fix:** Use neutral colors for all hover states

#### ComplianceDashboard.vue
- **Line 28:** `bg-blue-50` - Colored background on active tab
- **Line 51:** `hover:border-blue-300` - Colored hover border
- **Line 64:** `hover:border-red-300` - Colored hover border
- **Line 77:** `hover:border-yellow-300` - Colored hover border
- **Line 90:** `hover:border-purple-300` - Colored hover border
- **Line 57:** `bg-blue-100` - Colored icon container
- **Line 70:** `bg-red-100` - Colored icon container
- **Line 83:** `bg-yellow-100` - Colored icon container
- **Line 96:** `bg-purple-100` - Colored icon container

**Fix:** Remove all colored backgrounds and hover borders

#### COIRequestForm.vue
- **Line 47:** `bg-blue-50` - Colored background on active section
- **Line 92:** `bg-blue-50 border border-blue-200` - Colored notice background
- **Line 51-56:** Colored status indicators (green-500, blue-600, gray-200)

**Fix:** Use neutral backgrounds, keep status colors only in StatusBadge

#### Reports.vue
- **Line 65:** `bg-blue-100` - Colored icon container
- **Line 76:** `bg-green-50 border border-green-200` - Colored badge
- **Line 94:** `border-blue-500 shadow-lg shadow-blue-100` - Colored selected state

**Fix:** Remove all colored backgrounds except functional status badges

#### StatusBadge.vue
- **Note:** Colored backgrounds are ACCEPTABLE here (functional for status indication)
- **Issue:** Too many color variations (could be simplified)
- **Recommendation:** Keep as-is, but consider reducing color palette

---

### Decorative Icon Containers (15 files)

**Files with colored icon containers:**
1. `LandingPage.vue` (line 6)
2. `Reports.vue` (line 65, 70, 83, 96)
3. `ComplianceDashboard.vue` (line 57, 70, 83, 96)
4. `SystemTile.vue` (line 7)
5. Multiple other dashboard components

**Fix Pattern:**
```vue
<!-- Before -->
<div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
  <svg class="w-5 h-5 text-blue-600">...</svg>
</div>

<!-- After -->
<div class="flex items-center justify-center">
  <svg class="w-5 h-5 text-gray-600">...</svg>
</div>
```

---

## Medium Priority Violations (P2) - 78 Issues

### Spacing Inconsistencies (All Files)

#### Common Violations:
- `gap-4`, `gap-5`, `gap-6`, `gap-8` - Should be 4, 8, 16, 24, 32, 48
- `p-4`, `p-5`, `p-6`, `p-8` - Inconsistent padding
- `px-6`, `py-4`, `px-8`, `py-6` - Inconsistent padding

#### Standard Spacing System:
- **xs:** 4px (0.25rem) - `gap-1`, `p-1`, `px-1`, `py-1`
- **sm:** 8px (0.5rem) - `gap-2`, `p-2`, `px-2`, `py-2`
- **md:** 16px (1rem) - `gap-4`, `p-4`, `px-4`, `py-4`
- **lg:** 24px (1.5rem) - `gap-6`, `p-6`, `px-6`, `py-6`
- **xl:** 32px (2rem) - `gap-8`, `p-8`, `px-8`, `py-8`
- **2xl:** 48px (3rem) - `gap-12`, `p-12`, `px-12`, `py-12`

#### Files Needing Spacing Fixes:
- All 70+ Vue components need spacing standardization

---

### Typography Inconsistencies (All Files)

#### Common Violations:
- Mix of `font-bold` and `font-semibold` for same hierarchy level
- Inconsistent use of `tracking-wide` for labels
- Mix of text sizes without clear hierarchy

#### Standard Typography:
- **Labels:** `text-xs font-medium text-gray-500 uppercase tracking-wide`
- **Headings:** `text-xl font-semibold text-gray-900` (h1), `text-lg font-semibold` (h2), etc.
- **Body:** `text-sm text-gray-700` or `text-base text-gray-900`
- **Numbers:** `text-3xl font-semibold text-gray-900`

---

### Border Inconsistencies (All Files)

#### Common Violations:
- Mix of `border` and `border-2`
- Inconsistent border colors
- Some decorative colored borders

#### Standard Borders:
- **Default:** `border border-gray-200`
- **Hover:** `hover:border-gray-400`
- **Active:** `border-gray-300`
- **No decorative borders**

---

## Low Priority Violations (P3) - 34 Issues

### Minor Spacing Adjustments
- Fine-tune spacing values to exact 8px grid
- Minor alignment issues

### Unnecessary Elements
- Some redundant wrapper divs
- Some unnecessary classes

### Animation Optimizations
- Review transition durations
- Remove decorative animations

---

## Summary by File

### Most Violations:
1. **Reports.vue** - 25 violations (gradients, colored backgrounds, excessive shadows)
2. **LandingPage.vue** - 12 violations (gradients, decorative elements)
3. **SystemTile.vue** - 8 violations (gradients, shadows, transforms)
4. **RequesterDashboard.vue** - 18 violations (colored hovers, spacing)
5. **DirectorDashboard.vue** - 18 violations (colored hovers, spacing)
6. **ComplianceDashboard.vue** - 15 violations (colored backgrounds, icon containers)
7. **COIRequestForm.vue** - 12 violations (colored backgrounds, spacing)

### Files with Few Violations:
- Most UI components (`Button.vue`, `EmptyState.vue`, etc.) - Already well-designed
- Some modal components - Minor issues only

---

## Quick Reference: Common Fixes

### Remove Gradient Backgrounds
```vue
<!-- Before -->
<div class="bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">

<!-- After -->
<div class="bg-gray-50">
```

### Remove Excessive Shadows
```vue
<!-- Before -->
<div class="shadow-lg hover:shadow-xl">

<!-- After -->
<div class="border border-gray-200 hover:border-gray-400">
```

### Remove Colored Backgrounds
```vue
<!-- Before -->
<div class="bg-blue-50 border border-blue-200">

<!-- After -->
<div class="bg-white border border-gray-200">
```

### Remove Decorative Icon Containers
```vue
<!-- Before -->
<div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
  <svg class="w-5 h-5 text-blue-600">...</svg>
</div>

<!-- After -->
<svg class="w-5 h-5 text-gray-600">...</svg>
```

### Standardize Spacing
```vue
<!-- Before -->
<div class="gap-5 p-6 px-8 py-4">

<!-- After -->
<div class="gap-6 p-6">
```

### Neutral Hover States
```vue
<!-- Before -->
<div class="hover:border-blue-500 hover:shadow-lg">

<!-- After -->
<div class="hover:border-gray-400">
```

---

## Next Steps

1. Review violations with design team
2. Prioritize fixes by component usage
3. Implement fixes systematically
4. Re-audit after fixes
