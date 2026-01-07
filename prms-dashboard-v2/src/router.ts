import { createRouter, createWebHashHistory } from 'vue-router'

const Management = () => import('./views/Management.vue')
const Finance = () => import('./views/Finance.vue')
const Project = () => import('./views/Project.vue')
const Admin = () => import('./views/Admin.vue')
const Auditor = () => import('./views/Auditor.vue')

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'management', component: Management },
    { path: '/finance', name: 'finance', component: Finance },
    { path: '/project/:id', name: 'project', component: Project },
    { path: '/admin', name: 'admin', component: Admin },
    { path: '/auditor', name: 'auditor', component: Auditor },
  ],
})
