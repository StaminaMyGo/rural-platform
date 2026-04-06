import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const useMock = env.VITE_USE_MOCK === 'true'

  console.log('当前模式:', mode)
  console.log('是否使用Mock:', useMock)

  // 统一目标地址
  const target = useMock
    ? env.VITE_MOCK_BASE_URL
    : env.VITE_API_BASE_URL

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target,
          changeOrigin: true
          // ❗不写 rewrite，保留 /api
        }
      }
    }
  }
})