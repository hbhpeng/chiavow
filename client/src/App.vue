<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getCurrentUser } from '@/api/auth'

const userStore = useUserStore()

onMounted(async () => {
  // 如果有 token 但没有用户信息，从服务器获取
  if (userStore.isAuthenticated && !userStore.user) {
    try {
      const response = await getCurrentUser()
      userStore.setUser(response.data)
    } catch (error) {
      // 如果获取失败（比如 token 过期），清除认证状态
      userStore.logout()
    }
  }
})
</script>

<style>
</style>
