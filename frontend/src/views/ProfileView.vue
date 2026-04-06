<template>
  <div class="profile-page">
    <h2 class="page-title">个人中心</h2>

    <div class="profile-grid">
      <!-- 左侧：个人信息 -->
      <div class="profile-main">
        <div class="card profile-card">
          <h3 class="card-title">个人信息</h3>
          <div v-if="!editInfo">
            <div class="info-row"><span class="info-label">用户名</span><span>{{ user?.username }}</span></div>
            <div class="info-row"><span class="info-label">真实姓名</span><span>{{ user?.realName || '未填写' }}</span></div>
            <div class="info-row"><span class="info-label">手机号</span><span>{{ user?.phone || '未填写' }}</span></div>
            <div class="info-row"><span class="info-label">家庭住址</span><span>{{ user?.address || '未填写' }}</span></div>
            <div class="info-row"><span class="info-label">角色</span><span>{{ user?.role === 'admin' ? '管理员' : '村民' }}</span></div>
            <button class="btn btn-outline btn-sm mt-12" @click="startEditInfo">编辑信息</button>
          </div>
          <form v-else @submit.prevent="saveInfo">
            <div class="form-group">
              <label>真实姓名</label>
              <input v-model="infoForm.realName" type="text" placeholder="请输入真实姓名" />
            </div>
            <div class="form-group">
              <label>手机号</label>
              <input v-model="infoForm.phone" type="text" placeholder="请输入手机号" />
            </div>
            <div class="form-group">
              <label>家庭住址</label>
              <input v-model="infoForm.address" type="text" placeholder="请输入家庭住址" />
            </div>
            <div v-if="infoMsg" :class="infoMsgOk ? 'alert-success' : 'alert-error'">{{ infoMsg }}</div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline btn-sm" @click="editInfo = false">取消</button>
              <button type="submit" class="btn btn-primary btn-sm" :disabled="savingInfo">
                {{ savingInfo ? '保存中…' : '保存' }}
              </button>
            </div>
          </form>
        </div>

        <!-- 修改密码 -->
        <div class="card profile-card">
          <h3 class="card-title">修改密码</h3>
          <form @submit.prevent="savePassword">
            <div class="form-group">
              <label>原密码</label>
              <input v-model="pwdForm.oldPassword" type="password" placeholder="请输入原密码" required />
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input v-model="pwdForm.newPassword" type="password" placeholder="至少6位" required />
            </div>
            <div v-if="pwdMsg" :class="pwdMsgOk ? 'alert-success' : 'alert-error'">{{ pwdMsg }}</div>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="savingPwd">
              {{ savingPwd ? '修改中…' : '确认修改' }}
            </button>
          </form>
        </div>
      </div>

      <!-- 右侧：我发表的建言 -->
      <div class="card suggestions-card">
        <h3 class="card-title">我发表的建言</h3>
        <div v-if="loadingSugs" class="loading-center"><span class="spinner"></span></div>
        <div v-else-if="mySuggestions.length === 0" class="empty-state">暂无建言</div>
        <div v-else class="my-suggestions-list">
          <div v-for="sug in mySuggestions" :key="sug._id" class="sug-item">
            <router-link :to="`/suggestion/${sug._id}`" class="sug-title">{{ sug.title }}</router-link>
            <div class="sug-meta">
              <span :class="['cat-tag', `cat-${sug.category}`]">{{ sug.category }}</span>
              <span :class="['status-badge', `status-${sug.status}`]">{{ statusLabel(sug.status) }}</span>
              <span class="sug-date">{{ formatDate(sug.createdAt) }}</span>
            </div>
          </div>
        </div>
        <div class="pagination" v-if="sugTotal > sugPageSize">
          <button class="page-btn" :disabled="sugPage <= 1" @click="loadMySuggestions(sugPage - 1)">上一页</button>
          <button class="page-btn" :disabled="sugPage >= sugTotalPages" @click="loadMySuggestions(sugPage + 1)">下一页</button>
          <span class="page-info">第 {{ sugPage }}/{{ sugTotalPages }} 页</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getProfile, updateProfile, changePassword, getMySuggestions } from '@/api/suggestions'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const editInfo = ref(false)
const savingInfo = ref(false)
const infoMsg = ref('')
const infoMsgOk = ref(false)
const infoForm = ref({ realName: '', phone: '', address: '' })

const savingPwd = ref(false)
const pwdMsg = ref('')
const pwdMsgOk = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '' })

const mySuggestions = ref([])
const loadingSugs = ref(false)
const sugPage = ref(1)
const sugPageSize = ref(5)
const sugTotal = ref(0)
const sugTotalPages = computed(() => Math.ceil(sugTotal.value / sugPageSize.value))

function startEditInfo() {
  infoForm.value = {
    realName: user.value?.realName || '',
    phone: user.value?.phone || '',
    address: user.value?.address || ''
  }
  infoMsg.value = ''
  editInfo.value = true
}

async function saveInfo() {
  savingInfo.value = true
  infoMsg.value = ''
  try {
    const res = await updateProfile(infoForm.value)
    authStore.updateUser(res.data)
    infoMsgOk.value = true
    infoMsg.value = '个人信息更新成功！'
    setTimeout(() => { editInfo.value = false; infoMsg.value = '' }, 1200)
  } catch (err) {
    infoMsgOk.value = false
    infoMsg.value = err.message || '保存失败'
  } finally {
    savingInfo.value = false
  }
}

async function savePassword() {
  savingPwd.value = true
  pwdMsg.value = ''
  try {
    const res = await changePassword(pwdForm.value)
    pwdMsgOk.value = true
    pwdMsg.value = res.message || '密码修改成功，请重新登录'
    pwdForm.value = { oldPassword: '', newPassword: '' }
    setTimeout(() => { authStore.logout(); window.location.href = '/login' }, 1500)
  } catch (err) {
    pwdMsgOk.value = false
    pwdMsg.value = err.message || '修改失败'
  } finally {
    savingPwd.value = false
  }
}

async function loadMySuggestions(p = 1) {
  loadingSugs.value = true
  sugPage.value = p
  try {
    const res = await getMySuggestions({ page: p, limit: sugPageSize.value })
    mySuggestions.value = res.data?.list || []
    sugTotal.value = res.data?.total || 0
  } catch { /* ignore */ } finally {
    loadingSugs.value = false
  }
}

function statusLabel(s) {
  return { pending: '待审核', approved: '已通过', rejected: '已拒绝' }[s] || s
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(() => loadMySuggestions(1))
</script>

<style scoped>
.profile-page { max-width: 1000px; margin: 0 auto; }
.page-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; }
.profile-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 760px) {
  .profile-grid { grid-template-columns: 1fr; }
}
.profile-main { display: flex; flex-direction: column; gap: 20px; }
.card { padding: 24px; }
/* .profile-card, .suggestions-card {} */
.card-title { font-size: 16px; font-weight: 700; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.info-row { display: flex; gap: 16px; align-items: baseline; margin-bottom: 12px; font-size: 14px; }
.info-label { font-weight: 500; width: 80px; color: var(--text-muted); flex-shrink: 0; }
.mt-12 { margin-top: 12px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 5px; }
.form-group input {
  width: 100%; padding: 8px 12px;
  border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px;
}
.form-group input:focus { border-color: var(--primary); }
.form-actions { display: flex; gap: 8px; margin-top: 4px; }
.alert-error { background: #fee2e2; color: #b91c1c; border-radius: var(--radius); padding: 8px 12px; font-size: 13px; margin-bottom: 12px; }
.alert-success { background: #dcfce7; color: #15803d; border-radius: var(--radius); padding: 8px 12px; font-size: 13px; margin-bottom: 12px; }

.loading-center { display: flex; justify-content: center; padding: 20px; }
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--border); border-top-color: var(--primary);
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; color: var(--text-muted); padding: 20px 0; font-size: 14px; }
.my-suggestions-list { display: flex; flex-direction: column; gap: 12px; }
.sug-item { padding: 12px 14px; background: #f8fafc; border-radius: var(--radius); border: 1px solid var(--border); }
.sug-title { font-size: 14px; font-weight: 600; color: var(--text); display: block; margin-bottom: 6px; }
.sug-title:hover { color: var(--primary); }
.sug-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.cat-tag {
  display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 500;
}
.cat-环境 { background: #dcfce7; color: #15803d; }
.cat-教育 { background: #dbeafe; color: #1d4ed8; }
.cat-医疗 { background: #fce7f3; color: #9d174d; }
.cat-交通 { background: #fed7aa; color: #9a3412; }
.cat-其他 { background: #f1f5f9; color: #475569; }
.status-badge { padding: 1px 8px; border-radius: 999px; font-size: 11px; }
.status-pending { background: #fef9c3; color: #854d0e; }
.status-approved { background: #dcfce7; color: #15803d; }
.status-rejected { background: #fee2e2; color: #b91c1c; }
.sug-date { font-size: 12px; color: var(--text-muted); }
.pagination { display: flex; align-items: center; gap: 6px; margin-top: 14px; }
.page-btn {
  padding: 5px 12px; border-radius: var(--radius); border: 1px solid var(--border);
  background: #fff; font-size: 13px; cursor: pointer;
}
.page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.page-btn:disabled { opacity: .4; cursor: not-allowed; }
.page-info { font-size: 13px; color: var(--text-muted); }
</style>
