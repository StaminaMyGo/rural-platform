<template>
  <div>
    <!-- 顶部搜索 & 筛选栏 -->
    <div class="filter-bar">
      <div class="search-wrap">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索建言关键词..."
          class="search-input"
          @keyup.enter="doSearch"
        />
        <button class="btn btn-primary" @click="doSearch">搜索</button>
      </div>
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat.value"
          :class="['cat-btn', activeCategory === cat.value && 'active']"
          @click="selectCategory(cat.value)"
        >{{ cat.label }}</button>
      </div>
      <div class="sort-wrap">
        <select v-model="sortBy" @change="fetchSuggestions(1)" class="sort-select">
          <option value="latest">最新发布</option>
          <option value="hot">最热建言</option>
        </select>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-center">
      <span class="spinner"></span> 加载中…
    </div>

    <!-- 错误提示 -->
    <div v-else-if="errorMsg" class="alert-error">{{ errorMsg }}</div>

    <!-- 建言列表 -->
    <div v-else>
      <div v-if="suggestions.length === 0" class="empty-state">
        暂无建言，快来发布第一条建言吧 🌾
      </div>

      <div class="opinions-list">
        <div
          v-for="sug in suggestions"
          :key="sug._id"
          class="opinion-item card"
        >
          <div v-if="sug.isTop" class="top-badge">置顶</div>
          <div class="opinion-header">
            <router-link :to="`/suggestion/${sug._id}`" class="opinion-title">
              {{ sug.title }}
            </router-link>
            <div class="opinion-meta">
              <span class="meta-author">{{ sug.authorName }}</span>
              <span class="meta-date">{{ formatDate(sug.createdAt) }}</span>
            </div>
          </div>
          <div class="opinion-content">{{ sug.content?.slice(0, 120) }}{{ sug.content?.length > 120 ? '…' : '' }}</div>
          <div class="opinion-footer">
            <span :class="['cat-tag', `cat-${sug.category}`]">{{ sug.category }}</span>
            <div class="opinion-actions">
              <button
                :class="['action-btn like-btn', likedIds.has(sug._id) && 'liked']"
                @click.stop="handleLike(sug)"
              >
                👍 {{ sug.likesCount || 0 }}
              </button>
              <router-link :to="`/suggestion/${sug._id}`" class="action-btn comment-btn">
                💬 {{ sug.commentCount || 0 }}
              </router-link>
              <button
                :class="['action-btn fav-btn', favStore.isFavorited(sug._id) && 'favorited']"
                @click.stop="handleFavorite(sug)"
                :title="favStore.isFavorited(sug._id) ? '取消收藏' : '收藏'"
              >
                {{ favStore.isFavorited(sug._id) ? '★' : '☆' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="total > pageSize">
        <button class="page-btn" :disabled="currentPage <= 1" @click="fetchSuggestions(currentPage - 1)">上一页</button>
        <button
          v-for="page in pageNumbers"
          :key="page"
          :class="['page-btn', page === currentPage && 'active']"
          @click="fetchSuggestions(page)"
        >{{ page }}</button>
        <button class="page-btn" :disabled="currentPage >= totalPages" @click="fetchSuggestions(currentPage + 1)">下一页</button>
        <span class="page-info">共 {{ total }} 条 / 第 {{ currentPage }}/{{ totalPages }} 页</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getSuggestions, likeSuggestion, getMyLiked } from '@/api/suggestions'
import { useFavoritesStore } from '@/stores/favorites'

const favStore = useFavoritesStore()

const categories = [
  { value: 'all', label: '全部' },
  { value: '环境', label: '环境' },
  { value: '教育', label: '教育' },
  { value: '医疗', label: '医疗' },
  { value: '交通', label: '交通' },
  { value: '其他', label: '其他' }
]

const suggestions = ref([])
const loading = ref(false)
const errorMsg = ref('')
const keyword = ref('')
const activeCategory = ref('all')
const sortBy = ref('latest')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const likedIds = ref(new Set())

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const pageNumbers = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) pages.push(i)
  return pages
})

async function fetchSuggestions(page = 1) {
  loading.value = true
  errorMsg.value = ''
  currentPage.value = page
  try {
    const res = await getSuggestions({
      page: currentPage.value,
      limit: pageSize.value,
      keyword: keyword.value,
      category: activeCategory.value,
      sort: sortBy.value
    })
    suggestions.value = res.data?.list || []
    total.value = res.data?.total ?? 0
  } catch (err) {
    errorMsg.value = err.message || '获取建言列表失败'
  } finally {
    loading.value = false
  }
}

async function loadLiked() {
  try {
    const res = await getMyLiked()
    likedIds.value = new Set((res.data || []).map(id => id.toString()))
  } catch { /* ignore */ }
}

function doSearch() {
  fetchSuggestions(1)
}

function selectCategory(val) {
  activeCategory.value = val
  fetchSuggestions(1)
}

async function handleLike(sug) {
  try {
    const res = await likeSuggestion(sug._id)
    sug.likesCount = res.data.likesCount
    if (res.data.liked) {
      likedIds.value.add(sug._id.toString())
    } else {
      likedIds.value.delete(sug._id.toString())
    }
  } catch (err) {
    alert(err.message || '操作失败')
  }
}

async function handleFavorite(sug) {
  try {
    const result = await favStore.toggle(sug)
    if (result !== undefined) {
      sug.favoritesCount = result.favoritesCount
    }
  } catch (err) {
    alert(err.message || '操作失败')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(async () => {
  await Promise.all([
    fetchSuggestions(1),
    loadLiked(),
    favStore.loadFavorited()
  ])
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #fff;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.search-wrap {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}
.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
}
.search-input:focus { border-color: var(--primary); }
.category-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.cat-btn {
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 13px;
  color: var(--text-muted);
  transition: all .2s;
}
.cat-btn:hover, .cat-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.sort-select {
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  cursor: pointer;
}

.loading-center {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 60px 0;
  color: var(--text-muted);
}
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  border-radius: var(--radius);
  padding: 14px 18px;
}
.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: 60px 0;
  font-size: 15px;
}

.opinions-list { display: flex; flex-direction: column; gap: 16px; }

.opinion-item {
  padding: 20px 24px;
  position: relative;
  transition: box-shadow .2s, transform .2s;
}
.opinion-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.top-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #f59e0b;
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
}
.opinion-header {
  margin-bottom: 10px;
}
.opinion-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  display: block;
  margin-bottom: 6px;
  transition: color .2s;
}
.opinion-title:hover { color: var(--primary); }
.opinion-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--text-muted);
}
.opinion-content {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 14px;
}
.opinion-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cat-tag {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}
.cat-环境 { background: #dcfce7; color: #15803d; }
.cat-教育 { background: #dbeafe; color: #1d4ed8; }
.cat-医疗 { background: #fce7f3; color: #9d174d; }
.cat-交通 { background: #fed7aa; color: #9a3412; }
.cat-其他 { background: #f1f5f9; color: #475569; }

.opinion-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.action-btn {
  background: none;
  font-size: 13px;
  color: var(--text-muted);
  padding: 4px 10px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all .2s;
  text-decoration: none;
}
.action-btn:hover { border-color: var(--primary); color: var(--primary); }
.like-btn.liked { background: #eef2ff; border-color: var(--primary); color: var(--primary); }
.fav-btn.favorited { color: #f59e0b; border-color: #f59e0b; }

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 32px;
  flex-wrap: wrap;
}
.page-btn {
  padding: 6px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: #fff;
  font-size: 14px;
  color: var(--text);
  transition: all .2s;
}
.page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.page-btn.active { background: var(--primary); border-color: var(--primary); color: #fff; }
.page-btn:disabled { opacity: .4; cursor: not-allowed; }
.page-info { font-size: 13px; color: var(--text-muted); margin-left: 8px; }
</style>
