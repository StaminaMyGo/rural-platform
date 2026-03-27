<template>
  <div id="admin-root">
    <!-- 侧边栏 -->
    <aside v-if="authStore.isLoggedIn" class="sidebar">
      <div class="sidebar-logo">🌾 管理端</div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" active-class="active" exact>
          📊 数据概览
        </router-link>
        <router-link to="/suggestions" class="nav-item" active-class="active">
          📋 建言管理
        </router-link>
        <router-link to="/users" class="nav-item" active-class="active">
          👥 用户管理
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="admin-info">{{ authStore.displayName }}</div>
        <button class="btn btn-outline btn-sm" @click="handleLogout">退出登录</button>
      </div>
    </aside>

    <!-- 主区域 -->
    <div :class="authStore.isLoggedIn ? 'main-area' : 'full-area'">
      <header v-if="authStore.isLoggedIn" class="top-bar">
        <h2 class="page-heading">乡村建言平台 · 管理后台</h2>
      </header>
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
#admin-root {
  min-height: 100vh;
  display: flex;
}
.sidebar {
  width: var(--sidebar-w);
  background: #1a3a28;
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 200;
}
.sidebar-logo {
  padding: 20px 18px;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255,255,255,.1);
}
.sidebar-nav {
  flex: 1;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  color: rgba(255,255,255,.75);
  font-size: 14px;
  transition: all .2s;
}
.nav-item:hover,
.nav-item.active {
  background: rgba(255,255,255,.12);
  color: #fff;
}
.sidebar-footer {
  padding: 16px 18px;
  border-top: 1px solid rgba(255,255,255,.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.admin-info {
  font-size: 13px;
  color: rgba(255,255,255,.7);
}
.sidebar-footer .btn-outline {
  border-color: rgba(255,255,255,.4);
  color: rgba(255,255,255,.8);
}
.sidebar-footer .btn-outline:hover {
  background: rgba(255,255,255,.1);
}

.main-area {
  margin-left: var(--sidebar-w);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.full-area {
  flex: 1;
}
.top-bar {
  background: #fff;
  border-bottom: 1px solid var(--border);
  padding: 0 28px;
  height: 54px;
  display: flex;
  align-items: center;
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}
.page-heading {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}
.main-content {
  padding: 28px;
  flex: 1;
}
</style>
