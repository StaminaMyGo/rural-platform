All implementation is complete. Here's a comprehensive summary of everything implemented:

---

## 实现总结

### 后端 (`backend/`) — 新增/修改文件

**模型层 (models)**
- `User.js` — 扩展字段：`realName`、`phone`、`address`、`avatar`、`isActive`
- `Suggestion.js` _(新建)_ — 建言模型：标题、内容、分类、状态(pending/approved/rejected)、点赞、收藏、官方回复
- `Comment.js` _(新建)_ — 用户评论模型
- `Favorite.js` _(新建)_ — 收藏关系模型（user + suggestion 唯一索引）

**中间件 (middleware)**
- `admin.js` _(新建)_ — 管理员权限校验中间件

**路由 (routes)**
- `auth.js` — 注册时支持 realName/phone/address；登录时检查 isActive；返回完整用户信息
- `suggestions.js` _(新建)_ — CRUD + 点赞切换 + 收藏切换 + 评论列表/发表 + 官方回复
- `users.js` _(新建)_ — 个人信息查看/修改、修改密码、我的建言、我的收藏、点赞ID集合
- `admin.js` _(新建)_ — 平台统计、用户列表/禁用/启用/重置密码、建言审核/置顶/删除

**入口**
- `app.js` — 挂载 `/api/v1/suggestions`、`/api/v1/users`、`/api/v1/admin` 路由
- `scripts/seed.js` — 创建示例村民用户 + 6条建言 + 评论 + 官方回复

---

### 用户端前端 (`frontend/`) — 新增/修改文件

| 文件 | 变化 |
|------|------|
| `src/api/suggestions.js` | _(新建)_ 所有建言/用户/收藏 API |
| `src/stores/auth.js` | 新增 register/updateUser；isAdmin/displayName computed |
| `src/stores/favorites.js` | 改为调用后端 API（不再用 localStorage）|
| `src/App.vue` | 改名为"乡村建言平台"，添加发布建言模态框，显示用户角色 |
| `src/views/LoginView.vue` | 登录/注册双 Tab，绿色乡村主题 |
| `src/views/HomeView.vue` | 建言列表：分类筛选、排序、点赞/收藏/评论数 |
| `src/views/SuggestionDetail.vue` | _(新建)_ 建言详情：点赞、收藏、评论区、官方回复、编辑/删除 |
| `src/views/FavoritesView.vue` | 改为调用后端 API 分页展示 |
| `src/views/ProfileView.vue` | _(新建)_ 个人中心：编辑信息、修改密码、我的建言列表 |
| `src/router/index.js` | 新增 `/suggestion/:id`、`/profile` 路由；`/article/:id` 重定向 |

---

### 管理员端 (`admin_frontend/`) — 全新项目

- **端口 5174**，代理到后端 `localhost:3000`
- `LoginView.vue` — 仅管理员可登录（角色验证）
- `DashboardView.vue` — 统计数据卡片 + 快速入口
- `UsersView.vue` — 用户列表、禁用/启用、重置密码（弹窗显示临时密码）
- `SuggestionsView.vue` — 建言管理：审核通过/拒绝、置顶、官方回复、删除

---

### 启动方式

```bash
# 初始化测试数据（需要 MongoDB 连接）
cd backend && node scripts/seed.js

# 启动后端
cd backend && npm run dev

# 启动用户端
cd frontend && npm run dev      # http://localhost:5173

# 启动管理员端
cd admin_frontend && npm run dev  # http://localhost:5174
```

**测试账号**：`admin / 123456`（管理员）| `zhangsan / 123456`（村民）