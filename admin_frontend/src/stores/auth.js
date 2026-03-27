import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi } from '@/api/admin'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('admin_user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const displayName = computed(() => user.value?.realName || user.value?.username || '')

  async function login(username, password) {
    const res = await loginApi({ username, password })
    if (res.data?.user?.role !== 'admin') {
      throw new Error('无管理员权限，请使用管理员账号登录')
    }
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('admin_token', token.value)
    localStorage.setItem('admin_user', JSON.stringify(user.value))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  return { token, user, isLoggedIn, displayName, login, logout }
})
