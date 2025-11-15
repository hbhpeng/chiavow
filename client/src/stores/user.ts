import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: string
  email: string
  username?: string
  avatar?: string
  primaryLanguage?: string
  secondaryLanguage?: string
}

export const useUserStore = defineStore('user', () => {
  // 从 localStorage 恢复用户信息
  const savedUser = localStorage.getItem('user')
  const user = ref<User | null>(savedUser ? JSON.parse(savedUser) : null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = ref(!!token.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
    isAuthenticated.value = true
  }

  const setUser = (userData: User) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    isAuthenticated.value = false
  }

  return {
    user,
    token,
    isAuthenticated,
    setToken,
    setUser,
    logout
  }
})
