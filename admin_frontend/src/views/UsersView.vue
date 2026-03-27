<template>
  <div class="users-page">
    <div class="page-header">
      <h2 class="section-title">用户管理</h2>
      <div class="search-wrap">
        <input v-model="keyword" type="text" placeholder="搜索用户名/姓名/手机" @keyup.enter="loadUsers(1)" />
        <button class="btn btn-primary btn-sm" @click="loadUsers(1)">搜索</button>
      </div>
    </div>

    <div v-if="successMsg" class="alert-success mb-12">{{ successMsg }}</div>
    <div v-if="errorMsg" class="alert-error mb-12">{{ errorMsg }}</div>

    <div class="card table-card">
      <div v-if="loading" class="loading-center"><span class="spinner"></span> 加载中…</div>
      <div v-else-if="list.length === 0" class="empty-state">暂无用户数据</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>真实姓名</th>
            <th>手机号</th>
            <th>家庭住址</th>
            <th>注册时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in list" :key="user._id">
            <td>{{ user.username }}</td>
            <td>{{ user.realName || '—' }}</td>
            <td>{{ user.phone || '—' }}</td>
            <td>{{ user.address || '—' }}</td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <span :class="['status-dot', user.isActive ? 'active' : 'disabled']">
                {{ user.isActive ? '正常' : '禁用' }}
              </span>
            </td>
            <td class="actions-cell">
              <button
                v-if="user.isActive"
                class="btn btn-warning btn-sm"
                @click="handleDisable(user)"
              >禁用</button>
              <button
                v-else
                class="btn btn-primary btn-sm"
                @click="handleEnable(user)"
              >启用</button>
              <button
                class="btn btn-outline btn-sm"
                @click="handleResetPwd(user)"
              >重置密码</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > pageSize">
      <button class="page-btn" :disabled="page <= 1" @click="loadUsers(page - 1)">上一页</button>
      <button
        v-for="p in totalPages"
        :key="p"
        :class="['page-btn', p === page && 'active']"
        @click="loadUsers(p)"
      >{{ p }}</button>
      <button class="page-btn" :disabled="page >= totalPages" @click="loadUsers(page + 1)">下一页</button>
      <span class="page-info">共 {{ total }} 人</span>
    </div>

    <!-- 重置密码结果 Modal -->
    <div v-if="resetResult" class="modal-overlay" @click.self="resetResult = null">
      <div class="modal-box card">
        <h3 class="modal-title">密码已重置</h3>
        <p>用户 <strong>{{ resetResult.username }}</strong> 的新临时密码为：</p>
        <div class="temp-pwd">{{ resetResult.tempPassword }}</div>
        <p class="pwd-hint">请通知用户登录后及时修改密码。</p>
        <button class="btn btn-primary" @click="resetResult = null">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUsers, disableUser, enableUser, resetPassword } from '@/api/admin'

const list = ref([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const successMsg = ref('')
const errorMsg = ref('')
const resetResult = ref(null)

async function loadUsers(p = 1) {
  loading.value = true
  page.value = p
  errorMsg.value = ''
  try {
    const res = await getUsers({ page: p, limit: pageSize.value, keyword: keyword.value })
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

async function handleDisable(user) {
  if (!confirm(`确定禁用用户 ${user.username}？`)) return
  try {
    await disableUser(user._id)
    user.isActive = false
    showSuccess(`用户 ${user.username} 已禁用`)
  } catch (err) {
    errorMsg.value = err.message || '操作失败'
  }
}

async function handleEnable(user) {
  try {
    await enableUser(user._id)
    user.isActive = true
    showSuccess(`用户 ${user.username} 已启用`)
  } catch (err) {
    errorMsg.value = err.message || '操作失败'
  }
}

async function handleResetPwd(user) {
  if (!confirm(`确定重置用户 ${user.username} 的密码？`)) return
  try {
    const res = await resetPassword(user._id)
    resetResult.value = { username: user.username, tempPassword: res.data.tempPassword }
  } catch (err) {
    errorMsg.value = err.message || '重置失败'
  }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(() => loadUsers(1))
</script>

<style scoped>
.users-page {}
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.section-title { font-size: 20px; font-weight: 700; }
.search-wrap { display: flex; gap: 8px; }
.search-wrap input {
  padding: 7px 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px; width: 260px;
}
.search-wrap input:focus { border-color: var(--primary); }
.mb-12 { margin-bottom: 12px; }
.loading-center { display: flex; align-items: center; gap: 8px; justify-content: center; padding: 40px; color: var(--text-muted); }
.spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; color: var(--text-muted); padding: 40px; }
.table-card { overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; }
.data-table th { background: #f8fafc; font-weight: 600; font-size: 13px; color: var(--text-muted); }
.data-table tr:hover td { background: #f8fffe; }
.status-dot { padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
.status-dot.active { background: #dcfce7; color: #15803d; }
.status-dot.disabled { background: #fee2e2; color: #b91c1c; }
.actions-cell { display: flex; gap: 6px; align-items: center; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 20px; flex-wrap: wrap; }
.page-btn { padding: 6px 14px; border-radius: var(--radius); border: 1px solid var(--border); background: #fff; font-size: 14px; cursor: pointer; }
.page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.page-btn.active { background: var(--primary); border-color: var(--primary); color: #fff; }
.page-btn:disabled { opacity: .4; cursor: not-allowed; }
.page-info { font-size: 13px; color: var(--text-muted); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-box { padding: 28px; max-width: 360px; width: 90%; text-align: center; }
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 14px; }
.temp-pwd { font-size: 28px; font-weight: 700; color: var(--primary); background: #f0fdf4; padding: 12px 20px; border-radius: var(--radius); margin: 14px 0; letter-spacing: 2px; }
.pwd-hint { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
</style>
