<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="platform-logo">🌾</div>
      <h2 class="login-title">管理员登录</h2>
      <p class="login-sub">乡村建言平台 · 管理后台</p>

      <div v-if="errorMsg" class="alert-error">{{ errorMsg }}</div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="管理员账号" required :disabled="loading" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" required :disabled="loading" />
        </div>
        <button class="btn btn-primary login-btn" type="submit" :disabled="loading">
          {{ loading ? '登录中…' : '登 录' }}
        </button>
      </form>
      <p class="demo-hint">默认管理员：admin / 123456</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('admin')
const password = ref('123456')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.login(username.value, password.value)
    router.push({ name: 'Dashboard' })
  } catch (err) {
    errorMsg.value = err.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #166534 0%, #14532d 100%);
  padding: 20px;
}
.login-card {
  width: 100%;
  max-width: 380px;
  padding: 40px 36px;
}
.platform-logo { font-size: 40px; text-align: center; margin-bottom: 8px; }
.login-title { font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 4px; }
.login-sub { color: var(--text-muted); text-align: center; font-size: 13px; margin-bottom: 28px; }
.login-form { display: flex; flex-direction: column; gap: 0; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 5px; }
.form-group input {
  width: 100%; padding: 10px 12px;
  border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px; transition: border-color .2s;
}
.form-group input:focus { border-color: var(--primary); }
.login-btn { width: 100%; justify-content: center; padding: 11px; font-size: 15px; margin-top: 6px; }
.login-btn:disabled { opacity: .7; cursor: not-allowed; }
.demo-hint { text-align: center; margin-top: 16px; font-size: 12px; color: var(--text-muted); }
</style>
