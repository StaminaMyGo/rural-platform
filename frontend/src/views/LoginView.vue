<template>
  <div class="auth-page">
    <div class="auth-card card">
      <div class="platform-logo">🌾</div>
      <h2 class="auth-title">乡村建言平台</h2>

      <div class="tab-bar">
        <button :class="['tab-btn', tab === 'login' && 'active']" @click="tab = 'login'">登录</button>
        <button :class="['tab-btn', tab === 'register' && 'active']" @click="tab = 'register'">注册</button>
      </div>

      <!-- 登录表单 -->
      <form v-if="tab === 'login'" class="auth-form" @submit.prevent="handleLogin">
        <div v-if="errorMsg" class="alert-error">{{ errorMsg }}</div>
        <div class="form-group">
          <label>用户名</label>
          <input v-model="loginForm.username" type="text" placeholder="请输入用户名" required :disabled="loading" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="loginForm.password" type="password" placeholder="请输入密码" required :disabled="loading" />
        </div>
        <button class="btn btn-primary auth-btn" type="submit" :disabled="loading">
          {{ loading ? '登录中…' : '登 录' }}
        </button>
        <p class="demo-hint">测试账号：admin / 123456 &nbsp;|&nbsp; zhangsan / 123456</p>
      </form>

      <!-- 注册表单 -->
      <form v-else class="auth-form" @submit.prevent="handleRegister">
        <div v-if="errorMsg" class="alert-error">{{ errorMsg }}</div>
        <div v-if="successMsg" class="alert-success">{{ successMsg }}</div>
        <div class="form-group">
          <label>用户名 <span class="required">*</span></label>
          <input v-model="regForm.username" type="text" placeholder="2-20位字符" required :disabled="loading" />
        </div>
        <div class="form-group">
          <label>密码 <span class="required">*</span></label>
          <input v-model="regForm.password" type="password" placeholder="至少6位" required :disabled="loading" />
        </div>
        <div class="form-group">
          <label>真实姓名</label>
          <input v-model="regForm.realName" type="text" placeholder="选填" :disabled="loading" />
        </div>
        <div class="form-group">
          <label>手机号</label>
          <input v-model="regForm.phone" type="text" placeholder="选填" :disabled="loading" />
        </div>
        <div class="form-group">
          <label>家庭住址</label>
          <input v-model="regForm.address" type="text" placeholder="选填" :disabled="loading" />
        </div>
        <button class="btn btn-primary auth-btn" type="submit" :disabled="loading">
          {{ loading ? '注册中…' : '注 册' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const tab = ref('login')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const loginForm = ref({ username: 'admin', password: '123456' })
const regForm = ref({ username: '', password: '', realName: '', phone: '', address: '' })

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.login(loginForm.value.username, loginForm.value.password)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    errorMsg.value = err.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    await authStore.register(regForm.value)
    successMsg.value = '注册成功！请使用新账号登录。'
    regForm.value = { username: '', password: '', realName: '', phone: '', address: '' }
    setTimeout(() => { tab.value = 'login' }, 1500)
  } catch (err) {
    errorMsg.value = err.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4f7942 0%, #2d6a3f 60%, #1a4a2b 100%);
  padding: 20px;
}
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 36px 32px;
}
.platform-logo {
  font-size: 40px;
  text-align: center;
  margin-bottom: 8px;
}
.auth-title {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  color: var(--text);
  margin-bottom: 20px;
}
.tab-bar {
  display: flex;
  border-bottom: 2px solid var(--border);
  margin-bottom: 24px;
}
.tab-btn {
  flex: 1;
  background: none;
  padding: 10px;
  font-size: 15px;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all .2s;
}
.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 600;
}
.auth-form { display: flex; flex-direction: column; gap: 0; }
.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  border-radius: var(--radius);
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 14px;
}
.alert-success {
  background: #dcfce7;
  color: #15803d;
  border-radius: var(--radius);
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 14px;
}
.form-group {
  margin-bottom: 14px;
}
.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
  color: var(--text);
}
.required { color: var(--danger); }
.form-group input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  transition: border-color .2s;
}
.form-group input:focus {
  border-color: var(--primary);
}
.auth-btn {
  width: 100%;
  justify-content: center;
  padding: 11px;
  font-size: 15px;
  margin-top: 6px;
}
.auth-btn:disabled {
  opacity: .7;
  cursor: not-allowed;
}
.demo-hint {
  text-align: center;
  margin-top: 14px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
