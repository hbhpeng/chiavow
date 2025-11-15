import api from '@/utils/axios'

export interface SendCodeRequest {
  email: string
}

export interface VerifyCodeRequest {
  email: string
  code: string
}

export interface RegisterRequest {
  email: string
  password: string
  code: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    username?: string
    avatar?: string
    primaryLanguage?: string
    secondaryLanguage?: string
  }
}

export const sendVerificationCode = (data: SendCodeRequest) => {
  return api.post('/auth/send-code', data)
}

export const verifyCode = (data: VerifyCodeRequest) => {
  return api.post<LoginResponse>('/auth/verify-code', data)
}

export const register = (data: RegisterRequest) => {
  return api.post<LoginResponse>('/auth/register', data)
}

export const login = (data: LoginRequest) => {
  return api.post<LoginResponse>('/auth/login', data)
}

export const getCurrentUser = () => {
  return api.get<LoginResponse['user']>('/auth/me')
}
