<template>
  <div class="suggestions-page">
    <div class="page-header">
      <h2 class="section-title">建言管理</h2>
    </div>

    <!-- 筛选工具栏 -->
    <div class="filter-bar card">
      <input v-model="keyword" type="text" placeholder="搜索标题/内容..." @keyup.enter="loadSuggestions(1)" />
      <select v-model="statusFilter" @change="loadSuggestions(1)">
        <option value="">全部状态</option>
        <option value="pending">待审核</option>
        <option value="approved">已通过</option>
        <option value="rejected">已拒绝</option>
      </select>
      <select v-model="categoryFilter" @change="loadSuggestions(1)">
        <option value="">全部类别</option>
        <option value="环境">环境</option>
        <option value="教育">教育</option>
        <option value="医疗">医疗</option>
        <option value="交通">交通</option>
        <option value="其他">其他</option>
      </select>
      <button class="btn btn-primary btn-sm" @click="loadSuggestions(1)">搜索</button>
    </div>

    <div v-if="successMsg" class="alert-success mb-12">{{ successMsg }}</div>
    <div v-if="errorMsg" class="alert-error mb-12">{{ errorMsg }}</div>

    <!-- 建言列表 -->
    <div v-if="loading" class="loading-center"><span class="spinner"></span> 加载中…</div>
    <div v-else-if="list.length === 0" class="empty-state card">暂无建言数据</div>
    <div v-else class="suggestions-list">
      <div v-for="sug in list" :key="sug._id" class="sug-card card">
        <div class="sug-top">
          <div class="sug-badges">
            <span v-if="sug.isTop" class="badge badge-top">置顶</span>
            <span :class="['badge', `cat-${sug.category}`]">{{ sug.category }}</span>
            <span :class="['badge', `status-${sug.status}`]">{{ statusLabel(sug.status) }}</span>
          </div>
          <div class="sug-meta">{{ sug.authorName }} · {{ formatDate(sug.createdAt) }}</div>
        </div>
        <h3 class="sug-title">{{ sug.title }}</h3>
        <p class="sug-content">{{ sug.content?.slice(0, 150) }}{{ sug.content?.length > 150 ? '…' : '' }}</p>
        <div class="sug-stats">
          👍 {{ sug.likesCount }} &nbsp; ☆ {{ sug.favoritesCount }}
          <span v-if="sug.officialReply" class="replied-tag">已回复</span>
        </div>

        <!-- 操作按钮 -->
        <div class="sug-actions">
          <template v-if="sug.status === 'pending'">
            <button class="btn btn-primary btn-sm" @click="setStatus(sug, 'approved')">✅ 通过</button>
            <button class="btn btn-danger btn-sm" @click="setStatus(sug, 'rejected')">❌ 拒绝</button>
          </template>
          <template v-else>
            <button class="btn btn-outline btn-sm" @click="setStatus(sug, 'pending')">↩ 重置待审</button>
          </template>
          <button class="btn btn-outline btn-sm" @click="openReply(sug)">
            {{ sug.officialReply ? '✏ 修改回复' : '💬 回复' }}
          </button>
          <button class="btn btn-outline btn-sm" @click="toggleTop(sug)">
            {{ sug.isTop ? '📌 取消置顶' : '📌 置顶' }}
          </button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(sug)">🗑 删除</button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > pageSize">
      <button class="page-btn" :disabled="page <= 1" @click="loadSuggestions(page - 1)">上一页</button>
      <button
        v-for="p in totalPages"
        :key="p"
        :class="['page-btn', p === page && 'active']"
        @click="loadSuggestions(p)"
      >{{ p }}</button>
      <button class="page-btn" :disabled="page >= totalPages" @click="loadSuggestions(page + 1)">下一页</button>
      <span class="page-info">共 {{ total }} 条</span>
    </div>

    <!-- 回复模态框 -->
    <div v-if="replyTarget" class="modal-overlay" @click.self="replyTarget = null">
      <div class="modal-box card">
        <h3 class="modal-title">官方回复</h3>
        <p class="modal-sub">{{ replyTarget.title }}</p>
        <textarea v-model="replyContent" rows="5" placeholder="输入官方回复内容..."></textarea>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="replyTarget = null">取消</button>
          <button class="btn btn-primary" @click="submitReply" :disabled="replying">
            {{ replying ? '提交中…' : '提交回复' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  getSuggestions,
  updateSuggestionStatus,
  toggleSuggestionTop,
  deleteSuggestion,
  replyToSuggestion
} from '@/api/admin'

const route = useRoute()

const list = ref([])
const loading = ref(false)
const keyword = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const successMsg = ref('')
const errorMsg = ref('')

const replyTarget = ref(null)
const replyContent = ref('')
const replying = ref(false)

async function loadSuggestions(p = 1) {
  loading.value = true
  page.value = p
  errorMsg.value = ''
  try {
    const res = await getSuggestions({
      page: p,
      limit: pageSize.value,
      keyword: keyword.value,
      status: statusFilter.value,
      category: categoryFilter.value
    })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (err) {
    errorMsg.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function showSuccess(msg) {
  successMsg.value = msg
  setTimeout(() => { successMsg.value = '' }, 3000)
}

async function setStatus(sug, status) {
  try {
    await updateSuggestionStatus(sug._id, status)
    sug.status = status
    showSuccess(`建言状态已更新为：${statusLabel(status)}`)
  } catch (err) {
    errorMsg.value = err.message || '操作失败'
  }
}

async function toggleTop(sug) {
  try {
    const res = await toggleSuggestionTop(sug._id)
    sug.isTop = res.data.isTop
    showSuccess(sug.isTop ? '已置顶' : '已取消置顶')
  } catch (err) {
    errorMsg.value = err.message || '操作失败'
  }
}

async function handleDelete(sug) {
  if (!confirm(`确定删除建言"${sug.title}"？此操作不可恢复。`)) return
  try {
    await deleteSuggestion(sug._id)
    list.value = list.value.filter(s => s._id !== sug._id)
    total.value = Math.max(0, total.value - 1)
    showSuccess('建言已删除')
  } catch (err) {
    errorMsg.value = err.message || '删除失败'
  }
}

function openReply(sug) {
  replyTarget.value = sug
  replyContent.value = sug.officialReply?.content || ''
}

async function submitReply() {
  if (!replyContent.value.trim()) return
  replying.value = true
  try {
    const res = await replyToSuggestion(replyTarget.value._id, { content: replyContent.value })
    replyTarget.value.officialReply = res.data
    replyTarget.value = null
    showSuccess('回复成功')
  } catch (err) {
    errorMsg.value = err.message || '回复失败'
  } finally {
    replying.value = false
  }
}

function statusLabel(s) {
  return { pending: '待审核', approved: '已通过', rejected: '已拒绝' }[s] || s
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(() => {
  if (route.query.status) statusFilter.value = route.query.status
  loadSuggestions(1)
})
</script>

<style scoped>
.suggestions-page {}
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-title { font-size: 20px; font-weight: 700; }
.filter-bar {
  display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
  padding: 14px 18px; margin-bottom: 16px;
}
.filter-bar input, .filter-bar select {
  padding: 7px 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px;
}
.filter-bar input { flex: 1; min-width: 180px; }
.filter-bar input:focus, .filter-bar select:focus { border-color: var(--primary); }
.mb-12 { margin-bottom: 12px; }
.loading-center { display: flex; align-items: center; gap: 8px; justify-content: center; padding: 40px; color: var(--text-muted); }
.spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; color: var(--text-muted); padding: 40px; }

.suggestions-list { display: flex; flex-direction: column; gap: 14px; }
.sug-card { padding: 20px 24px; }
.sug-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
.sug-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
.badge-top { background: #fef9c3; color: #854d0e; }
.cat-环境 { background: #dcfce7; color: #15803d; }
.cat-教育 { background: #dbeafe; color: #1d4ed8; }
.cat-医疗 { background: #fce7f3; color: #9d174d; }
.cat-交通 { background: #fed7aa; color: #9a3412; }
.cat-其他 { background: #f1f5f9; color: #475569; }
.status-pending { background: #fef9c3; color: #854d0e; }
.status-approved { background: #dcfce7; color: #15803d; }
.status-rejected { background: #fee2e2; color: #b91c1c; }
.sug-meta { font-size: 12px; color: var(--text-muted); }
.sug-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.sug-content { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 10px; }
.sug-stats { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
.replied-tag { background: #dcfce7; color: #15803d; padding: 1px 8px; border-radius: 999px; font-size: 11px; margin-left: 8px; }
.sug-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 20px; flex-wrap: wrap; }
.page-btn { padding: 6px 14px; border-radius: var(--radius); border: 1px solid var(--border); background: #fff; font-size: 14px; cursor: pointer; }
.page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.page-btn.active { background: var(--primary); border-color: var(--primary); color: #fff; }
.page-btn:disabled { opacity: .4; cursor: not-allowed; }
.page-info { font-size: 13px; color: var(--text-muted); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
.modal-box { padding: 28px; max-width: 500px; width: 100%; }
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.modal-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 14px; }
.modal-box textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px; resize: vertical; margin-bottom: 14px; }
.modal-box textarea:focus { border-color: var(--primary); }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
</style>
