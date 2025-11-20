export interface User {
  id: string
  email: string
  password?: string
  plainPassword?: string  // 明文密码字段
  username?: string
  avatar?: string
  primaryLanguage?: string
  secondaryLanguage?: string
  createdAt: Date
}

export interface VerificationCode {
  email: string
  code: string
  expiresAt: Date
}

export interface TripSegment {
  city: string
  startDate: string
  endDate: string
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
  createdAt: Date
}
