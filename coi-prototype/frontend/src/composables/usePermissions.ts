import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

/**
 * Permission Composable
 * Provides permission checking functions for components
 * 
 * Usage:
 * ```ts
 * const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
 * 
 * // In template
 * <button v-if="hasPermission('email.config.edit')">Edit</button>
 * ```
 */

interface Permission {
  id: number
  permission_key: string
  name: string
  description: string
  category: string
  is_granted: boolean
}

// Cache permissions per role to avoid repeated API calls
const permissionsCache = new Map<string, Permission[]>()
const cacheTimestamp = new Map<string, number>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch permissions for current user's role
 */
async function fetchRolePermissions(role: string): Promise<Permission[]> {
  // Check cache first
  const cached = permissionsCache.get(role)
  const timestamp = cacheTimestamp.get(role)
  const now = Date.now()
  
  if (cached && timestamp && (now - timestamp) < CACHE_DURATION) {
    return cached
  }
  
  try {
    const response = await api.get(`/permissions/role/${role}`)
    const permissions = response.data.permissions || []
    
    // Update cache
    permissionsCache.set(role, permissions)
    cacheTimestamp.set(role, now)
    
    return permissions
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
    // Return empty array on error (fail closed - no permissions)
    return []
  }
}

export function usePermissions() {
  const authStore = useAuthStore()
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Get current user's role
  const userRole = computed(() => authStore.user?.role)
  
  // Load permissions for current role
  async function loadPermissions() {
    if (!userRole.value) {
      permissions.value = []
      return
    }
    
    // Super Admin has all permissions by default (handled on backend)
    if (userRole.value === 'Super Admin') {
      // Fetch all permissions to show in UI
      try {
        const response = await api.get('/permissions/all')
        permissions.value = (response.data.permissions || []).map((p: Permission) => ({
          ...p,
          is_granted: true // Super Admin has all permissions
        }))
      } catch (err) {
        console.error('Failed to fetch all permissions:', err)
        permissions.value = []
      }
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      const rolePerms = await fetchRolePermissions(userRole.value)
      permissions.value = rolePerms
    } catch (err: any) {
      error.value = err.message || 'Failed to load permissions'
      permissions.value = []
    } finally {
      loading.value = false
    }
  }
  
  // Check if user has a specific permission
  const hasPermission = computed(() => {
    return (permissionKey: string): boolean => {
      if (!userRole.value) return false
      
      // Super Admin has all permissions
      if (userRole.value === 'Super Admin') return true
      
      // Find permission in loaded permissions
      const permission = permissions.value.find(
        p => p.permission_key === permissionKey
      )
      
      return permission?.is_granted === true
    }
  })
  
  // Check if user has any of the specified permissions
  const hasAnyPermission = computed(() => {
    return (permissionKeys: string[]): boolean => {
      if (!userRole.value) return false
      
      // Super Admin has all permissions
      if (userRole.value === 'Super Admin') return true
      
      return permissionKeys.some(key => {
        const permission = permissions.value.find(
          p => p.permission_key === key
        )
        return permission?.is_granted === true
      })
    }
  })
  
  // Check if user has all of the specified permissions
  const hasAllPermissions = computed(() => {
    return (permissionKeys: string[]): boolean => {
      if (!userRole.value) return false
      
      // Super Admin has all permissions
      if (userRole.value === 'Super Admin') return true
      
      return permissionKeys.every(key => {
        const permission = permissions.value.find(
          p => p.permission_key === key
        )
        return permission?.is_granted === true
      })
    }
  })
  
  // Check if user can access a route based on route meta
  const canAccess = computed(() => {
    return (route: any): boolean => {
      if (!userRole.value) return false
      
      // Super Admin can access everything
      if (userRole.value === 'Super Admin') return true
      
      // Check route meta for roles
      if (route.meta?.roles) {
        const allowedRoles = Array.isArray(route.meta.roles)
          ? route.meta.roles
          : [route.meta.roles]
        
        return allowedRoles.includes(userRole.value)
      }
      
      // If no roles specified, allow access (backward compatibility)
      return true
    }
  })
  
  // Get permission by key
  const getPermission = computed(() => {
    return (permissionKey: string): Permission | undefined => {
      return permissions.value.find(p => p.permission_key === permissionKey)
    }
  })
  
  // Get permissions by category
  const getPermissionsByCategory = computed(() => {
    return (category: string): Permission[] => {
      return permissions.value.filter(p => p.category === category)
    }
  })
  
  // Clear cache (useful after permission changes)
  function clearCache() {
    permissionsCache.clear()
    cacheTimestamp.clear()
  }
  
  // Refresh permissions from server
  async function refreshPermissions() {
    clearCache()
    await loadPermissions()
  }
  
  // Auto-load permissions when role changes
  if (userRole.value) {
    loadPermissions()
  }
  
  return {
    // State
    permissions,
    loading,
    error,
    userRole,
    
    // Methods
    hasPermission: hasPermission.value,
    hasAnyPermission: hasAnyPermission.value,
    hasAllPermissions: hasAllPermissions.value,
    canAccess: canAccess.value,
    getPermission: getPermission.value,
    getPermissionsByCategory: getPermissionsByCategory.value,
    loadPermissions,
    refreshPermissions,
    clearCache
  }
}
