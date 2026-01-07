import { createRouter, createWebHashHistory } from 'vue-router'
// Routes rebuilt for enhanced dashboards
// Use dynamic imports to ensure proper component loading

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'management', component: () => import('@/views/ManagementDashboard.vue') },
    { path: '/finance', name: 'finance', component: () => import('@/views/FinanceTeamDashboard.vue') },
    { path: '/project', name: 'project', component: () => import('@/views/ProjectDashboard.vue') },
    { path: '/project/:id', name: 'project-detail', component: () => import('@/views/ProjectDashboard.vue') },
    { path: '/admin', name: 'admin', component: () => import('@/views/AdminDashboard.vue') },
    { path: '/auditor', name: 'auditor', component: () => import('@/views/AuditorDashboard.vue') },
    // Keep partner dashboards accessible
    { path: '/partner/audit', name: 'partner-audit', component: () => import('@/views/EnhancedPartnerAuditDashboard.vue') },
    { path: '/partner/tax', name: 'partner-tax', component: () => import('@/views/EnhancedPartnerTaxDashboard.vue') },
    // Catch all route for 404
    { path: '/:pathMatch(.*)*', name: 'not-found', redirect: '/' }
  ],
})

// Add navigation guards for better error handling
router.beforeEach((to, from, next) => {
  console.log('Navigating to:', to.path)
  next()
})

router.onError((error) => {
  console.error('Router error:', error)
  // Fallback to management dashboard on error
  router.push('/')
})

export default router
