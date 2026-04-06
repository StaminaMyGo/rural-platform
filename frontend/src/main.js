import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// 调试信息：显示当前API模式
console.log('📡 ====== API 配置信息 ======')
console.log('VITE_USE_MOCK:', import.meta.env.VITE_USE_MOCK)
console.log('VITE_MOCK_BASE_URL:', import.meta.env.VITE_MOCK_BASE_URL)
console.log('当前模式:', import.meta.env.VITE_USE_MOCK === 'true' ? 'Mock模式' : '真实后端模式')
console.log('localStorage token:', localStorage.getItem('token') ? '存在' : '不存在')
console.log('localStorage user:', localStorage.getItem('user') ? '存在' : '不存在')
console.log('==============================')

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
