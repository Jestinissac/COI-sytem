import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
// Note: Client Intelligence is now integrated into Business Development tab in dashboards

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
          path: 'international-operations-demo',
          name: 'InternationalOperationsDemo',
          component: () => import('@/views/InternationalOperationsDemo.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'request/:id',
          name: 'ViewCOIRequest',
          component: () => import('@/views/COIRequestDetail.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'my-tasks',
          name: 'MyTasks',
          component: () => import('@/views/MyTasks.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'my-day',
          name: 'MyDay',
          redirect: '/coi/my-tasks?tab=day'
        },
        {
          path: 'my-week',
          name: 'MyWeek',
          redirect: '/coi/my-tasks?tab=week'
        },
        {
          path: 'my-month',
          name: 'MyMonth',
          redirect: '/coi/my-tasks?tab=month'
        },
        {
          path: 'compliance/client-services',
          name: 'ComplianceClientServices',
          component: () => import('@/views/ComplianceClientServices.vue'),
          meta: { roles: ['Compliance', 'Partner', 'Super Admin'] }
        },
        {
          path: 'hrms/vacation-management',
          name: 'HRMSVacationManagement',
          component: () => import('@/views/HRMSVacationManagement.vue'),
          meta: { roles: ['Admin', 'Super Admin', 'Compliance'] }
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
          meta: { roles: ['Admin', 'Super Admin'], requiresPro: true }
        },
        {
          path: 'entity-codes',
          name: 'EntityCodesManagement',
          component: () => import('@/views/EntityCodesManagement.vue'),
          meta: { roles: ['Super Admin'] }
        },
        {
          path: 'service-catalog',
          name: 'ServiceCatalogManagement',
          component: () => import('@/views/ServiceCatalogManagement.vue'),
          meta: { roles: ['Super Admin', 'Admin', 'Compliance'] }
        },
        {
          path: 'reports',
          name: 'Reports',
          component: () => import('@/views/Reports.vue'),
          meta: { requiresAuth: true }
        },
        {
          // Redirect old client-intelligence route to dashboard with business-dev tab
          path: 'client-intelligence',
          name: 'ClientIntelligence',
          redirect: () => {
            // Redirect to appropriate dashboard based on user role
            // The business-dev tab is now integrated into each role's dashboard
            return { path: '/coi/requester', query: { tab: 'business-dev', subtab: 'ai-insights' } }
          },
          meta: {
            requiresAuth: true,
            roles: ['Requester', 'Director', 'Partner', 'Admin', 'Super Admin']
          }
        },
        {
          path: 'reports-old',
          name: 'ReportingDashboard',
          component: () => import('@/views/ReportingDashboard.vue'),
          meta: { roles: ['Admin', 'Super Admin', 'Compliance'] }
        },
        {
          path: 'prospects',
          name: 'ProspectManagement',
          component: () => import('@/views/ProspectManagement.vue'),
          meta: { roles: ['Admin', 'Super Admin', 'Director', 'Requester', 'Partner'] }
        },
        {
          path: 'admin/priority-config',
          name: 'PriorityConfig',
          component: () => import('@/views/PriorityConfig.vue'),
          meta: { roles: ['Super Admin', 'Admin'] }
        },
        {
          path: 'admin/sla-config',
          name: 'SLAConfig',
          component: () => import('@/views/SLAConfig.vue'),
          meta: { roles: ['Super Admin', 'Admin'] }
        },
        {
          path: 'admin/email-config',
          name: 'EmailConfig',
          component: () => import('@/views/EmailConfig.vue'),
          meta: { roles: ['Super Admin', 'Admin'] }
        },
        {
          path: 'admin/permission-config',
          name: 'PermissionConfig',
          component: () => import('@/views/PermissionConfig.vue'),
          meta: { roles: ['Super Admin'] }
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
  
  // Always load edition if authenticated (to get current value from API)
  if (authStore.isAuthenticated) {
    await authStore.loadEdition()
  }
  
  const requiresAuth = to.meta.requiresAuth !== false
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/landing')
  } else {
    const allowedRoles = to.meta.roles as string[] | undefined
    const requiresPro = to.meta.requiresPro === true
    
    // Check if Pro edition is required
    if (requiresPro) {
      if (!authStore.isPro) {
        next('/coi')
        return
      }
    }
    
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