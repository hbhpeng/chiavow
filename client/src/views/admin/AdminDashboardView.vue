<template>
  <div class="admin-dashboard">
    <h1 class="page-title">{{ $t('admin.dashboard.title') }}</h1>

    <!-- Statistics Cards -->
    <div v-if="loading" class="loading">{{ $t('common.loading') }}</div>

    <div v-else-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon users">👥</div>
        <div class="stat-content">
          <div class="stat-label">{{ $t('admin.dashboard.totalUsers') }}</div>
          <div class="stat-value">{{ stats.totalUsers }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orders">📦</div>
        <div class="stat-content">
          <div class="stat-label">{{ $t('admin.dashboard.totalOrders') }}</div>
          <div class="stat-value">{{ stats.totalOrders }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon revenue">💰</div>
        <div class="stat-content">
          <div class="stat-label">{{ $t('admin.dashboard.totalRevenue') }}</div>
          <div class="stat-value">${{ stats.totalRevenue.toFixed(2) }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pending">⏳</div>
        <div class="stat-content">
          <div class="stat-label">{{ $t('admin.dashboard.pendingOrders') }}</div>
          <div class="stat-value">{{ stats.pendingOrders }}</div>
        </div>
      </div>
    </div>

    <!-- Quick Navigation -->
    <div class="quick-nav">
      <h2 class="section-title">{{ $t('admin.dashboard.quickAccess') }}</h2>
      <div class="quick-nav-grid">
        <router-link to="/admin/users" class="quick-nav-card">
          <div class="quick-nav-icon">👥</div>
          <div class="quick-nav-label">{{ $t('admin.nav.users') }}</div>
          <div class="quick-nav-description">{{ $t('admin.dashboard.manageUsers') }}</div>
        </router-link>

        <router-link to="/admin/orders" class="quick-nav-card">
          <div class="quick-nav-icon">📦</div>
          <div class="quick-nav-label">{{ $t('admin.nav.orders') }}</div>
          <div class="quick-nav-description">{{ $t('admin.dashboard.manageOrders') }}</div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getStats } from '@/api/admin'
import type { Stats } from '@/api/admin'

const stats = ref<Stats | null>(null)
const loading = ref(true)

const fetchStats = async () => {
  loading.value = true
  try {
    const response = await getStats()
    stats.value = response.data
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.admin-dashboard {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 2rem 0;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s;
}

.stat-card:hover {
  border-color: #e0e0e0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
}

.stat-icon.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.orders {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
}

.quick-nav {
  margin-top: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 1.5rem 0;
}

.quick-nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.quick-nav-card {
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  text-decoration: none;
  transition: all 0.3s;
}

.quick-nav-card:hover {
  border-color: #667eea;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
  transform: translateY(-4px);
}

.quick-nav-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.quick-nav-label {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.quick-nav-description {
  font-size: 0.9rem;
  color: #666;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.75rem;
  }
}
</style>
