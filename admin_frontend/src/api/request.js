import axios from 'axios'
import router from '@/router'

const service = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) config.headers['Authorization'] = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      router.push({ name: 'Login' })
    }
    const message = error.response?.data?.message || '请求失败，请稍后重试'
    return Promise.reject(new Error(message))
  }
)

export default service
