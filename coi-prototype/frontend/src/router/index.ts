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
          meta: { roles: ['Admin', 'Super Admin'], requiresPro: true }
        },
        {
          path: 'reports',
          name: 'ReportingDashboard',
          component: () => import('@/views/ReportingDashboard.vue'),
          meta: { roles: ['Admin', 'Super Admin', 'Compliance'] }
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
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'router/index.ts:116',message:'Router navigation guard',data:{toPath:to.path,fromPath:from.path,userRole:authStore.user?.role,hasToken:!!authStore.token,hasUser:!!authStore.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
  // #endregion
  
  // If we have a token but no user, check auth first
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }
  
  // Always load edition if authenticated (to get current value from API)
  if (authStore.isAuthenticated) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'router/index.ts:128',message:'Loading edition before route check',data:{currentEdition:authStore.edition,toPath:to.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    await authStore.loadEdition()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'router/index.ts:131',message:'Edition loaded after await',data:{edition:authStore.edition,isPro:authStore.isPro,toPath:to.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'router/index.ts:144',message:'Pro edition check',data:{requiresPro,edition:authStore.edition,isPro:authStore.isPro,toPath:to.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (!authStore.isPro) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'router/index.ts:147',message:'Redirecting - not Pro edition',data:{edition:authStore.edition,isPro:authStore.isPro,toPath:to.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Redirect to dashboard if not Pro edition
        next('/coi')
        return
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'router/index.ts:152',message:'Pro edition check passed',data:{edition:authStore.edition,isPro:authStore.isPro,toPath:to.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'router/index.ts:133',message:'Role check',data:{allowedRoles,userRole:authStore.user?.role,roleMatch:allowedRoles?.includes(authStore.user?.role||''),toPath:to.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
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