<template>
  <div>
    <div class="back-bar">
      <button class="btn btn-outline btn-sm" @click="router.back()">← 返回</button>
    </div>

    <div v-if="loading" class="loading-mask">
      <span class="spinner"></span> 加载中…
    </div>

    <div v-else-if="errorMsg" class="alert-error">{{ errorMsg }}</div>

    <div v-else-if="article" class="detail-layout">
      <!-- 文章主体 -->
      <div class="card detail-card">
        <div class="detail-top">
          <span class="tag">{{ article.category || '未分类' }}</span>
          <div class="detail-actions">
            <button
              class="btn btn-sm"
              :class="favStore.isFavorited(article._id) ? 'btn-warning' : 'btn-outline'"
              @click="favStore.toggle(article)"
            >
              {{ favStore.isFavorited(article._id) ? '★ 已收藏' : '☆ 收藏' }}
            </button>
            <button class="btn btn-sm btn-primary" @click="startEdit">✏ 编辑</button>
          </div>
        </div>

        <!-- 查看模式 -->
        <template v-if="!editing">
          <h1 class="detail-title">{{ article.title }}</h1>
          <div class="detail-meta">
            <span>作者：{{ article.author || '匿名' }}</span>
            <span>发布：{{ formatDate(article.createdAt) }}</span>
          </div>
          <div class="detail-body" v-html="renderedContent"></div>
        </template>

        <!-- 编辑模式 -->
        <template v-else>
          <div class="edit-form">
            <div class="form-group">
              <label>标题</label>
              <input v-model="editForm.title" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>分类</label>
              <input v-model="editForm.category" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>内容（支持 Markdown）</label>
              <textarea v-model="editForm.content" class="form-textarea" rows="12"></textarea>
            </div>
            <div class="edit-actions">
              <button class="btn btn-primary" :disabled="saving" @click="saveEdit">
                {{ saving ? '保存中…' : '保存' }}
              </button>
              <button class="btn btn-outline" @click="cancelEdit">取消</button>
            </div>
            <div v-if="saveError" class="alert-error mt-8">{{ saveError }}</div>
          </div>
        </template>
      </div>

      <!-- 侧边：笔记高亮 -->
      <div class="card side-card">
        <h3 class="side-title">📝 划线笔记</h3>
        <p class="side-hint">选中正文文字后点击"添加笔记"</p>
        <button class="btn btn-sm btn-outline mt-8" @click="addNote">添加笔记</button>
        <div v-if="notes.length === 0" class="empty-notes">暂无笔记</div>
        <ul class="note-list">
          <li v-for="(note, idx) in notes" :key="idx" class="note-item">
            <blockquote class="note-quote">{{ note.text }}</blockquote>
            <span class="note-time">{{ note.time }}</span>
            <button class="note-del" @click="removeNote(idx)">✕</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import snarkdown from 'snarkdown'
import { getArticle, updateArticle } from '@/api/articles'
import { useFavoritesStore } from '@/stores/favorites'

const route = useRoute()
const router = useRouter()
const favStore = useFavoritesStore()

const article = ref(null)
const loading = ref(false)
const errorMsg = ref('')
const editing = ref(false)
const saving = ref(false)
const saveError = ref('')
const editForm = ref({ title: '', category: '', content: '' })

const notes = ref(JSON.parse(localStorage.getItem(`notes_${route.params.id}`) || '[]'))

const renderedContent = computed(() =>
  article.value ? snarkdown(article.value.content || '') : ''
)

async function loadArticle() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await getArticle(route.params.id)
    article.value = res.data || res
  } catch (err) {
    errorMsg.value = err.message || '获取文章失败'
  } finally {
    loading.value = false
  }
}

function startEdit() {
  editForm.value = {
    title: article.value.title,
    category: article.value.category || '',
    content: article.value.content || ''
  }
  editing.value = true
  saveError.value = ''
}

function cancelEdit() {
  editing.value = false
}

async function saveEdit() {
  saving.value = true
  saveError.value = ''
  try {
    const res = await updateArticle(article.value._id, editForm.value)
    article.value = res.data || res
    editing.value = false
  } catch (err) {
    saveError.value = err.message || '保存失败'
  } finally {
    saving.value = false
  }
}

function addNote() {
  const selection = window.getSelection()
  const text = selection?.toString().trim()
  if (!text) {
    alert('请先在正文中选中文字')
    return
  }
  notes.value.push({ text, time: new Date().toLocaleString('zh-CN') })
  localStorage.setItem(`notes_${route.params.id}`, JSON.stringify(notes.value))
}

function removeNote(idx) {
  notes.value.splice(idx, 1)
  localStorage.setItem(`notes_${route.params.id}`, JSON.stringify(notes.value))
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(loadArticle)
</script>

<style scoped>
.back-bar { margin-bottom: 20px; }

.loading-mask {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  padding: 48px 0;
  justify-content: center;
}
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  display: inline-block;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  border-radius: var(--radius);
  padding: 14px 18px;
  font-size: 14px;
}
.mt-8 { margin-top: 8px; }

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  align-items: start;
}
@media (max-width: 768px) {
  .detail-layout { grid-template-columns: 1fr; }
}

.detail-card { padding: 28px 32px; }
.detail-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.detail-actions { display: flex; gap: 8px; }
.detail-title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 10px;
}
.detail-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}
.detail-body {
  line-height: 1.8;
  font-size: 15px;
  user-select: text;
}
.detail-body :deep(h1), .detail-body :deep(h2), .detail-body :deep(h3) {
  margin: 20px 0 10px;
  font-weight: 600;
}
.detail-body :deep(p) { margin-bottom: 14px; }
.detail-body :deep(code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.btn-warning { background: var(--warning); color: #fff; }

/* 编辑表单 */
.edit-form { margin-top: 12px; }
.form-group { margin-bottom: 16px; }
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--text-muted);
}
.form-input, .form-textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  transition: border-color .2s;
  resize: vertical;
}
.form-input:focus, .form-textarea:focus { border-color: var(--primary); }
.edit-actions { display: flex; gap: 10px; }

/* 笔记侧边栏 */
.side-card { padding: 20px; }
.side-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
.side-hint { font-size: 12px; color: var(--text-muted); }
.empty-notes { font-size: 13px; color: #cbd5e1; margin-top: 12px; }
.note-list { list-style: none; margin-top: 12px; }
.note-item {
  position: relative;
  padding: 10px 28px 10px 0;
  border-bottom: 1px dashed var(--border);
}
.note-quote {
  font-size: 13px;
  color: var(--text);
  border-left: 3px solid var(--primary);
  padding-left: 8px;
  margin-bottom: 4px;
}
.note-time { font-size: 11px; color: #94a3b8; }
.note-del {
  position: absolute;
  right: 0;
  top: 10px;
  background: none;
  font-size: 12px;
  color: #94a3b8;
}
.note-del:hover { color: var(--danger); }
</style>
