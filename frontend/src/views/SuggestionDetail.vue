<template>
  <div class="detail-page">
    <div v-if="loading" class="loading-center">
      <span class="spinner"></span> 加载中…
    </div>
    <div v-else-if="!suggestion" class="empty-state">建言不存在或已被删除。</div>

    <template v-else>
      <!-- 返回按钮 -->
      <div class="back-bar">
        <button class="btn btn-outline btn-sm" @click="router.back()">← 返回列表</button>
      </div>

      <!-- 建言主体 -->
      <div class="opinion-card card">
        <div class="opinion-top">
          <span v-if="suggestion.isTop" class="top-badge">置顶</span>
          <span :class="['cat-tag', `cat-${suggestion.category}`]">{{ suggestion.category }}</span>
          <span :class="['status-badge', `status-${suggestion.status}`]">{{ statusLabel }}</span>
        </div>
        <h2 class="opinion-title">{{ suggestion.title }}</h2>
        <div class="opinion-meta">
          <span>{{ suggestion.authorName }}</span>
          <span>{{ formatDate(suggestion.createdAt) }}</span>
        </div>
        <div class="opinion-body">{{ suggestion.content }}</div>

        <!-- 操作区 -->
        <div class="opinion-actions">
          <button
            :class="['action-btn like-btn', liked && 'liked']"
            @click="handleLike"
          >
            👍 {{ suggestion.likesCount || 0 }} 点赞
          </button>
          <button
            :class="['action-btn fav-btn', isFavorited && 'favorited']"
            @click="handleFavorite"
          >
            {{ isFavorited ? '★ 已收藏' : '☆ 收藏' }}
          </button>
          <button
            v-if="canEdit"
            class="action-btn edit-btn"
            @click="startEdit"
          >✏ 编辑</button>
          <button
            v-if="canDelete"
            class="action-btn delete-btn"
            @click="handleDelete"
          >🗑 删除</button>
        </div>

        <!-- 编辑表单 -->
        <div v-if="editMode" class="edit-form card">
          <h4>编辑建言</h4>
          <div class="form-group">
            <label>标题</label>
            <input v-model="editForm.title" type="text" maxlength="100" />
          </div>
          <div class="form-group">
            <label>类别</label>
            <select v-model="editForm.category">
              <option>环境</option><option>教育</option><option>医疗</option>
              <option>交通</option><option>其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea v-model="editForm.content" rows="5"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-outline btn-sm" @click="editMode = false">取消</button>
            <button class="btn btn-primary btn-sm" @click="submitEdit" :disabled="saving">
              {{ saving ? '保存中…' : '保存' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 官方回复区 -->
      <div v-if="suggestion.officialReply || authStore.isAdmin" class="official-reply card">
        <h3 class="section-title">🏛 村干部回复</h3>
        <div v-if="suggestion.officialReply" class="reply-content">
          <div class="reply-header">
            <span class="reply-author">{{ suggestion.officialReply.authorName }}</span>
            <span class="reply-date">{{ formatDate(suggestion.officialReply.createdAt) }}</span>
          </div>
          <p>{{ suggestion.officialReply.content }}</p>
        </div>
        <div v-else class="no-reply">暂无官方回复</div>

        <!-- 管理员回复表单 -->
        <div v-if="authStore.isAdmin" class="admin-reply-form">
          <textarea
            v-model="replyContent"
            rows="3"
            :placeholder="suggestion.officialReply ? '修改回复内容…' : '输入官方回复…'"
          ></textarea>
          <div class="reply-form-actions">
            <button class="btn btn-primary btn-sm" @click="submitReply" :disabled="replying">
              {{ replying ? '提交中…' : '提交回复' }}
            </button>
            <span v-if="replySuccess" class="reply-success-tip">✅ {{ replySuccess }}</span>
          </div>
        </div>
      </div>

      <!-- 评论区 -->
      <div class="comments-section card">
        <h3 class="section-title">💬 评论 ({{ comments.length }})</h3>

        <!-- 发表评论 -->
        <div class="comment-form">
          <textarea
            v-model="newComment"
            rows="3"
            placeholder="发表您的评论..."
          ></textarea>
          <button class="btn btn-primary btn-sm" @click="submitComment" :disabled="commenting">
            {{ commenting ? '发表中…' : '发表评论' }}
          </button>
        </div>

        <!-- 评论列表 -->
        <div v-if="comments.length === 0" class="no-comments">暂无评论，快来发表第一条评论吧！</div>
        <div v-else class="comments-list">
          <div v-for="c in comments" :key="c._id" class="comment-item">
            <div class="comment-header">
              <span class="comment-author">{{ c.authorName }}</span>
              <span class="comment-date">{{ formatDate(c.createdAt) }}</span>
            </div>
            <p class="comment-content">{{ c.content }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  getSuggestion,
  likeSuggestion,
  favoriteSuggestion,
  getComments,
  addComment,
  replyToSuggestion,
  updateSuggestion,
  deleteSuggestion,
  getMyLiked,
  getMyFavorited
} from '@/api/suggestions'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const suggestion = ref(null)
const loading = ref(true)
const liked = ref(false)
const isFavorited = ref(false)
const comments = ref([])

const editMode = ref(false)
const saving = ref(false)
const editForm = ref({ title: '', category: '', content: '' })

const newComment = ref('')
const commenting = ref(false)

const replyContent = ref('')
const replying = ref(false)
const replySuccess = ref('')

const statusLabel = computed(() => {
  const map = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
  return map[suggestion.value?.status] || ''
})

const canEdit = computed(() => {
  if (!authStore.isLoggedIn || !suggestion.value) return false
  return suggestion.value.authorId === authStore.user.id || authStore.isAdmin
})

const canDelete = computed(() => canEdit.value)

async function load() {
  loading.value = true
  try {
    // 核心数据：建言详情 + 评论，失败则整页不可用
    const [sugRes, commentsRes] = await Promise.all([
      getSuggestion(route.params.id),
      getComments(route.params.id)
    ])
    suggestion.value = sugRes.data
    comments.value = commentsRes.data || []

    if (suggestion.value.officialReply?.content) {
      replyContent.value = suggestion.value.officialReply.content
    }
  } catch (err) {
    suggestion.value = null
    loading.value = false
    return
  } finally {
    loading.value = false
  }

  // 非关键数据：点赞/收藏状态，失败不影响页面显示
  try {
    const [likedRes, favRes] = await Promise.all([getMyLiked(), getMyFavorited()])
    const likedSet = new Set((likedRes.data || []).map(id => id.toString()))
    liked.value = likedSet.has(suggestion.value._id.toString())
    const favSet = new Set((favRes.data || []).map(id => id.toString()))
    isFavorited.value = favSet.has(suggestion.value._id.toString())
  } catch { /* 未登录或请求失败时忽略，点赞/收藏按钮仍可用 */ }
}

async function handleLike() {
  try {
    const res = await likeSuggestion(suggestion.value._id)
    suggestion.value.likesCount = res.data.likesCount
    liked.value = res.data.liked
  } catch (err) {
    alert(err.message || '操作失败')
  }
}

async function handleFavorite() {
  try {
    const res = await favoriteSuggestion(suggestion.value._id)
    isFavorited.value = res.data.favorited
    suggestion.value.favoritesCount = res.data.favoritesCount
  } catch (err) {
    alert(err.message || '操作失败')
  }
}

function startEdit() {
  editForm.value = {
    title: suggestion.value.title,
    category: suggestion.value.category,
    content: suggestion.value.content
  }
  editMode.value = true
}

async function submitEdit() {
  saving.value = true
  try {
    const res = await updateSuggestion(suggestion.value._id, editForm.value)
    suggestion.value = { ...suggestion.value, ...res.data }
    editMode.value = false
  } catch (err) {
    alert(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!confirm('确定删除此建言？')) return
  try {
    await deleteSuggestion(suggestion.value._id)
    router.push('/')
  } catch (err) {
    alert(err.message || '删除失败')
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return
  commenting.value = true
  try {
    const res = await addComment(suggestion.value._id, { content: newComment.value })
    comments.value.push(res.data)
    newComment.value = ''
  } catch (err) {
    alert(err.message || '评论失败')
  } finally {
    commenting.value = false
  }
}

async function submitReply() {
  if (!replyContent.value.trim()) return
  replying.value = true
  replySuccess.value = ''
  try {
    const res = await replyToSuggestion(suggestion.value._id, { content: replyContent.value })
    suggestion.value.officialReply = res.data
    replySuccess.value = '回复已提交'
    setTimeout(() => { replySuccess.value = '' }, 3000)
  } catch (err) {
    alert(err.message || '回复失败，请确认已用管理员账号登录')
  } finally {
    replying.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(load)
</script>

<style scoped>
.detail-page { max-width: 800px; margin: 0 auto; }
.loading-center {
  display: flex; align-items: center; gap: 8px;
  justify-content: center; padding: 60px 0; color: var(--text-muted);
}
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--border); border-top-color: var(--primary);
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; color: var(--text-muted); padding: 60px 0; }

.back-bar { margin-bottom: 16px; }

.opinion-card { padding: 28px; margin-bottom: 20px; }
.opinion-top { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; }
.top-badge {
  background: #f59e0b; color: #fff;
  font-size: 11px; padding: 2px 8px; border-radius: 999px;
}
.cat-tag {
  display: inline-block; padding: 2px 12px;
  border-radius: 999px; font-size: 12px; font-weight: 500;
}
.cat-环境 { background: #dcfce7; color: #15803d; }
.cat-教育 { background: #dbeafe; color: #1d4ed8; }
.cat-医疗 { background: #fce7f3; color: #9d174d; }
.cat-交通 { background: #fed7aa; color: #9a3412; }
.cat-其他 { background: #f1f5f9; color: #475569; }

.status-badge {
  padding: 2px 10px; border-radius: 999px; font-size: 12px;
}
.status-pending { background: #fef9c3; color: #854d0e; }
.status-approved { background: #dcfce7; color: #15803d; }
.status-rejected { background: #fee2e2; color: #b91c1c; }

.opinion-title { font-size: 24px; font-weight: 700; margin-bottom: 10px; line-height: 1.4; }
.opinion-meta { display: flex; gap: 14px; font-size: 13px; color: var(--text-muted); margin-bottom: 18px; }
.opinion-body { font-size: 15px; line-height: 1.8; color: var(--text); white-space: pre-wrap; }
.opinion-actions { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
.action-btn {
  padding: 6px 14px; border-radius: var(--radius);
  border: 1px solid var(--border); background: #fff;
  font-size: 13px; color: var(--text-muted); cursor: pointer;
  transition: all .2s;
}
.action-btn:hover { border-color: var(--primary); color: var(--primary); }
.like-btn.liked { background: #eef2ff; border-color: var(--primary); color: var(--primary); }
.fav-btn.favorited { color: #f59e0b; border-color: #f59e0b; }
.delete-btn:hover { border-color: var(--danger); color: var(--danger); }

.edit-form { padding: 20px; margin-top: 20px; background: #f8fafc; }
.edit-form h4 { font-size: 16px; font-weight: 600; margin-bottom: 14px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 5px; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 8px 12px;
  border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px; resize: vertical;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--primary); }
.form-actions { display: flex; gap: 8px; justify-content: flex-end; }

.section-title { font-size: 17px; font-weight: 700; margin-bottom: 16px; }

.official-reply { padding: 24px; margin-bottom: 20px; }
.reply-header { display: flex; gap: 10px; font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
.reply-author { font-weight: 600; color: var(--text); }
.reply-content p { font-size: 14px; line-height: 1.7; }
.no-reply { color: var(--text-muted); font-size: 14px; font-style: italic; }
.admin-reply-form { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.admin-reply-form textarea {
  width: 100%; padding: 9px 12px;
  border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px; resize: vertical;
}
.admin-reply-form textarea:focus { border-color: var(--primary); }
.reply-form-actions { display: flex; align-items: center; gap: 12px; }
.reply-success-tip { font-size: 13px; color: #15803d; }

.comments-section { padding: 24px; }
.comment-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.comment-form textarea {
  width: 100%; padding: 9px 12px;
  border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px; resize: vertical;
}
.comment-form textarea:focus { border-color: var(--primary); }
.no-comments { color: var(--text-muted); font-size: 14px; text-align: center; padding: 20px 0; }
.comments-list { display: flex; flex-direction: column; gap: 14px; }
.comment-item {
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.comment-header {
  display: flex; gap: 10px; font-size: 13px; margin-bottom: 6px;
}
.comment-author { font-weight: 600; color: var(--text); }
.comment-date { color: var(--text-muted); }
.comment-content { font-size: 14px; line-height: 1.6; color: var(--text); }
</style>
