# 乡村建言平台项目说明文档

## 1. 项目目标
构建一个“乡村建言平台”，包含以下三个端：
- **客户端（普通用户）**：用户可以浏览、搜索建言，注册登录，发表建言，编辑自己的建言，收藏感兴趣的建言。
- **管理员端**：管理员可以登录，管理所有建言（审核、删除），管理用户（禁用、重置密码），查看平台统计数据。
- **后端**：提供RESTful API，处理业务逻辑，与MongoDB交互，实现用户认证与授权。

## 2. 项目结构
```
rural_public_platform/
├── frontend/               # 客户端前端（基于现有frontend改造）
│   ├── src/
│   │   ├── api/            # API请求模块
│   │   ├── assets/
│   │   ├── components/     # 可复用组件
│   │   ├── router/         # Vue Router路由配置
│   │   ├── stores/         # Pinia状态管理
│   │   ├── views/          # 页面视图
│   │   ├── App.vue
│   │   └── main.js
│   └── ...
├── admin_frontend/         # 管理员端前端（新建）
│   ├── src/                # 结构与frontend类似，但仅管理员可访问
│   └── ...
└── backend/                # 后端（基于现有backend改造）
    ├── controllers/        # 控制器
    ├── models/             # Mongoose模型
    ├── middleware/         # 中间件（JWT验证、权限控制等）
    ├── routes/             # 路由定义
    ├── config/             # 配置文件
    ├── utils/              # 工具函数
    ├── app.js
    └── server.js
```

## 3. 技术栈
- **前端**：Vue 3 + Pinia + Vue Router + Axios + Element Plus / Ant Design Vue（UI框架）
- **后端**：Node.js + Express + MongoDB（Mongoose） + JWT + bcryptjs
- **工具**：Postman（API测试），Git

## 4. 详细功能需求

### 4.1 用户端（客户端）
- **用户注册/登录**：使用手机号或邮箱注册，密码加密存储。登录后返回JWT token，前端保存至localStorage或cookie，并在后续请求的Authorization头中携带。
- **建言列表**：支持分页（每页10条），可按时间、热度排序，可按关键词搜索标题/内容。
- **建言详情**：展示完整内容、作者、发布时间、点赞数、收藏数。用户可对建言进行收藏/取消收藏（仅登录用户）。
- **个人中心**：用户可以查看/修改个人信息（昵称、头像等），查看自己发表的建言列表（分页），查看收藏的建言列表（分页），编辑或删除自己发表的建言。
- **发表建言**：登录用户可以发表新建言，包含标题、内容、图片（可选）等字段。
- **编辑建言**：用户只能编辑自己发表的建言（内容、标题等）。
- **收藏功能**：用户可收藏其他用户的建言，收藏列表在个人中心展示。
- **权限控制**：未登录用户只能浏览建言列表和详情，无法发表、编辑、收藏；登录后才能执行以上操作。

### 4.2 管理员端
- **管理员登录**：使用特定账号登录，权限标识为`role: 'admin'`。
- **建言管理**：查看所有建言（分页、搜索），可审核（通过/驳回）或删除建言。可置顶或加精。
- **用户管理**：查看所有用户列表（分页），可禁用/启用用户，重置用户密码（生成临时密码）。
- **统计概览**：展示平台总用户数、总建言数、今日新增等统计数据。

### 4.3 后端
- **用户模块**：注册、登录、获取用户信息、更新用户信息（普通用户和管理员各自权限）、修改密码。
- **建言模块**：创建、分页查询（支持条件筛选）、获取单个建言、更新建言（仅作者或管理员可操作）、删除建言（仅作者或管理员可操作）。收藏/取消收藏接口，获取用户收藏列表。
- **管理员模块**：获取所有用户（分页）、禁用/启用用户、重置用户密码；获取所有建言（分页，含审核状态）；审核建言。
- **全局中间件**：
  - JWT验证：解析Authorization头，将用户信息挂载到`req.user`。
  - 权限控制：区分普通用户和管理员，部分接口仅管理员可访问。
  - 错误处理：统一错误响应格式。
- **数据库设计**：
  - User模型：username, password (hash), email/phone, avatar, role (user/admin), isActive (boolean), createdAt, updatedAt
  - Suggestion模型：title, content, images (array), author (ObjectId ref User), status (pending/approved/rejected), likesCount, favoritesCount, isTop, createdAt, updatedAt
  - Favorite模型：user (ObjectId ref User), suggestion (ObjectId ref Suggestion), createdAt （用于记录收藏关系）
  - 注：收藏数量可通过Favorite集合统计，也可在Suggestion中冗余字段。

## 5. API规范（RESTful风格）
- **基础URL**：`/api/v1`
- **统一响应格式**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {}
  }
  ```
- **错误码**：400（参数错误）、401（未认证）、403（无权限）、404（资源不存在）、500（服务器错误）
- **认证方式**：Bearer Token（JWT），在请求头`Authorization: Bearer <token>`中传递。
- **主要接口示例**：
  - 用户
    - POST `/auth/register` 注册
    - POST `/auth/login` 登录
    - GET `/users/me` 获取当前用户信息
    - PUT `/users/me` 更新个人信息
    - POST `/users/change-password` 修改密码
  - 建言
    - GET `/suggestions` 分页获取建言列表（支持查询参数：page, limit, keyword, sort）
    - GET `/suggestions/:id` 获取单个建言
    - POST `/suggestions` 创建建言
    - PUT `/suggestions/:id` 更新建言
    - DELETE `/suggestions/:id` 删除建言
    - POST `/suggestions/:id/favorite` 收藏/取消收藏（toggle）
    - GET `/users/me/favorites` 获取当前用户收藏列表
    - GET `/users/me/suggestions` 获取当前用户发表的建言
  - 管理员
    - GET `/admin/users` 获取用户列表
    - PUT `/admin/users/:id/disable` 禁用用户
    - PUT `/admin/users/:id/enable` 启用用户
    - PUT `/admin/users/:id/reset-password` 重置密码
    - GET `/admin/suggestions` 获取所有建言（含审核状态）
    - PUT `/admin/suggestions/:id/status` 更新审核状态

## 6. 前端实现要点
- **路由与全局前置守卫**：使用Vue Router，在路由配置中标记需要登录或需要管理员权限的页面。在`beforeEach`中检查token和用户角色，未登录则跳转到登录页，无权限则跳转到403页或首页。
- **状态管理（Pinia）**：创建user store，存储用户信息（id, username, role, avatar等），登录后获取并存储；退出登录时清空。所有组件通过store获取用户状态，实现响应式同步。
- **Axios拦截器**：
  - 请求拦截器：在请求头中添加`Authorization: Bearer ${token}`（token从localStorage读取）。
  - 响应拦截器：统一处理错误，如401自动跳转登录，403提示权限不足。
- **组件通讯**：使用Pinia store共享用户信息；其他组件间通讯使用props/emits或provide/inject。
- **分页实现**：后端支持分页参数，前端使用分页组件（如el-pagination），监听页码变化重新请求数据。
- **文本编辑**：使用富文本编辑器（如Quill）或简单文本框，允许用户编辑建言内容。收藏功能通过调用接口切换状态，并更新界面。

## 7. 后端实现要点
- **中间件**：
  - `authMiddleware`：验证JWT，解析用户信息并挂载到`req.user`。
  - `adminMiddleware`：在auth基础上，检查`req.user.role`是否为'admin'，否则返回403。
- **密码加密**：使用bcryptjs对密码进行哈希存储。
- **JWT签发**：登录成功后生成包含用户id和role的token，设置有效期（如7天）。
- **权限控制**：在路由层面对应接口添加中间件。例如创建建言需要authMiddleware，更新建言需要authMiddleware并检查用户是否是作者或管理员，删除建言类似。
- **收藏功能**：使用Favorite模型记录用户-建言关系，并在toggle接口中实现添加或删除，同时更新Suggestion中的favoritesCount（可通过mongoose的pre save钩子或手动更新）。
- **数据库索引**：为常用查询字段（如suggestions的author, createdAt，favorites的user, suggestion）建立索引以提升性能。
- **数据校验**：使用express-validator或Joi对请求参数进行校验，返回明确的错误信息。

## 8. 安全考虑
- **前端**：路由守卫仅做UI拦截，后端必须做最终权限校验。
- **后端**：
  - 敏感接口（如管理员操作）必须验证管理员权限。
  - 用户密码不得返回给前端。
  - 使用HTTPS（生产环境）。
  - 防止XSS和CSRF（设置CORS策略，使用httpOnly cookie存储token可选，但本项目可使用localStorage + 请求头方式）。
  - 对用户输入进行过滤，防止MongoDB注入。
- **JWT**：选择合适的密钥，不公开。

## 9. 开发与部署
- 开发环境：本地MongoDB实例或云数据库，前后端分离启动。
- 部署：前端打包为静态文件部署到Nginx，后端使用PM2运行Node应用，配置反向代理。