import axios from 'axios'
import router from '@/router'

// 根据环境变量获取baseURL
const getBaseURL = () => {
  const useMock = import.meta.env.VITE_USE_MOCK === 'true'
  const mockBaseURL = import.meta.env.VITE_MOCK_BASE_URL

  if (useMock && mockBaseURL) {
    return mockBaseURL
  }
  return '/api' // 默认使用本地代理
}

// 创建 axios 实例
const service = axios.create({
  baseURL: getBaseURL(),
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器：在请求发送之前执行
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理响应和错误
service.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push({ name: 'Login' })
    }
    const message = error.response?.data?.message || '请求失败，请稍后重试'
    return Promise.reject(new Error(message))
  }
)

export default service
