<template>
  <div class="admin-orders">
    <div class="page-header">
      <h1 class="page-title">{{ $t('admin.orders.title') }}</h1>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('admin.orders.searchPlaceholder')"
          class="search-input"
          @input="handleSearch"
        />
      </div>
    </div>

    <div v-if="loading" class="loading">{{ $t('common.loading') }}</div>

    <div v-else class="orders-content">
      <!-- Orders Table -->
      <div class="table-container">
        <table class="orders-table">
          <thead>
            <tr>
              <th>{{ $t('admin.orders.id') }}</th>
              <th>{{ $t('admin.orders.userEmail') }}</th>
              <th>{{ $t('admin.orders.trips') }}</th>
              <th>{{ $t('admin.orders.travelers') }}</th>
              <th>{{ $t('admin.orders.status') }}</th>
              <th>{{ $t('admin.orders.price') }}</th>
              <th>{{ $t('admin.orders.createdAt') }}</th>
              <th>{{ $t('admin.orders.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td class="order-id">{{ order.id.substring(0, 8) }}...</td>
              <td>{{ order.userEmail || '-' }}</td>
              <td>
                <div v-for="(trip, index) in order.trips" :key="index" class="trip-info">
                  {{ $t(`cities.${trip.city}`) }}: {{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}
                </div>
              </td>
              <td class="text-center">{{ order.travelers }}</td>
              <td>
                <span :class="['status-badge', order.status]">
                  {{ $t(`admin.orders.statuses.${order.status}`) }}
                </span>
              </td>
              <td class="price-cell">
                {{ order.totalPrice ? `$${order.totalPrice.toFixed(2)}` : '-' }}
              </td>
              <td>{{ formatDateTime(order.createdAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="editOrder(order)" class="action-btn edit-btn">
                    {{ $t('common.edit') }}
                  </button>
                  <button @click="confirmDeleteOrder(order)" class="action-btn delete-btn">
                    {{ $t('common.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="orders.length === 0" class="empty-state">
          {{ $t('admin.orders.noOrders') }}
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          {{ $t('admin.pagination.previous') }}
        </button>
        <span class="pagination-info">
          {{ $t('admin.pagination.page') }} {{ currentPage }} {{ $t('admin.pagination.of') }} {{ totalPages }}
        </span>
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          {{ $t('admin.pagination.next') }}
        </button>
      </div>
    </div>

    <!-- Edit Order Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ $t('admin.orders.editOrder') }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Order Details -->
          <div class="order-details">
            <h3>{{ $t('admin.orders.orderDetails') }}</h3>

            <div class="detail-group">
              <label>{{ $t('admin.orders.id') }}:</label>
              <span class="detail-value">{{ selectedOrder.id }}</span>
            </div>

            <div class="detail-group">
              <label>{{ $t('admin.orders.userEmail') }}:</label>
              <span class="detail-value">{{ selectedOrder.userEmail }}</span>
            </div>

            <div class="detail-group">
              <label>{{ $t('admin.orders.trips') }}:</label>
              <div class="trips-list">
                <div v-for="(trip, index) in selectedOrder.trips" :key="index" class="trip-detail">
                  <strong>{{ $t(`cities.${trip.city}`) }}</strong>:
                  {{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}
                </div>
              </div>
            </div>

            <div class="detail-group">
              <label>{{ $t('admin.orders.travelers') }}:</label>
              <span class="detail-value">{{ selectedOrder.travelers }}</span>
            </div>

            <div class="detail-group">
              <label>{{ $t('admin.orders.supplyVehicles') }}:</label>
              <span class="detail-value">{{ selectedOrder.supplyVehicles ? 'Yes' : 'No' }}</span>
            </div>

            <div class="detail-group">
              <label>{{ $t('admin.orders.freeItinerary') }}:</label>
              <span class="detail-value">{{ selectedOrder.freeItinerary ? 'Yes' : 'No' }}</span>
            </div>

            <div class="detail-group">
              <label>{{ $t('admin.orders.tailorMade') }}:</label>
              <span class="detail-value">{{ selectedOrder.tailorMade ? 'Yes' : 'No' }}</span>
            </div>
          </div>

          <!-- Edit Forms -->
          <div class="form-section">
            <div class="form-group">
              <label>{{ $t('admin.orders.setPrice') }}</label>
              <input
                v-model.number="editForm.price"
                type="number"
                min="0"
                step="0.01"
                class="form-input"
                :placeholder="$t('admin.orders.pricePlaceholder')"
              />
            </div>

            <div class="form-group">
              <label>{{ $t('admin.orders.updateStatus') }}</label>
              <select v-model="editForm.status" class="form-input">
                <option value="active">{{ $t('admin.orders.statuses.active') }}</option>
                <option value="paid">{{ $t('admin.orders.statuses.paid') }}</option>
                <option value="cancelled">{{ $t('admin.orders.statuses.cancelled') }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">
            {{ $t('common.cancel') }}
          </button>
          <button @click="saveOrder" class="btn btn-primary" :disabled="saving">
            {{ saving ? $t('common.loading') : $t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getOrders, setOrderPrice, updateOrderStatus, deleteOrder, markOrderAsRead } from '@/api/admin'
import type { Order } from '@/api/admin'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const orders = ref<Order[]>([])
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 10

const selectedOrder = ref<Order | null>(null)
const editForm = ref({
  price: 0,
  status: 'pending' as Order['status']
})
const saving = ref(false)

const fetchOrders = async () => {
  loading.value = true
  try {
    const response = await getOrders(currentPage.value, pageSize, searchQuery.value)
    orders.value = response.data.data
    totalPages.value = response.data.totalPages

    // Mark unread orders as read
    for (const order of orders.value) {
      if (!order.adminRead) {
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

const handleSearch = () => {
  currentPage.value = 1
  fetchOrders()
}

const changePage = (page: number) => {
  currentPage.value = page
  fetchOrders()
}

const editOrder = (order: Order) => {
  selectedOrder.value = order
  editForm.value = {
    price: order.totalPrice || 0,
    status: order.status
  }
}

const closeModal = () => {
  selectedOrder.value = null
}

const saveOrder = async () => {
  if (!selectedOrder.value) return

  saving.value = true
  try {
    // Update price if changed
    if (editForm.value.price !== selectedOrder.value.totalPrice) {
      await setOrderPrice(selectedOrder.value.id, editForm.value.price)
    }

    // Update status if changed
    if (editForm.value.status !== selectedOrder.value.status) {
      await updateOrderStatus(selectedOrder.value.id, editForm.value.status)
    }

    // Fetch updated orders before closing modal
    await fetchOrders()
    closeModal()
  } catch (error) {
    console.error('Failed to update order:', error)
    alert('Failed to update order')
  } finally {
    saving.value = false
  }
}

const confirmDeleteOrder = async (order: Order) => {
  if (confirm(t('admin.orders.confirmDelete', { id: order.id.substring(0, 8) }))) {
    try {
      await deleteOrder(order.id)
      fetchOrders()
    } catch (error) {
      console.error('Failed to delete order:', error)
      alert(t('admin.orders.deleteFailed'))
    }
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.admin-orders {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

.orders-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

.orders-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.order-id {
  font-family: monospace;
  font-size: 0.9rem;
  color: #666;
}

.trip-info {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  color: #555;
}

.trip-info:last-child {
  margin-bottom: 0;
}

.text-center {
  text-align: center;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #fff3cd;
  color: #856404;
}

.status-badge.paid {
  background: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.confirmed {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.price-cell {
  font-weight: 600;
  color: #28a745;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s;
}

.edit-btn {
  background: #667eea;
  color: white;
}

.edit-btn:hover {
  background: #5568d3;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-weight: 500;
  color: #666;
}

.modal-overlay {
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
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.order-details {
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.order-details h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  color: #333;
}

.detail-group {
  display: flex;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
}

.detail-group:last-child {
  margin-bottom: 0;
}

.detail-group label {
  font-weight: 600;
  color: #555;
  min-width: 140px;
}

.detail-value {
  color: #333;
}

.trips-list {
  flex: 1;
}

.trip-detail {
  margin-bottom: 0.5rem;
  color: #333;
}

.trip-detail:last-child {
  margin-bottom: 0;
}

.form-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .admin-orders {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .table-container {
    overflow-x: scroll;
  }

  .modal {
    width: 95%;
  }

  .detail-group {
    flex-direction: column;
  }

  .detail-group label {
    min-width: auto;
  }
}
</style>
