<template>
  <div id="app-root">
    <nav v-if="authStore.isLoggedIn" class="navbar">
      <div class="navbar-inner">
        <router-link to="/" class="navbar-brand">🌾 乡村建言平台</router-link>
        <div class="navbar-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/favorites" class="nav-link">我的收藏</router-link>
          <router-link to="/profile" class="nav-link">个人中心</router-link>
          <button class="btn btn-primary btn-sm" @click="showPublishModal = true">+ 发布建言</button>
          <span class="nav-user">{{ authStore.displayName }}【{{ authStore.isAdmin ? '管理员' : '村民' }}】</span>
          <button class="btn btn-sm btn-outline" @click="handleLogout">退出</button>
        </div>
      </div>
    </nav>

    <main :class="authStore.isLoggedIn ? 'main-content' : ''">
      <router-view />
      <!-- 在 router-view 后面添加 -->
      <div v-if="$route.path === '/'" class="chart-section">
        <BarChart 
          :title="chartConfig.title"
          :xAxisData="chartConfig.categories"
          :seriesData="chartConfig.data"
          height="400px"
        />
      </div>
    </main>

    <footer v-if="authStore.isLoggedIn" class="site-footer">
      <p>&copy; 2026 乡村建言平台 | 共建美好农村</p>
    </footer>

    <!-- 发布建言模态框 -->
    <div v-if="showPublishModal" class="modal-overlay" @click.self="showPublishModal = false">
      <div class="modal-box card">
        <div class="modal-header">
          <h3>发布建言</h3>
          <button class="close-btn" @click="showPublishModal = false">✕</button>
        </div>
        <form @submit.prevent="submitSuggestion">
          <div class="form-group">
            <label>标题 <span class="required">*</span></label>
            <input v-model="form.title" type="text" placeholder="请输入建言标题" required maxlength="100" />
          </div>
          <div class="form-group">
            <label>类别</label>
            <select v-model="form.category">
              <option value="环境">环境</option>
              <option value="教育">教育</option>
              <option value="医疗">医疗</option>
              <option value="交通">交通</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>内容 <span class="required">*</span></label>
            <textarea v-model="form.content" rows="5" placeholder="请详细描述您的建言..." required></textarea>
          </div>
          <div v-if="publishError" class="alert-error">{{ publishError }}</div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="showPublishModal = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="publishing">
              {{ publishing ? '发布中…' : '发布' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { createSuggestion } from '@/api/suggestions'
import BarChart from '@/components/BarChart.vue'

const authStore = useAuthStore()
const router = useRouter()

const showPublishModal = ref(false)
const publishing = ref(false)
const publishError = ref('')
const form = ref({ title: '', category: '其他', content: '' })

// 图表配置
const chartConfig = ref({
  title: '建言分类统计',
  categories: ['环境', '教育', '医疗', '交通', '其他'],
  data: [42, 28, 35, 19, 15]  // 后续改为从API获取
})

function handleLogout() {
  authStore.logout()
  router.push({ name: 'Login' })
}

async function submitSuggestion() {
  publishing.value = true
  publishError.value = ''
  try {
    await createSuggestion(form.value)
    showPublishModal.value = false
    form.value = { title: '', category: '其他', content: '' }
    alert('建言发布成功！等待管理员审核后将公开展示。')
  } catch (err) {
    publishError.value = err.message || '发布失败，请稍后重试'
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
#app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #fff;
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}
.navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.navbar-brand {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  white-space: nowrap;
}
.navbar-links {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.nav-link {
  color: var(--text-muted);
  font-size: 14px;
  transition: color .2s;
}
.nav-link:hover,
.nav-link.router-link-active {
  color: var(--primary);
}
.nav-user {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  width: 100%;
  flex: 1;
}
.site-footer {
  text-align: center;
  padding: 16px;
  background: #fff;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 13px;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}
.modal-box {
  width: 100%;
  max-width: 520px;
  padding: 28px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
}
.close-btn {
  background: none;
  font-size: 18px;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: var(--radius);
}
.close-btn:hover {
  background: #f1f5f9;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}
.required { color: var(--danger); }
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  transition: border-color .2s;
  resize: vertical;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--primary);
}
.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  border-radius: var(--radius);
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 12px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

/* 图表区域样式 */
.chart-section {
  margin-bottom: 40px;
  background: #fff;
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow);
}
</style>
