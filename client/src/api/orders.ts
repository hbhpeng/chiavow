import api from '@/utils/axios'

export interface TripSegment {
  city: string
  startDate: string
  endDate: string
}

export interface CreateOrderRequest {
  trips: TripSegment[]
  numberOfTravelers: number
  supplyVehicles: boolean
  freeItinerary: boolean
  medicalCompanion: boolean
  businessService: boolean
}

export interface Order {
  id: string
  userId: string
  trips: TripSegment[]
  numberOfTravelers: number
  supplyVehicles: boolean
  freeItinerary: boolean
  medicalCompanion: boolean
  businessService: boolean
  totalAmount: number
  status: 'active' | 'cancelled' | 'paid'
  userRead: boolean
  adminRead: boolean
  createdAt: string
}

export const createOrder = (data: CreateOrderRequest) => {
  return api.post<Order>('/orders', data)
}

export const getOrders = () => {
  return api.get<Order[]>('/orders')
}

export const cancelOrder = (orderId: string) => {
  return api.put(`/orders/${orderId}/cancel`)
}

export const payOrder = (orderId: string) => {
  return api.put(`/orders/${orderId}/pay`)
}

// Get unread order count for the authenticated user
export const getUnreadCount = () => {
  return api.get<{ count: number }>('/orders/unread-count')
}

// Mark an order as read by user
export const markOrderAsRead = (orderId: string) => {
  return api.patch(`/orders/${orderId}/read`)
}
