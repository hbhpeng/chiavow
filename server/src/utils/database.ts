import { User, VerificationCode, Order } from '../types'

// In-memory database (replace with real database in production)
export const users: Map<string, User> = new Map()
export const verificationCodes: Map<string, VerificationCode> = new Map()
export const orders: Map<string, Order> = new Map()

// Helper to find user by email
export const findUserByEmail = (email: string): User | undefined => {
  return Array.from(users.values()).find(user => user.email === email)
}

// Helper to get user orders
export const getUserOrders = (userId: string): Order[] => {
  return Array.from(orders.values()).filter(order => order.userId === userId)
}
