<template>
  <div class="orders-view">
    <div class="header">
      <h1 class="title">{{ t('orders.title') }}</h1>
    </div>

    <div class="tabs">
      <button
        v-for="status in statuses"
        :key="status"
        class="tab"
        :class="{ active: currentStatus === status }"
        @click="currentStatus = status"
      >
        {{ t(`orders.${status}`) }}
      </button>
    </div>

    <div class="orders-list">
      <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

      <div v-else-if="filteredOrders.length === 0" class="empty-state">
        <span class="icon">📋</span>
        <p>{{ t('orders.noOrders') }}</p>
      </div>

      <div v-else class="order-cards">
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card"
        >
          <div class="order-header">
            <span class="order-number">{{ t('orders.orderNumber') }}{{ order.id.slice(0, 8) }}</span>
            <span class="order-status" :class="order.status">
              {{ t(`orders.${order.status}`) }}
            </span>
          </div>

          <div class="order-trips">
            <div v-for="(trip, index) in order.trips" :key="index" class="trip-item">
              <div class="trip-city">📍 {{ getCityName(trip.city) }}</div>
              <div class="trip-dates">
                {{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}
              </div>
            </div>
          </div>

          <div class="order-details">
            <div class="detail-item">
              <span class="label">Travelers:</span>
              <span class="value">{{ order.numberOfTravelers }}</span>
            </div>
            <div v-if="order.supplyVehicles" class="detail-item">
              <span class="badge">🚗 Vehicles</span>
            </div>
            <div v-if="order.freeItinerary" class="detail-item">
              <span class="badge">🗺️ Free Itinerary</span>
            </div>
            <div v-if="order.tailorMade" class="detail-item">
              <span class="badge">✨ Tailor-made</span>
            </div>
          </div>

          <div class="order-footer">
            <span class="total-amount">
              {{ t('orders.totalAmount') }}: ${{ order.totalAmount }}
            </span>
            <div class="actions">
              <button
                v-if="order.status === 'active'"
                class="cancel-btn"
                @click="handleCancel(order.id)"
              >
                {{ t('orders.cancel') }}
              </button>
              <button
                v-if="order.status === 'active'"
                class="contact-btn"
                @click="showContactModal = true"
              >
                {{ t('orders.contactUs') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Modal -->
    <div v-if="showContactModal" class="contact-modal" @click.self="showContactModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ t('orders.contactUs') }}</h3>
          <button class="close-btn" @click="showContactModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="contact-intro">{{ t('orders.contactIntro') }}</p>
          <div class="social-links">
            <a v-if="isContactMethodEnabled('email') && contactConfig.email" :href="`mailto:${contactConfig.email}`" class="social-link email">
              <span class="icon">✉️</span>
              <span class="text">Email</span>
            </a>
            <a v-if="isContactMethodEnabled('phone') && contactConfig.phone" :href="`tel:${contactConfig.phone}`" class="social-link phone">
              <span class="icon">📞</span>
              <span class="text">Phone</span>
            </a>
            <a v-if="isContactMethodEnabled('wechat') && contactConfig.wechat" href="#" class="social-link wechat" @click.prevent="copyToClipboard(contactConfig.wechat || '')">
              <span class="icon">💬</span>
              <span class="text">WeChat: {{ contactConfig.wechat }}</span>
            </a>
            <a v-if="isContactMethodEnabled('twitter') && contactConfig.twitter" :href="contactConfig.twitter" target="_blank" class="social-link twitter">
              <span class="icon">🐦</span>
              <span class="text">Twitter</span>
            </a>
            <a v-if="isContactMethodEnabled('facebook') && contactConfig.facebook" :href="contactConfig.facebook" target="_blank" class="social-link facebook">
              <span class="icon">📘</span>
              <span class="text">Facebook</span>
            </a>
            <a v-if="isContactMethodEnabled('instagram') && contactConfig.instagram" :href="contactConfig.instagram" target="_blank" class="social-link instagram">
              <span class="icon">📷</span>
              <span class="text">Instagram</span>
            </a>
            <a v-if="isContactMethodEnabled('whatsapp') && contactConfig.whatsapp" :href="contactConfig.whatsapp" target="_blank" class="social-link whatsapp">
              <span class="icon">💬</span>
              <span class="text">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getOrders, cancelOrder, markOrderAsRead } from '@/api/orders'
import { getContactConfig, type ContactConfig } from '@/api/config'
import type { Order } from '@/api/orders'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const statuses = ['active', 'paid', 'cancelled'] as const
const currentStatus = ref<'active' | 'cancelled' | 'paid'>('active')
const orders = ref<Order[]>([])
const loading = ref(false)
const showContactModal = ref(false)
const contactConfig = ref<ContactConfig>({})
const enabledMethods = ref<string[]>([])

const filteredOrders = computed(() => {
  return orders.value.filter(order => order.status === currentStatus.value)
})

const isContactMethodEnabled = (method: string) => {
  return enabledMethods.value.includes(method)
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    alert('WeChat ID copied to clipboard!')
  }).catch(err => {
    console.error('Failed to copy:', err)
  })
}

const getCityName = (cityKey: string) => {
  return t(`cities.${cityKey}`)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const fetchContactConfig = async () => {
  try {
    const response = await getContactConfig()
    contactConfig.value = response.data

    // Parse enabled methods
    if (contactConfig.value.enabled_methods) {
      enabledMethods.value = contactConfig.value.enabled_methods.split(',').map(m => m.trim())
    }
  } catch (error) {
    console.error('Failed to fetch contact config:', error)
  }
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const response = await getOrders()
    orders.value = response.data

    // Mark unread orders as read
    for (const order of orders.value) {
      if (!order.userRead) {
        try {
          await markOrderAsRead(order.id)
        } catch (error) {
          console.error('Failed to mark order as read:', error)
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch orders:', error)
  } finally {
    loading.value = false
  }
}

const handleCancel = async (orderId: string) => {
  if (!confirm('Are you sure you want to cancel this order?')) return

  try {
    await cancelOrder(orderId)
    await fetchOrders()
  } catch (error) {
    console.error('Failed to cancel order:', error)
  }
}

onMounted(() => {
  fetchOrders()
  fetchContactConfig()

  // Check if we should auto-open the contact modal
  if (route.query.showContact === 'true') {
    showContactModal.value = true
    // Clean up the query parameter
    router.replace({ path: '/main/orders' })
  }
})
</script>

<style scoped>
.orders-view {
  min-height: 100%;
  background: var(--bg-light);
}

.header {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-dark);
}

.tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid var(--border-color);
  padding: 0 20px;
}

.tab {
  flex: 1;
  padding: 15px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 600;
  color: #999;
  transition: all 0.3s;
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.orders-list {
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state .icon {
  font-size: 4rem;
  margin-bottom: 10px;
  opacity: 0.5;
}

.order-cards {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-number {
  font-weight: 600;
  color: var(--text-dark);
}

.order-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.order-status.active {
  background: rgba(255, 169, 77, 0.2);
  color: var(--warning-color);
}

.order-status.paid {
  background: rgba(81, 207, 102, 0.2);
  color: var(--success-color);
}

.order-status.cancelled {
  background: rgba(255, 107, 107, 0.2);
  color: var(--error-color);
}

.order-trips {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--bg-light);
  border-radius: 8px;
}

.trip-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.trip-city {
  font-weight: 600;
  color: var(--text-dark);
}

.trip-dates {
  font-size: 0.9rem;
  color: #666;
}

.order-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
}

.detail-item .label {
  color: #666;
}

.detail-item .value {
  font-weight: 600;
  color: var(--text-dark);
}

.badge {
  padding: 4px 10px;
  background: var(--bg-light);
  border-radius: 12px;
  font-size: 0.85rem;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.total-amount {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--primary-color);
}

.actions {
  display: flex;
  gap: 8px;
}

.cancel-btn,
.contact-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: opacity 0.3s;
}

.cancel-btn {
  background: var(--bg-light);
  color: var(--text-dark);
}

.contact-btn {
  background: var(--primary-color);
  color: white;
}

.cancel-btn:hover,
.contact-btn:hover {
  opacity: 0.8;
}

/* Contact Modal */
.contact-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #666;
  transition: background 0.3s;
  border: none;
  cursor: pointer;
}

.close-btn:hover {
  background: #ddd;
}

.modal-body {
  padding: 24px 20px;
}

.contact-intro {
  margin-bottom: 20px;
  color: #666;
  text-align: center;
  font-size: 0.95rem;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--bg-light);
  transition: all 0.3s;
  text-decoration: none;
  color: var(--text-dark);
}

.social-link:hover {
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.social-link.twitter:hover {
  background: rgba(29, 161, 242, 0.1);
  color: #1DA1F2;
}

.social-link.facebook:hover {
  background: rgba(24, 119, 242, 0.1);
  color: #1877F2;
}

.social-link.instagram:hover {
  background: rgba(225, 48, 108, 0.1);
  color: #E1306C;
}

.social-link.email:hover {
  background: rgba(234, 67, 53, 0.1);
  color: #EA4335;
}

.social-link.whatsapp:hover {
  background: rgba(37, 211, 102, 0.1);
  color: #25D366;
}

.social-link.phone:hover {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.social-link.wechat:hover {
  background: rgba(9, 187, 7, 0.1);
  color: #09BB07;
}

.social-link .icon {
  font-size: 1.5rem;
}

.social-link .text {
  font-weight: 500;
  font-size: 1rem;
}
</style>
