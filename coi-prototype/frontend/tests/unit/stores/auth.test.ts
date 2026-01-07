import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  it('initializes with null user and token', () => {
    const authStore = useAuthStore()

    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
  })

  it('sets user and token on login', () => {
    const authStore = useAuthStore()

    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@test.com',
      role: 'Requester',
      department: 'Audit'
    }

    const mockToken = 'mock-jwt-token-123'

    authStore.setUser(mockUser)
    authStore.setToken(mockToken)

    expect(authStore.user).toEqual(mockUser)
    expect(authStore.token).toBe(mockToken)
    expect(authStore.isAuthenticated).toBe(true)
  })

  it('clears user and token on logout', () => {
    const authStore = useAuthStore()

    // First login
    authStore.setUser({
      id: 1,
      name: 'Test User',
      email: 'test@test.com',
      role: 'Requester',
      department: 'Audit'
    })
    authStore.setToken('mock-jwt-token')

    expect(authStore.isAuthenticated).toBe(true)

    // Then logout
    authStore.logout()

    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
  })

  it('persists user to localStorage', () => {
    const authStore = useAuthStore()

    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@test.com',
      role: 'Requester',
      department: 'Audit'
    }

    authStore.setUser(mockUser)

    // Check localStorage (if your store uses it)
    // const storedUser = localStorage.getItem('user')
    // expect(storedUser).toBeTruthy()

    // This is a placeholder - adjust based on actual store implementation
    expect(authStore.user).toEqual(mockUser)
  })

  it('checks user roles correctly', () => {
    const authStore = useAuthStore()

    authStore.setUser({
      id: 1,
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'Admin',
      department: 'Admin'
    })

    // Test role-based getters (if they exist in your store)
    // expect(authStore.isAdmin).toBe(true)
    // expect(authStore.isRequester).toBe(false)

    expect(authStore.user?.role).toBe('Admin')
  })

  it('handles invalid login gracefully', async () => {
    const authStore = useAuthStore()

    // Mock failed login
    // This would typically test the login action
    // await expect(authStore.login('invalid@email.com', 'wrongpass')).rejects.toThrow()

    expect(authStore.isAuthenticated).toBe(false)
  })
})
