<template>
  <div class="permission-config-page">
    <div class="page-header">
      <h1>Permission Configuration</h1>
      <p class="subtitle">Manage role-based permissions dynamically</p>
    </div>
    
    <div v-if="loading" class="loading-state">
      Loading permissions...
    </div>
    
    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="loadPermissions" class="retry-btn">Retry</button>
    </div>
    
    <template v-else>
      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label for="category-filter">Category:</label>
          <select id="category-filter" v-model="selectedCategory" class="filter-select">
            <option value="">All Categories</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="role-filter">Role:</label>
          <select id="role-filter" v-model="selectedRole" class="filter-select">
            <option value="">All Roles</option>
            <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
          </select>
        </div>
        <button @click="resetToDefaults" class="reset-btn" :disabled="saving">
          Reset to Defaults
        </button>
      </div>
      
      <!-- Permission Matrix -->
      <div class="permission-matrix">
        <table class="permission-table">
          <thead>
            <tr>
              <th class="sticky-col">Permission</th>
              <th v-for="role in roles" :key="role" class="role-header">
                {{ role }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="category in filteredCategories" :key="category">
              <tr class="category-row">
                <td colspan="100%" class="category-header">
                  {{ category }}
                </td>
              </tr>
              <tr
                v-for="permission in getPermissionsByCategory(category)"
                :key="permission.permission_key"
                class="permission-row"
              >
                <td class="permission-info sticky-col">
                  <div class="permission-name">{{ permission.name }}</div>
                  <div class="permission-key">{{ permission.permission_key }}</div>
                  <div v-if="permission.description" class="permission-desc">
                    {{ permission.description }}
                  </div>
                </td>
                <td
                  v-for="role in roles"
                  :key="`${permission.permission_key}-${role}`"
                  class="permission-cell"
                >
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      :checked="isPermissionGranted(role, permission.permission_key)"
                      :disabled="role === 'Super Admin' || saving"
                      @change="togglePermission(role, permission.permission_key, ($event.target as HTMLInputElement)?.checked ?? false)"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      
      <!-- Audit Log -->
      <div class="audit-section">
        <h2>Recent Permission Changes</h2>
        <div class="audit-log">
          <div v-if="auditLogs.length === 0" class="empty-state">
            No permission changes recorded
          </div>
          <div
            v-for="log in auditLogs"
            :key="log.id"
            class="audit-entry"
          >
            <div class="audit-meta">
              <span class="audit-action" :class="log.action">
                {{ log.action === 'granted' ? 'Granted' : 'Revoked' }}
              </span>
              <span class="audit-permission">{{ log.permission_key }}</span>
              <span class="audit-role">{{ log.role }}</span>
            </div>
            <div class="audit-details">
              <span class="audit-user">by {{ log.changed_by_name || 'System' }}</span>
              <span class="audit-time">{{ formatDate(log.changed_at) }}</span>
            </div>
            <div v-if="log.reason" class="audit-reason">
              Reason: {{ log.reason }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const { success, error: showError } = useToast()

interface Permission {
  id: number
  permission_key: string
  name: string
  description: string
  category: string
  is_system: boolean
}

interface RolePermission {
  role: string
  permission_key: string
  is_granted: boolean
}

interface AuditLog {
  id: number
  role: string
  permission_key: string
  action: 'granted' | 'revoked'
  changed_by: number
  changed_by_name?: string
  changed_at: string
  reason?: string
}

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const permissions = ref<Permission[]>([])
const rolePermissions = ref<Map<string, RolePermission>>(new Map())
const auditLogs = ref<AuditLog[]>([])
const selectedCategory = ref('')
const selectedRole = ref('')

const roles = ['Requester', 'Director', 'Compliance', 'Partner', 'Finance', 'Admin', 'Super Admin']

const categories = computed(() => {
  const cats = new Set<string>()
  permissions.value.forEach(p => cats.add(p.category))
  return Array.from(cats).sort()
})

const filteredCategories = computed(() => {
  if (!selectedCategory.value) return categories.value
  return [selectedCategory.value]
})

function getPermissionsByCategory(category: string): Permission[] {
  return permissions.value
    .filter(p => p.category === category)
    .sort((a, b) => a.name.localeCompare(b.name))
}

function isPermissionGranted(role: string, permissionKey: string): boolean {
  if (role === 'Super Admin') return true // Super Admin has all permissions
  
  const key = `${role}:${permissionKey}`
  const rolePerm = rolePermissions.value.get(key)
  return rolePerm?.is_granted === true
}

async function loadPermissions() {
  loading.value = true
  error.value = null
  
  try {
    // Load all permissions
    const permsResponse = await api.get('/permissions/all')
    permissions.value = permsResponse.data.permissions || []
    
    // Load role permissions for all roles
    const rolePermsMap = new Map<string, RolePermission>()
    for (const role of roles) {
      if (role === 'Super Admin') continue // Super Admin handled separately
      
      try {
        const roleResponse = await api.get(`/permissions/role/${role}`)
        const rolePerms = roleResponse.data.permissions || []
        rolePerms.forEach((rp: any) => {
          const key = `${role}:${rp.permission_key}`
          rolePermsMap.set(key, {
            role,
            permission_key: rp.permission_key,
            is_granted: rp.is_granted === true || rp.is_granted === 1
          })
        })
      } catch (err) {
        console.error(`Failed to load permissions for ${role}:`, err)
      }
    }
    
    rolePermissions.value = rolePermsMap
    
    // Load audit log
    await loadAuditLog()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load permissions'
    showError(error.value ?? 'Failed to load permissions')
  } finally {
    loading.value = false
  }
}

async function togglePermission(role: string, permissionKey: string, granted: boolean) {
  if (role === 'Super Admin') {
    showError('Cannot modify Super Admin permissions')
    return
  }
  
  saving.value = true
  
  try {
    if (granted) {
      await api.post(`/permissions/grant`, {
        role,
        permission_key: permissionKey
      })
    } else {
      await api.post(`/permissions/revoke`, {
        role,
        permission_key: permissionKey
      })
    }
    
    // Update local state
    const key = `${role}:${permissionKey}`
    rolePermissions.value.set(key, {
      role,
      permission_key: permissionKey,
      is_granted: granted
    })
    
    // Reload audit log
    await loadAuditLog()
    
    success(`Permission ${granted ? 'granted' : 'revoked'} successfully`)
  } catch (err: any) {
    showError(err.response?.data?.error || 'Failed to update permission')
    // Reload to revert UI state
    await loadPermissions()
  } finally {
    saving.value = false
  }
}

async function resetToDefaults() {
  if (!confirm('Are you sure you want to reset all permissions to defaults? This will overwrite current settings.')) {
    return
  }
  
  saving.value = true
  
  try {
    await api.post('/permissions/reset-defaults')
    success('Permissions reset to defaults')
    await loadPermissions()
  } catch (err: any) {
    showError(err.response?.data?.error || 'Failed to reset permissions')
  } finally {
    saving.value = false
  }
}

async function loadAuditLog() {
  try {
    const response = await api.get('/permissions/audit-log', {
      params: { limit: 50 }
    })
    auditLogs.value = response.data.logs || []
  } catch (err) {
    console.error('Failed to load audit log:', err)
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadPermissions()
})
</script>

<style scoped>
.permission-config-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 48px;
  color: #6b7280;
}

.error-state {
  color: #dc2626;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.filters-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.reset-btn {
  padding: 6px 16px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-left: auto;
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.permission-matrix {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 32px;
}

.permission-table {
  width: 100%;
  border-collapse: collapse;
}

.permission-table thead {
  background: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.permission-table th {
  padding: 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
}

.sticky-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 5;
}

.category-row {
  background: #f9fafb;
}

.category-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
}

.permission-row {
  border-bottom: 1px solid #f3f4f6;
}

.permission-row:hover {
  background: #f9fafb;
}

.permission-info {
  padding: 16px;
  min-width: 300px;
  max-width: 400px;
}

.permission-name {
  font-weight: 500;
  font-size: 14px;
  color: #111827;
  margin-bottom: 4px;
}

.permission-key {
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
  margin-bottom: 4px;
}

.permission-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.role-header {
  text-align: center;
  min-width: 120px;
  padding: 12px 8px;
}

.permission-cell {
  text-align: center;
  padding: 16px 8px;
}

.toggle-switch {
  display: inline-block;
  position: relative;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  border-radius: 24px;
  transition: 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #2563eb;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-switch input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.audit-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
}

.audit-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.audit-log {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #6b7280;
  font-size: 14px;
}

.audit-entry {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.audit-entry:last-child {
  border-bottom: none;
}

.audit-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 4px;
}

.audit-action {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.audit-action.granted {
  background: #d1fae5;
  color: #065f46;
}

.audit-action.revoked {
  background: #fee2e2;
  color: #991b1b;
}

.audit-permission {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
}

.audit-role {
  font-size: 12px;
  color: #374151;
  font-weight: 500;
}

.audit-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.audit-reason {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}
</style>
