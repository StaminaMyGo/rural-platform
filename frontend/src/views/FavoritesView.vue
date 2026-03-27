<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">我的收藏</h2>
    </div>

    <div v-if="loading" class="loading-center">
      <span class="spinner"></span> 加载中…
    </div>
    <div v-else-if="errorMsg" class="alert-error">{{ errorMsg }}</div>
    <div v-else>
      <div v-if="list.length === 0" class="empty-state">
        您还没有收藏任何建言。
      </div>

      <div class="opinions-list">
        <div v-for="sug in list" :key="sug._id" class="opinion-item card">
          <div class="opinion-header">
            <router-link :to="`/suggestion/${sug._id}`" class="opinion-title">{{ sug.title }}</router-link>
            <div class="opinion-meta">
              <span>{{ sug.authorName }}</span>
              <span>{{ formatDate(sug.createdAt) }}</span>
            </div>
          </div>
          <div class="opinion-content">{{ sug.content?.slice(0, 100) }}{{ sug.content?.length > 100 ? '…' : '' }}</div>
          <div class="opinion-footer">
            <span :class="['cat-tag', `cat-${sug.category}`]">{{ sug.category }}</span>
            <button class="action-btn" @click="unfavorite(sug)">★ 取消收藏</button>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="total > pageSize">
        <button class="page-btn" :disabled="page <= 1" @click="loadFavorites(page - 1)">上一页</button>
        <button
          v-for="p in totalPages"
          :key="p"
          :class="['page-btn', p === page && 'active']"
          @click="loadFavorites(p)"
        >{{ p }}</button>
        <button class="page-btn" :disabled="page >= totalPages" @click="loadFavorites(page + 1)">下一页</button>
        <span class="page-info">共 {{ total }} 条</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMyFavorites, favoriteSuggestion } from '@/api/suggestions'
import { useFavoritesStore } from '@/stores/favorites'

const favStore = useFavoritesStore()
const list = ref([])
const loading = ref(false)
const errorMsg = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

async function loadFavorites(p = 1) {
  loading.value = true
  errorMsg.value = ''
  page.value = p
  try {
    const res = await getMyFavorites({ page: p, limit: pageSize.value })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (err) {
    errorMsg.value = err.message || '加载收藏失败'
  } finally {
    loading.value = false
  }
}

async function unfavorite(sug) {
  try {
    await favoriteSuggestion(sug._id)
    favStore.favoritedIds.delete(sug._id.toString())
    list.value = list.value.filter(s => s._id !== sug._id)
    total.value = Math.max(0, total.value - 1)
  } catch (err) {
    alert(err.message || '操作失败')
  }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(() => loadFavorites(1))
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-size: 20px; font-weight: 700; }
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
.alert-error { background: #fee2e2; color: #b91c1c; border-radius: var(--radius); padding: 14px 18px; }
.empty-state { text-align: center; color: var(--text-muted); padding: 60px 0; }
.opinions-list { display: flex; flex-direction: column; gap: 14px; }
.opinion-item { padding: 18px 22px; transition: box-shadow .2s; }
.opinion-item:hover { box-shadow: var(--shadow-md); }
.opinion-header { margin-bottom: 8px; }
.opinion-title {
  font-size: 16px; font-weight: 600; color: var(--text);
  display: block; margin-bottom: 4px;
}
.opinion-title:hover { color: var(--primary); }
.opinion-meta { display: flex; gap: 10px; font-size: 12px; color: var(--text-muted); }
.opinion-content { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.6; }
.opinion-footer { display: flex; justify-content: space-between; align-items: center; }
.cat-tag {
  display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500;
}
.cat-环境 { background: #dcfce7; color: #15803d; }
.cat-教育 { background: #dbeafe; color: #1d4ed8; }
.cat-医疗 { background: #fce7f3; color: #9d174d; }
.cat-交通 { background: #fed7aa; color: #9a3412; }
.cat-其他 { background: #f1f5f9; color: #475569; }
.action-btn {
  padding: 4px 12px; border-radius: var(--radius);
  border: 1px solid #f59e0b; background: #fff;
  font-size: 13px; color: #d97706; cursor: pointer; transition: all .2s;
}
.action-btn:hover { background: #fffbeb; }
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; margin-top: 24px; flex-wrap: wrap;
}
.page-btn {
  padding: 6px 14px; border-radius: var(--radius); border: 1px solid var(--border);
  background: #fff; font-size: 14px; color: var(--text); transition: all .2s;
}
.page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.page-btn.active { background: var(--primary); border-color: var(--primary); color: #fff; }
.page-btn:disabled { opacity: .4; cursor: not-allowed; }
.page-info { font-size: 13px; color: var(--text-muted); }
</style>
