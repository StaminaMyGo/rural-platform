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

    <!-- 图表区域 -->
    <div v-if="!loading && stats" class="chart-section">
      <h3 class="section-subtitle">数据可视化</h3>

      <!-- 错误提示 -->
      <div v-if="error" class="alert-error">
        {{ error }}
        <button @click="retryLoad" class="btn btn-sm ml-2">重试</button>
      </div>

      <!-- 图表显示 -->
      <div v-else-if="chartConfig.categories.length > 0 && chartConfig.data.length > 0">
        <BarChart
          :title="chartConfig.title"
          :xAxisData="chartConfig.categories"
          :seriesData="chartConfig.data"
          height="400px"
        />
        <div class="chart-footer">
          <small class="text-muted">
            统计时间: {{ new Date().toLocaleDateString('zh-CN') }} |
            总计 {{ categoryStats?.total || 0 }} 条建言
          </small>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <p>暂无分类统计数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getStats, getCategoryStats } from '@/api/admin'
import BarChart from '@/components/BarChart.vue'

const stats = ref(null)
const categoryStats = ref(null)
const loading = ref(true)
const error = ref('')

// 图表配置 - 初始为空，从API获取真实数据
const chartConfig = ref({
  title: '建言分类统计',
  categories: [],  // 初始为空
  data: []        // 初始为空
})

// 加载数据函数，支持重试
async function loadData() {
  loading.value = true
  error.value = ''
  try {
    // 并行请求基础统计和分类统计
    const [statsRes, categoriesRes] = await Promise.all([
      getStats(),
      getCategoryStats()
    ])

    stats.value = statsRes.data
    categoryStats.value = categoriesRes.data

    // 动态更新图表配置
    chartConfig.value = {
      title: '建言分类统计',
      categories: categoriesRes.data.categories,
      data: categoriesRes.data.counts
    }
  } catch (err) {
    error.value = err.message || '数据加载失败，请稍后重试'
    console.error('加载数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 重试函数
async function retryLoad() {
  await loadData()
}

onMounted(() => {
  loadData()
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

/* 图表区域样式 */
.chart-section {
  margin-top: 32px;
  background: #fff;
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow);
}

/* 错误提示 */
.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  border-radius: var(--radius);
  padding: 12px 16px;
  font-size: 14px;
  margin-bottom: 16px;
  border-left: 4px solid #b91c1c;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.alert-error .btn {
  margin-left: 8px;
  font-size: 12px;
  padding: 4px 8px;
}

/* 图表页脚 */
.chart-footer {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}
.text-muted {
  color: var(--text-muted);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}
.empty-state p {
  font-size: 14px;
}
</style>
