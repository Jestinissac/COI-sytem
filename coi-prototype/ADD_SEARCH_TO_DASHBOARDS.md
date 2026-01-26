# Add Search to All Dashboards - Implementation Guide

**Status:** In Progress  
**Date:** January 25, 2026

---

## Implementation Pattern

For each dashboard, add:

### 1. Imports
```typescript
import GlobalSearch from '@/components/ui/GlobalSearch.vue'
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal.vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
```

### 2. State Variables
```typescript
const showSearch = ref(false)

// Keyboard shortcuts
const { 
  registerShortcuts, 
  showHelpModal, 
  toggleHelp, 
  getShortcutGroups, 
  formatShortcutKey 
} = useKeyboardShortcuts()
```

### 3. Register Shortcuts in onMounted
```typescript
onMounted(() => {
  // ... existing code ...
  
  registerShortcuts([
    {
      key: 'k',
      description: 'Open search',
      handler: () => { showSearch.value = true },
      modifier: 'ctrl',
      group: 'Navigation'
    },
    {
      key: '/',
      description: 'Show keyboard shortcuts',
      handler: toggleHelp,
      modifier: 'ctrl',
      group: 'General'
    }
  ])
})
```

### 4. Add Components to Template
```vue
<!-- Keyboard Shortcuts Modal -->
<KeyboardShortcutsModal
  :is-open="showHelpModal"
  :shortcut-groups="getShortcutGroups()"
  :format-key="formatShortcutKey"
  @close="showHelpModal = false"
/>

<!-- Global Search -->
<GlobalSearch
  :is-open="showSearch"
  :user-role="authStore.user?.role"
  :user-id="authStore.user?.id"
  :user-department="authStore.user?.department"
  @close="showSearch = false"
/>
```

---

## Role-Based Search Filtering

The GlobalSearch component automatically filters based on role:

- **Requester**: Only their own requests
- **Director**: Department requests + team members
- **Compliance**: All requests (backend filtered)
- **Partner**: All requests
- **Finance**: All requests
- **Admin**: All requests + system config
- **Super Admin**: Everything + system config

---

## Status

- ✅ AdminDashboard - COMPLETE
- ✅ RequesterDashboard - COMPLETE
- ✅ DirectorDashboard - COMPLETE
- ⏳ ComplianceDashboard - PENDING
- ⏳ PartnerDashboard - PENDING
- ⏳ FinanceDashboard - PENDING
- ⏳ SuperAdminDashboard - PENDING
