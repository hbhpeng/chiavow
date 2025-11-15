import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AdminUser {
  id: string
  username: string
  email?: string
}

export const useAdminStore = defineStore('admin', () => {
  // Restore admin info from localStorage
  const savedAdmin = localStorage.getItem('adminUser')
  const adminUser = ref<AdminUser | null>(savedAdmin ? JSON.parse(savedAdmin) : null)
  const adminToken = ref<string | null>(localStorage.getItem('adminToken'))

  const isAdminAuthenticated = ref(!!adminToken.value)

  const setAdminToken = (newToken: string) => {
    adminToken.value = newToken
    localStorage.setItem('adminToken', newToken)
    isAdminAuthenticated.value = true
  }

  const setAdminUser = (userData: AdminUser) => {
    adminUser.value = userData
    localStorage.setItem('adminUser', JSON.stringify(userData))
  }

  const adminLogout = () => {
    adminUser.value = null
    adminToken.value = null
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    isAdminAuthenticated.value = false
  }

  return {
    adminUser,
    adminToken,
    isAdminAuthenticated,
    setAdminToken,
    setAdminUser,
    adminLogout
  }
})
