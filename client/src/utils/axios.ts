import axios from 'axios'
import { useUserStore } from '@/stores/user'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use((config) => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 只有在已登录状态下收到 401 才清除登录状态并重定向
    // 如果是登录/注册接口返回错误，不要刷新页面
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      const requestUrl = error.config?.url || ''

      // 如果是登录或注册接口返回 401，不要刷新页面，让组件自己处理错误
      const isAuthEndpoint = requestUrl.includes('/auth/login') ||
                            requestUrl.includes('/auth/register') ||
                            requestUrl.includes('/auth/send-code') ||
                            requestUrl.includes('/auth/verify-code')

      if (!isAuthEndpoint && userStore.isAuthenticated) {
        // 只有在已登录状态下访问其他接口遇到 401 才清除登录并重定向
        userStore.logout()
        window.location.href = '/'
      }
    }
    // Note: 404 errors are handled by components, no redirect needed
    return Promise.reject(error)
  }
)

export default api
