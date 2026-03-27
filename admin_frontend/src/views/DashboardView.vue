<template>
  <div class="dashboard">
    <h2 class="section-title">数据概览</h2>

    <div v-if="loading" class="loading-center">
      <span class="spinner"></span> 加载中…
    </div>
    <div v-else-if="stats" class="stats-grid">
      <div class="stat-card card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.userCount }}</div>
          <div class="stat-label">注册用户数</div>
        </div>
        <div class="stat-sub">今日新增 +{{ stats.newUsers }}</div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">📋</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.suggestionCount }}</div>
          <div class="stat-label">建言总数</div>
        </div>
        <div class="stat-sub">今日新增 +{{ stats.newSuggestions }}</div>
      </div>
      <div class="stat-card stat-warning card">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingCount }}</div>
          <div class="stat-label">待审核</div>
        </div>
        <div class="stat-sub">需要处理</div>
      </div>
      <div class="stat-card stat-success card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.approvedCount }}</div>
          <div class="stat-label">已通过</div>
        </div>
        <div class="stat-sub">公开展示中</div>
      </div>
    </div>

    <!-- 快速入口 -->
    <div class="quick-actions">
      <h3 class="section-subtitle">快速操作</h3>
      <div class="quick-grid">
        <router-link to="/suggestions?status=pending" class="quick-card card">
          <span class="quick-icon">🔍</span>
          <span>审核待处理建言</span>
        </router-link>
        <router-link to="/suggestions" class="quick-card card">
          <span class="quick-icon">📝</span>
          <span>管理所有建言</span>
        </router-link>
        <router-link to="/users" class="quick-card card">
          <span class="quick-icon">👤</span>
          <span>管理用户</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getStats } from '@/api/admin'

const stats = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getStats()
    stats.value = res.data
  } catch { /* ignore */ } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {}
.section-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; }
.section-subtitle { font-size: 16px; font-weight: 600; margin-bottom: 14px; margin-top: 32px; }
.loading-center {
  display: flex; align-items: center; gap: 8px;
  justify-content: center; padding: 40px; color: var(--text-muted);
}
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--border); border-top-color: var(--primary);
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 8px;
}
.stat-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-left: 4px solid var(--primary);
}
.stat-warning { border-left-color: var(--warning); }
.stat-success { border-left-color: var(--success); }
.stat-icon { font-size: 28px; }
.stat-value { font-size: 32px; font-weight: 700; color: var(--text); }
.stat-label { font-size: 13px; color: var(--text-muted); }
.stat-sub { font-size: 12px; color: var(--text-muted); }

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}
.quick-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  transition: box-shadow .2s, transform .2s;
}
.quick-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  color: var(--primary);
}
.quick-icon { font-size: 28px; }
</style>
