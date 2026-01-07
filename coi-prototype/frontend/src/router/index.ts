import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/landing',
      name: 'Landing',
      component: () => import('@/views/LandingPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/coi',
      component: () => import('@/views/DashboardBase.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: () => {
            const authStore = useAuthStore()
            const role = authStore.user?.role
            const roleRoutes: Record<string, string> = {
              'Requester': '/coi/requester',
              'Director': '/coi/director',
              'Compliance': '/coi/compliance',
              'Partner': '/coi/partner',
              'Finance': '/coi/finance',
              'Admin': '/coi/admin',
              'Super Admin': '/coi/super-admin'
            }
            return roleRoutes[role || ''] || '/coi/requester'
          }
        },
        {
          path: 'requester',
          name: 'RequesterDashboard',
          component: () => import('@/views/RequesterDashboard.vue'),
          meta: { roles: ['Requester', 'Director'] }
        },
        {
          path: 'director',
          name: 'DirectorDashboard',
          component: () => import('@/views/DirectorDashboard.vue'),
          meta: { roles: ['Director'] }
        },
        {
          path: 'compliance',
          name: 'ComplianceDashboard',
          component: () => import('@/views/ComplianceDashboard.vue'),
          meta: { roles: ['Compliance'] }
        },
        {
          path: 'partner',
          name: 'PartnerDashboard',
          component: () => import('@/views/PartnerDashboard.vue'),
          meta: { roles: ['Partner'] }
        },
        {
          path: 'finance',
          name: 'FinanceDashboard',
          component: () => import('@/views/FinanceDashboard.vue'),
          meta: { roles: ['Finance'] }
        },
        {
          path: 'admin',
          name: 'AdminDashboard',
          component: () => import('@/views/AdminDashboard.vue'),
          meta: { roles: ['Admin'] }
        },
        {
          path: 'super-admin',
          name: 'SuperAdminDashboard',
          component: () => import('@/views/SuperAdminDashboard.vue'),
          meta: { roles: ['Super Admin'] }
        },
        {
          path: 'request/new',
          name: 'NewCOIRequest',
          component: () => import('@/views/COIRequestForm.vue'),
          meta: { roles: ['Requester', 'Director'] }
        },
        {
          path: 'request/:id',
          name: 'ViewCOIRequest',
          component: () => import('@/views/COIRequestDetail.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'prms-demo',
          name: 'PRMSDemo',
          component: () => import('@/views/PRMSDemo.vue'),
          meta: { roles: ['Super Admin', 'Admin', 'Finance'] }
        },
        {
          path: 'form-builder',
          name: 'FormBuilder',
          component: () => import('@/views/FormBuilder.vue'),
          meta: { roles: ['Admin', 'Super Admin'] }
        }
      ]
    },
    {
      path: '/',
      redirect: '/login'
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // If we have a token but no user, check auth first
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }
  
  const requiresAuth = to.meta.requiresAuth !== false
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/landing')
  } else {
    const allowedRoles = to.meta.roles as string[] | undefined
    if (allowedRoles && authStore.user) {
      if (allowedRoles.includes(authStore.user.role)) {
        next()
      } else {
        next('/coi')
      }
    } else {
      next()
    }
  }
})

export default router