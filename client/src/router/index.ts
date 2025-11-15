import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/profile-setup',
      name: 'profile-setup',
      component: () => import('@/views/ProfileSetupView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/main',
      name: 'main',
      component: () => import('@/views/MainView.vue'),
      meta: { requiresAuth: true },
      redirect: '/main/guide-hailing',
      children: [
        {
          path: 'guide-hailing',
          name: 'guide-hailing',
          component: () => import('@/views/GuideHailingView.vue')
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('@/views/OrdersView.vue')
        },
        {
          path: 'trip-messages',
          name: 'trip-messages',
          component: () => import('@/views/TripMessagesView.vue')
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue')
        }
      ]
    },
    // Admin routes
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/AdminLoginView.vue'),
      meta: { requiresAdminAuth: false }
    },
    {
      path: '/admin',
      component: () => import('@/components/admin/AdminLayout.vue'),
      meta: { requiresAdminAuth: true },
      redirect: '/admin/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/AdminDashboardView.vue')
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/AdminUsersView.vue')
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: () => import('@/views/admin/AdminOrdersView.vue')
        },
        {
          path: 'trip-messages',
          name: 'admin-trip-messages',
          component: () => import('@/views/admin/AdminTripMessagesView.vue')
        },
        {
          path: 'config',
          name: 'admin-config',
          component: () => import('@/views/admin/AdminConfigView.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const adminStore = useAdminStore()

  // Admin routes guard
  if (to.path.startsWith('/admin')) {
    // Admin login page - redirect if already authenticated
    if (to.path === '/admin/login' && adminStore.isAdminAuthenticated) {
      next('/admin/dashboard')
    }
    // Protected admin pages - redirect to login if not authenticated
    else if (to.meta.requiresAdminAuth && !adminStore.isAdminAuthenticated) {
      next('/admin/login')
    }
    else {
      next()
    }
    return
  }

  // Regular user routes guard
  // 未认证用户访问需要认证的页面，重定向到登录页
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next('/')
  }
  // 已认证用户访问登录页，根据是否有用户名重定向
  else if (to.path === '/' && userStore.isAuthenticated) {
    if (!userStore.user?.username) {
      next('/profile-setup')
    } else {
      next('/main')
    }
  }
  // 已填写资料的用户访问资料设置页，重定向到主页
  else if (to.path === '/profile-setup' && userStore.isAuthenticated && userStore.user?.username) {
    next('/main')
  }
  else {
    next()
  }
})

export default router
