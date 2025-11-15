export interface Admin {
  id: string
  username: string
  password?: string
  email: string
  role: 'super_admin' | 'admin'
  createdAt?: Date
  updatedAt?: Date
}

export interface AdminStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
}

export interface UserListItem {
  id: string
  email: string
  username?: string
  avatar?: string
  primaryLanguage?: string
  role: string
  createdAt: Date
  orderCount: number
}

export interface OrderListItem {
  id: string
  userId: string
  username?: string
  email: string
  city: string
  startDate: string
  endDate: string
  numberOfTravelers: number
  totalPrice?: number
  status: string
  createdAt: Date
}
