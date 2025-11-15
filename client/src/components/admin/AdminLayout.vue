<template>
  <div class="admin-layout">
    <!-- Top Navigation Bar -->
    <header class="admin-header">
      <div class="header-content">
        <h1 class="admin-title">{{ $t('admin.title') }}</h1>
        <div class="admin-user">
          <select v-model="currentLocale" class="language-selector" @change="changeLanguage">
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
          <span class="admin-username">{{ adminStore.adminUser?.username }}</span>
          <button @click="handleLogout" class="logout-btn">
            {{ $t('admin.logout') }}
          </button>
        </div>
      </div>
    </header>

    <div class="admin-container">
      <!-- Side Navigation -->
      <aside class="admin-sidebar">
        <nav class="admin-nav">
          <router-link to="/admin/dashboard" class="nav-item" active-class="active">
            <span class="nav-icon">📊</span>
            <span class="nav-text">{{ $t('admin.nav.dashboard') }}</span>
          </router-link>
          <router-link to="/admin/users" class="nav-item" active-class="active">
            <span class="nav-icon">👥</span>
            <span class="nav-text">{{ $t('admin.nav.users') }}</span>
          </router-link>
          <router-link to="/admin/orders" class="nav-item" active-class="active">
            <div class="nav-icon-wrapper">
              <span class="nav-icon">📦</span>
              <span v-if="ordersUnreadCount > 0" class="badge">
                {{ ordersUnreadCount > 99 ? '99+' : ordersUnreadCount }}
              </span>
            </div>
            <span class="nav-text">{{ $t('admin.nav.orders') }}</span>
          </router-link>
          <router-link to="/admin/trip-messages" class="nav-item" active-class="active">
            <div class="nav-icon-wrapper">
              <span class="nav-icon">💬</span>
              <span v-if="tripMessagesUnreadCount > 0" class="badge">
                {{ tripMessagesUnreadCount > 99 ? '99+' : tripMessagesUnreadCount }}
              </span>
            </div>
            <span class="nav-text">{{ $t('admin.nav.tripMessages') }}</span>
          </router-link>
          <router-link to="/admin/config" class="nav-item" active-class="active">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">系统配置</span>
          </router-link>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="admin-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getTripMessagesUnreadCount, getOrdersUnreadCount } from '@/api/admin'

const adminStore = useAdminStore()
const router = useRouter()
const route = useRoute()
const { locale } = useI18n()
const tripMessagesUnreadCount = ref(0)
const ordersUnreadCount = ref(0)

const currentLocale = ref(locale.value)

const changeLanguage = () => {
  locale.value = currentLocale.value
  localStorage.setItem('locale', currentLocale.value)
}

const handleLogout = () => {
  if (confirm('Are you sure you want to logout?')) {
    adminStore.adminLogout()
    router.push('/admin/login')
  }
}

// Fetch unread count
const fetchUnreadCount = async () => {
  try {
    const tripMessagesResponse = await getTripMessagesUnreadCount()
    tripMessagesUnreadCount.value = tripMessagesResponse.data.count

    const ordersResponse = await getOrdersUnreadCount()
    ordersUnreadCount.value = ordersResponse.data.count
  } catch (error) {
    console.error('Failed to fetch unread count:', error)
  }
}

// Watch for route changes to refresh unread count
watch(() => route.path, (newPath, oldPath) => {
  // When leaving trip-messages or orders page, refresh unread count after a short delay
  if (oldPath?.includes('trip-messages') && !newPath.includes('trip-messages')) {
    setTimeout(() => {
      fetchUnreadCount()
    }, 1000)
  }
  if (oldPath?.includes('orders') && !newPath.includes('orders')) {
    setTimeout(() => {
      fetchUnreadCount()
    }, 1000)
  }
})

onMounted(() => {
  fetchUnreadCount()
  // Refresh unread count every 30 seconds
  setInterval(fetchUnreadCount, 30000)
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header {
  background: #1a1a1a;
  color: white;
  padding: 0 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.admin-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-username {
  font-weight: 500;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.language-selector {
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.language-selector:hover {
  background: rgba(255, 255, 255, 0.2);
}

.language-selector:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
}

.language-selector option {
  background: #1a1a1a;
  color: white;
}

.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 2rem;
  padding: 2rem;
}

.admin-sidebar {
  width: 240px;
  flex-shrink: 0;
}

.admin-nav {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  color: #666;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s;
  margin-bottom: 0.5rem;
}

.nav-item:last-child {
  margin-bottom: 0;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #333;
}

.nav-item.active {
  background: #007bff;
  color: white;
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.badge {
  position: absolute;
  top: -6px;
  right: -10px;
  background: #ff4444;
  color: white;
  font-size: 0.65rem;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1;
}

.nav-text {
  font-weight: 500;
}

.admin-main {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .admin-container {
    flex-direction: column;
    padding: 1rem;
  }

  .admin-sidebar {
    width: 100%;
  }

  .admin-nav {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 0.5rem;
  }

  .nav-item {
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
    margin-bottom: 0;
    white-space: nowrap;
  }

  .nav-text {
    font-size: 0.75rem;
  }
}
</style>
