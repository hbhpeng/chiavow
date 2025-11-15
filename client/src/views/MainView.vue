<template>
  <div class="main-view">
    <div class="content">
      <router-view />
    </div>

    <nav class="bottom-nav">
      <router-link
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.path"
        class="nav-item"
        :class="{ active: currentTab === tab.name }"
      >
        <div class="icon-wrapper">
          <span class="icon">{{ tab.icon }}</span>
          <span v-if="tab.name === 'trip-messages' && tripMessagesUnreadCount > 0" class="badge">
            {{ tripMessagesUnreadCount > 99 ? '99+' : tripMessagesUnreadCount }}
          </span>
          <span v-if="tab.name === 'orders' && ordersUnreadCount > 0" class="badge">
            {{ ordersUnreadCount > 99 ? '99+' : ordersUnreadCount }}
          </span>
        </div>
        <span class="label">{{ t(tab.label) }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getUnreadCount as getTripMessagesUnreadCount } from '@/api/tripMessages'
import { getUnreadCount as getOrdersUnreadCount } from '@/api/orders'

const { t } = useI18n()
const route = useRoute()
const tripMessagesUnreadCount = ref(0)
const ordersUnreadCount = ref(0)

const tabs = [
  {
    name: 'guide-hailing',
    path: '/main/guide-hailing',
    icon: '🧭',
    label: 'tabs.guideHailing'
  },
  {
    name: 'orders',
    path: '/main/orders',
    icon: '📋',
    label: 'tabs.orders'
  },
  {
    name: 'trip-messages',
    path: '/main/trip-messages',
    icon: '💬',
    label: 'tabs.messages'
  },
  {
    name: 'profile',
    path: '/main/profile',
    icon: '👤',
    label: 'tabs.profile'
  }
]

const currentTab = computed(() => {
  const path = route.path
  if (path.includes('guide-hailing')) return 'guide-hailing'
  if (path.includes('orders')) return 'orders'
  if (path.includes('trip-messages')) return 'trip-messages'
  if (path.includes('profile')) return 'profile'
  return ''
})

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
  // to allow the mark-as-read API calls to complete
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
.main-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-light);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: white;
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  color: #999;
  transition: color 0.3s;
  text-decoration: none;
}

.nav-item.active {
  color: var(--primary-color);
}

.nav-item .icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.icon-wrapper {
  position: relative;
  display: inline-block;
}

.badge {
  position: absolute;
  top: -4px;
  right: -8px;
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

.nav-item .label {
  font-size: 0.75rem;
  font-weight: 500;
}

@media (min-width: 768px) {
  .main-view {
    max-width: 480px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }

  .bottom-nav {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
  }

  body {
    background-color: #E8E8E8;
  }
}

@media (min-width: 1200px) {
  .main-view {
    max-width: 520px;
  }

  .bottom-nav {
    max-width: 520px;
  }
}
</style>
