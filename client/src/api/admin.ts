import axios from 'axios'
import { useAdminStore } from '@/stores/admin'

const adminApi = axios.create({
  baseURL: '/api/admin',
  timeout: 10000
})

adminApi.interceptors.request.use((config) => {
  const adminStore = useAdminStore()
  if (adminStore.adminToken) {
    config.headers.Authorization = `Bearer ${adminStore.adminToken}`
  }
  return config
})

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const adminStore = useAdminStore()
      const requestUrl = error.config?.url || ''

      // Don't redirect on login endpoint
      const isLoginEndpoint = requestUrl.includes('/login')

      if (!isLoginEndpoint && adminStore.isAdminAuthenticated) {
        adminStore.adminLogout()
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AdminLoginResponse {
  token: string
  admin: {
    id: string
    username: string
    email?: string
  }
}

export interface User {
  id: string
  email: string
  username?: string
  avatar?: string
  primaryLanguage?: string
  secondaryLanguage?: string
  plainPassword?: string  // 明文密码
  createdAt: string
  ordersCount?: number
}

export interface Order {
  id: string
  userId: string
  userEmail?: string
  trips: Array<{
    city: string
    startDate: string
    endDate: string
  }>
  travelers: number
  supplyVehicles: boolean
  freeItinerary: boolean
  medicalCompanion: boolean
  businessService: boolean
  status: 'active' | 'paid' | 'cancelled'
  totalPrice?: number
  userRead: boolean
  adminRead: boolean
  createdAt: string
  updatedAt: string
}

export interface Stats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Admin login
export const login = (data: AdminLoginRequest) => {
  return adminApi.post<AdminLoginResponse>('/auth/login', data)
}

// Get users with pagination and search
export const getUsers = (page: number = 1, limit: number = 10, search: string = '') => {
  return adminApi.get<PaginatedResponse<User>>('/users', {
    params: { page, limit, search }
  })
}

// Update user
export const updateUser = (id: string, data: Partial<User>) => {
  return adminApi.put<User>(`/users/${id}`, data)
}

// Delete user
export const deleteUser = (id: string) => {
  return adminApi.delete(`/users/${id}`)
}

// Update user password
export const updateUserPassword = (id: string, password: string) => {
  return adminApi.put(`/users/${id}/password`, { password })
}

// Get orders with pagination and search
export const getOrders = (page: number = 1, limit: number = 10, search: string = '') => {
  return adminApi.get<PaginatedResponse<Order>>('/orders', {
    params: { page, limit, search }
  })
}

// Set order price
export const setOrderPrice = (id: string, price: number) => {
  return adminApi.put<Order>(`/orders/${id}/price`, { totalAmount: price })
}

// Update order status
export const updateOrderStatus = (id: string, status: Order['status']) => {
  return adminApi.put<Order>(`/orders/${id}/status`, { status })
}

// Delete order
export const deleteOrder = (id: string) => {
  return adminApi.delete(`/orders/${id}`)
}

// Get unread order count for admin
export const getOrdersUnreadCount = () => {
  return adminApi.get<{ count: number }>('/orders/unread-count')
}

// Mark an order as read by admin
export const markOrderAsRead = (orderId: string) => {
  return adminApi.patch(`/orders/${orderId}/read`)
}

// Get statistics
export const getStats = () => {
  return adminApi.get<Stats>('/stats')
}

// Get contact configuration
export const getContactConfig = () => {
  return adminApi.get<ContactConfig>('/config/contact')
}

// Update contact configuration
export const updateContactConfig = (config: ContactConfig) => {
  return adminApi.put('/config/contact', config)
}

export interface ContactConfig {
  email?: string
  phone?: string
  wechat?: string
  twitter?: string
  facebook?: string
  instagram?: string
  whatsapp?: string
  enabled_methods?: string
}

export interface TripMessageReply {
  id: number
  messageId: string
  userId: string
  content: string
  isAdmin: boolean
  isRead: boolean
  createdAt: string
  username?: string
  email?: string
}

export interface TripMessage {
  id: string
  userId: string
  message: string
  status: 'pending' | 'replied' | 'closed'
  userRead: boolean
  adminRead: boolean
  createdAt: string
  updatedAt: string
  username?: string
  email?: string
  replies?: TripMessageReply[]
}

// Get all trip messages
export const getTripMessages = () => {
  return adminApi.get<TripMessage[]>('/trip-messages')
}

// Get a single trip message with replies
export const getTripMessage = (id: string) => {
  return adminApi.get<TripMessage>(`/trip-messages/${id}`)
}

// Admin reply to trip message
export const replyToTripMessage = (messageId: string, content: string) => {
  return adminApi.post<TripMessageReply>(`/trip-messages/${messageId}/replies`, { content })
}

// Update trip message status
export const updateTripMessageStatus = (id: string, status: TripMessage['status']) => {
  return adminApi.put<TripMessage>(`/trip-messages/${id}/status`, { status })
}

// Delete trip message
export const deleteTripMessage = (id: string) => {
  return adminApi.delete(`/trip-messages/${id}`)
}

// Get unread message count for admin
export const getTripMessagesUnreadCount = () => {
  return adminApi.get<{ count: number }>('/trip-messages/unread-count')
}

// Mark a message as read by admin
export const markTripMessageAsRead = (messageId: string) => {
  return adminApi.patch(`/trip-messages/${messageId}/read`)
}
