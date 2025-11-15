import api from '@/utils/axios'

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

// Get all trip messages for the authenticated user
export const getTripMessages = () => {
  return api.get<TripMessage[]>('/trip-messages')
}

// Get a single trip message with replies
export const getTripMessage = (id: string) => {
  return api.get<TripMessage>(`/trip-messages/${id}`)
}

// Create a new trip message
export const createTripMessage = (data: { message: string }) => {
  return api.post<TripMessage>('/trip-messages', data)
}

// Add a reply to a trip message
export const addReply = (messageId: string, data: { content: string }) => {
  return api.post<TripMessageReply>(`/trip-messages/${messageId}/replies`, data)
}

// Get unread message count for the authenticated user
export const getUnreadCount = () => {
  return api.get<{ count: number }>('/trip-messages/unread-count')
}

// Mark a message as read by user
export const markMessageAsRead = (messageId: string) => {
  return api.patch(`/trip-messages/${messageId}/read`)
}
