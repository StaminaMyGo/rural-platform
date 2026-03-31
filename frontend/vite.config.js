import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  // 根据环境变量决定是否启用代理
  const proxyConfig = env.VITE_USE_MOCK === 'true'
    ? {} // 使用Mock时禁用代理
    : {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5173,
      proxy: proxyConfig
    }
  }
})
