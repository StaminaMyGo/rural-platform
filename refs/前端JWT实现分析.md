# 前端JWT实现分析

## 项目结构

```
frontend/src/
├── api/
│   ├── auth.js          # 认证相关API（登录、注册）
│   └── request.js       # Axios实例及拦截器
├── stores/
│   └── auth.js          # Pinia认证状态管理
├── router/
│   └── index.js         # 路由配置及守卫
└── views/
    ├── LoginView.vue    # 登录页面
    ├── HomeView.vue     # 主页
    ├── ProfileView.vue  # 个人资料
    ├── FavoritesView.vue # 收藏夹
    └── SuggestionDetail.vue # 建议详情
```

## JWT相关文件

### 1. [api/auth.js](frontend/src/api/auth.js)
```javascript
import service from './request'

export function login(data) {
  return service.post('/auth/login', data)
}

export function register(data) {
  return service.post('/auth/register', data)
}
```
- 提供`login`和`register`函数调用后端认证接口
- 使用统一的`service`（axios实例）发送请求

### 2. [stores/auth.js](frontend/src/stores/auth.js)
```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const displayName = computed(() => user.value?.realName || user.value?.username || '')

  async function login(username, password) {
    const res = await loginApi({ username, password })
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  async function register(data) {
    const res = await registerApi(data)
    return res
  }

  function updateUser(userData) {
    user.value = { ...user.value, ...userData }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLoggedIn, isAdmin, displayName, login, register, updateUser, logout }
})
```
- **Token存储**: 从`localStorage`读取初始token和用户信息
- **登录流程**: 调用API → 保存token和用户数据到store和localStorage
- **状态计算**: `isLoggedIn`基于token存在性，`isAdmin`基于用户角色
- **注销**: 清除store状态和localStorage

### 3. [api/request.js](frontend/src/api/request.js)
```javascript
import axios from 'axios'
import router from '@/router'

const service = axios.create({
  baseURL: getBaseURL(), // 根据环境变量动态配置
  timeout: 5000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
})

// 请求拦截器
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

// 响应拦截器
service.interceptors.response.use(
  (response) => response.data,
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
```
- **请求拦截器**: 自动从`localStorage`读取token并添加到`Authorization: Bearer <token>`头部
- **响应拦截器**: 处理401未授权错误 → 清除本地存储并跳转到登录页

### 4. [router/index.js](frontend/src/router/index.js)
```javascript
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isLoggedIn

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && isLoggedIn) {
    next({ name: 'Home' })
  } else {
    next()
  }
})
```
- **路由守卫**: 检查`meta.requiresAuth`字段，未登录用户跳转到登录页
- **已登录用户访问登录页**: 自动重定向到主页

## JWT实现流程

### 登录流程
1. 用户在`LoginView.vue`输入凭据并提交
2. 调用`authStore.login()` → `api/auth.js`的`login`函数
3. 后端返回`{ token: 'JWT_TOKEN', user: {...} }`
4. Store保存token和用户数据到`localStorage`
5. 路由守卫检测到登录状态，允许访问受保护路由

### 请求认证流程
1. 任何API请求通过`service`（axios实例）发送
2. 请求拦截器自动添加`Authorization: Bearer <token>`头部
3. 后端验证JWT token并处理请求
4. 如果返回401，响应拦截器清除本地存储并跳转登录

### 状态持久化
- **初始化**: 应用启动时从`localStorage`读取token和用户信息
- **更新**: 登录/更新用户信息时同步更新`localStorage`
- **清除**: 注销或token过期时移除`localStorage`数据

## 关键设计点

1. **集中式状态管理**: 使用Pinia store统一管理认证状态
2. **自动token注入**: 请求拦截器自动附加token，无需手动设置
3. **响应式状态**: `isLoggedIn`、`isAdmin`等为计算属性，自动更新UI
4. **路由保护**: 全局路由守卫保护需要认证的路由
5. **错误处理**: 统一处理401错误，自动跳转登录

## 文件位置总结

| 文件 | 功能 | 关键代码 |
|------|------|----------|
| `api/auth.js` | 认证API封装 | `login()`, `register()` |
| `stores/auth.js` | 认证状态管理 | `token`, `user`, `login()`, `logout()` |
| `api/request.js` | HTTP客户端及拦截器 | `service.interceptors.request`, `service.interceptors.response` |
| `router/index.js` | 路由守卫 | `router.beforeEach` |
| `views/LoginView.vue` | 登录界面 | `authStore.login()`调用 |
| `App.vue`及其他视图 | 使用认证状态 | `authStore.isLoggedIn`, `authStore.user` |

## 技术栈
- Vue 3 + Pinia（状态管理）
- Axios（HTTP客户端）
- Vue Router（路由）
- LocalStorage（Token持久化）

## 注意事项
1. Token存储在localStorage中，存在XSS风险，建议考虑HttpOnly Cookie方案
2. 401错误处理会清除所有本地存储，包括用户信息
3. 路由守卫在每次路由切换时检查，但依赖store中的状态（从localStorage初始化）
4. 开发环境可通过环境变量切换Mock API和真实API