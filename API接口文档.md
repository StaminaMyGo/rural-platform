# 乡村公共平台 API 接口文档

## 文档说明

本文档包含乡村公共平台所有后端API接口，适用于前后端开发对接。接口遵循RESTful规范，请求/响应数据格式均为JSON。

### 通用规范

1. **请求域名**：`http://localhost:3000`（开发环境）
2. **请求头**：`Content-Type: application/json`
3. **认证**：需要认证的接口需在请求头中添加 `Authorization: Bearer <token>`
4. **响应格式**：
```json
{
  "code": 200,        // 状态码：200成功 400参数错误 401未授权 403无权限 404资源不存在 500服务器异常
  "msg": "操作成功",  // 提示信息
  "data": {}          // 业务数据（无数据时为null）
}
```

### 状态码说明
| 状态码 | 含义                      |
| ------ | ------------------------- |
| 200    | 操作成功                  |
| 400    | 请求参数错误/业务校验失败 |
| 401    | 未授权/登录失效/账号禁用  |
| 403    | 无权限访问                |
| 404    | 资源不存在                |
| 500    | 服务器内部异常            |

---

## 一、认证接口 (Auth)

### 1.1 用户注册
- **接口地址**：`POST /api/auth/register`
- **接口描述**：新用户注册，校验用户名唯一性，默认角色为村民
- **请求参数**：

| 参数名   | 类型   | 是否必填 | 说明             |
| -------- | ------ | -------- | ---------------- |
| username | 字符串 | 是       | 登录账号（唯一） |
| password | 字符串 | 是       | 登录密码         |
| realName | 字符串 | 否       | 真实姓名         |
| phone    | 字符串 | 否       | 手机号           |
| address  | 字符串 | 否       | 家庭住址         |

- **请求示例**：
```json
{
  "username": "liuyang",
  "password": "123456",
  "realName": "张二狗",
  "phone": "13388996652",
  "address": "太阳村二队"
}
```

- **响应示例（成功）**：
```json
{
  "code": 200,
  "msg": "注册成功",
  "data": {
    "id": "69c23a6fd8589fba7cb98a23",
    "username": "liuyang",
    "realName": "张二狗",
    "role": "user"
  }
}
```

### 1.2 用户登录
- **接口地址**：`POST /api/auth/login`
- **接口描述**：用户账号密码登录，返回JWT token和用户信息
- **请求参数**：

| 参数名   | 类型   | 是否必填 | 说明     |
| -------- | ------ | -------- | -------- |
| username | 字符串 | 是       | 登录账号 |
| password | 字符串 | 是       | 登录密码 |

- **请求示例**：
```json
{
  "username": "liuyang",
  "password": "123456"
}
```

- **响应示例（成功）**：
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "69c23a6fd8589fba7cb98a23",
      "username": "liuyang",
      "realName": "张二狗",
      "phone": "13388996652",
      "address": "太阳村二队",
      "avatar": null,
      "role": "user"
    }
  }
}
```

---

## 二、文章接口 (Articles)

**注意**：所有文章接口都需要登录认证

### 2.1 获取文章列表
- **接口地址**：`GET /api/articles`
- **接口描述**：分页获取文章列表，支持关键词搜索
- **认证**：需要
- **查询参数**：

| 参数名  | 类型   | 是否必填 | 说明                     |
| ------- | ------ | -------- | ------------------------ |
| page    | 数字   | 否       | 页码，默认1              |
| limit   | 数字   | 否       | 每页条数，默认10，最多50 |
| keyword | 字符串 | 否       | 搜索关键词（标题/内容）  |

- **响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "list": [
      {
        "_id": "67a1b2c3d4e5f67890123456",
        "title": "乡村振兴政策解读",
        "content": "政策内容...",
        "summary": "政策摘要",
        "category": "政策",
        "author": "admin",
        "authorId": "67a1b2c3d4e5f67890123450",
        "createdAt": "2026-03-28T10:30:00.000Z",
        "updatedAt": "2026-03-28T10:30:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

### 2.2 获取单篇文章
- **接口地址**：`GET /api/articles/:id`
- **接口描述**：根据ID获取单篇文章详情
- **认证**：需要
- **路径参数**：

| 参数名 | 类型   | 是否必填 | 说明   |
| ------ | ------ | -------- | ------ |
| id     | 字符串 | 是       | 文章ID |

- **响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "_id": "67a1b2c3d4e5f67890123456",
    "title": "乡村振兴政策解读",
    "content": "详细内容...",
    "summary": "政策摘要",
    "category": "政策",
    "author": "admin",
    "authorId": "67a1b2c3d4e5f67890123450",
    "createdAt": "2026-03-28T10:30:00.000Z",
    "updatedAt": "2026-03-28T10:30:00.000Z"
  }
}
```

### 2.3 新建文章
- **接口地址**：`POST /api/articles`
- **接口描述**：创建新文章
- **认证**：需要
- **请求参数**：

| 参数名   | 类型   | 是否必填 | 说明     |
| -------- | ------ | -------- | -------- |
| title    | 字符串 | 是       | 文章标题 |
| content  | 字符串 | 是       | 文章内容 |
| summary  | 字符串 | 否       | 文章摘要 |
| category | 字符串 | 否       | 文章分类 |

- **请求示例**：
```json
{
  "title": "新政策解读",
  "content": "详细内容...",
  "summary": "摘要内容",
  "category": "政策"
}
```

- **响应示例**：
```json
{
  "code": 200,
  "msg": "文章创建成功",
  "data": {
    "_id": "67a1b2c3d4e5f67890123457",
    "title": "新政策解读",
    "content": "详细内容...",
    "summary": "摘要内容",
    "category": "政策",
    "author": "liuyang",
    "authorId": "69c23a6fd8589fba7cb98a23",
    "createdAt": "2026-03-30T08:50:00.000Z",
    "updatedAt": "2026-03-30T08:50:00.000Z"
  }
}
```

### 2.4 更新文章
- **接口地址**：`PUT /api/articles/:id`
- **接口描述**：更新文章内容（仅作者或管理员可编辑）
- **认证**：需要
- **路径参数**：

| 参数名 | 类型   | 是否必填 | 说明   |
| ------ | ------ | -------- | ------ |
| id     | 字符串 | 是       | 文章ID |

- **请求参数**：同新建文章，字段可选

### 2.5 删除文章
- **接口地址**：`DELETE /api/articles/:id`
- **接口描述**：删除文章（仅作者或管理员可删除）
- **认证**：需要
- **路径参数**：

| 参数名 | 类型   | 是否必填 | 说明   |
| ------ | ------ | -------- | ------ |
| id     | 字符串 | 是       | 文章ID |

---

## 三、建言接口 (Suggestions)

### 3.1 获取建言列表（公开）
- **接口地址**：`GET /api/v1/suggestions`
- **接口描述**：分页获取已审核通过的建言列表，支持搜索、分类和排序
- **查询参数**：

| 参数名   | 类型   | 是否必填 | 说明                             |
| -------- | ------ | -------- | -------------------------------- |
| page     | 数字   | 否       | 页码，默认1                      |
| limit    | 数字   | 否       | 每页条数，默认10，最多50         |
| keyword  | 字符串 | 否       | 搜索关键词（标题/内容）          |
| category | 字符串 | 否       | 分类筛选（如"基础设施"、"环境"） |
| sort     | 字符串 | 否       | 排序方式：latest（最新）或 hot（最热） |

- **响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "list": [
      {
        "_id": "67b2c3d4e5f6789012345678",
        "title": "建议修建村内道路",
        "content": "内容详情...",
        "category": "基础设施",
        "authorId": "69c23a6fd8589fba7cb98a23",
        "authorName": "张二狗",
        "likesCount": 15,
        "favoritesCount": 8,
        "commentCount": 3,
        "isTop": false,
        "status": "approved",
        "createdAt": "2026-03-29T14:20:00.000Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 10
  }
}
```

### 3.2 获取建言详情
- **接口地址**：`GET /api/v1/suggestions/:id`
- **接口描述**：根据ID获取建言详情
- **路径参数**：

| 参数名 | 类型   | 是否必填 | 说明   |
| ------ | ------ | -------- | ------ |
| id     | 字符串 | 是       | 建言ID |

### 3.3 发布建言
- **接口地址**：`POST /api/v1/suggestions`
- **接口描述**：发布新建言（需登录）
- **认证**：需要
- **请求参数**：

| 参数名   | 类型   | 是否必填 | 说明     |
| -------- | ------ | -------- | -------- |
| title    | 字符串 | 是       | 建言标题 |
| content  | 字符串 | 是       | 建言内容 |
| category | 字符串 | 否       | 分类，默认"其他" |

- **响应示例**：
```json
{
  "code": 200,
  "msg": "建言发布成功，等待审核",
  "data": {
    "_id": "67b2c3d4e5f6789012345679",
    "title": "新建言标题",
    "content": "新建言内容",
    "category": "其他",
    "authorId": "69c23a6fd8589fba7cb98a23",
    "authorName": "张二狗",
    "status": "pending",
    "createdAt": "2026-03-30T09:00:00.000Z"
  }
}
```

### 3.4 编辑建言
- **接口地址**：`PUT /api/v1/suggestions/:id`
- **接口描述**：编辑建言（仅作者或管理员）
- **认证**：需要
- **请求参数**：同发布建言，字段可选

### 3.5 删除建言
- **接口地址**：`DELETE /api/v1/suggestions/:id`
- **接口描述**：删除建言（仅作者或管理员）
- **认证**：需要

### 3.6 点赞/取消点赞
- **接口地址**：`POST /api/v1/suggestions/:id/like`
- **接口描述**：点赞或取消点赞建言（需登录）
- **认证**：需要
- **响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "liked": true,
    "likesCount": 16
  }
}
```

### 3.7 收藏/取消收藏
- **接口地址**：`POST /api/v1/suggestions/:id/favorite`
- **接口描述**：收藏或取消收藏建言（需登录）
- **认证**：需要
- **响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "favorited": true,
    "favoritesCount": 9
  }
}
```

### 3.8 获取评论列表
- **接口地址**：`GET /api/v1/suggestions/:id/comments`
- **接口描述**：获取建言的评论列表
- **响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "_id": "67c3d4e5f678901234567890",
      "suggestion": "67b2c3d4e5f6789012345678",
      "authorId": "69c23a6fd8589fba7cb98a24",
      "authorName": "李四",
      "content": "这个建议很好！",
      "createdAt": "2026-03-29T15:30:00.000Z"
    }
  ]
}
```

### 3.9 发表评论
- **接口地址**：`POST /api/v1/suggestions/:id/comments`
- **接口描述**：发表评论（需登录）
- **认证**：需要
- **请求参数**：

| 参数名  | 类型   | 是否必填 | 说明     |
| ------- | ------ | -------- | -------- |
| content | 字符串 | 是       | 评论内容 |

### 3.10 干部回复（管理员）
- **接口地址**：`POST /api/v1/suggestions/:id/reply`
- **接口描述**：管理员回复建言（需管理员权限）
- **认证**：需要（管理员）
- **请求参数**：

| 参数名  | 类型   | 是否必填 | 说明     |
| ------- | ------ | -------- | -------- |
| content | 字符串 | 是       | 回复内容 |

---

## 四、用户接口 (Users)

**注意**：所有用户接口都需要登录认证

### 4.1 获取当前用户信息
- **接口地址**：`GET /api/v1/users/me`
- **接口描述**：获取当前登录用户的详细信息
- **响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "_id": "69c23a6fd8589fba7cb98a23",
    "username": "liuyang",
    "realName": "张二狗",
    "phone": "13388996652",
    "address": "太阳村二队",
    "avatar": null,
    "role": "user",
    "isActive": true,
    "createdAt": "2026-03-28T10:00:00.000Z"
  }
}
```

### 4.2 更新个人信息
- **接口地址**：`PUT /api/v1/users/me`
- **接口描述**：更新当前用户信息
- **请求参数**：

| 参数名   | 类型   | 是否必填 | 说明     |
| -------- | ------ | -------- | -------- |
| realName | 字符串 | 否       | 真实姓名 |
| phone    | 字符串 | 否       | 手机号   |
| address  | 字符串 | 否       | 地址     |
| avatar   | 字符串 | 否       | 头像URL  |

### 4.3 修改密码
- **接口地址**：`POST /api/v1/users/change-password`
- **接口描述**：修改当前用户密码
- **请求参数**：

| 参数名      | 类型   | 是否必填 | 说明     |
| ----------- | ------ | -------- | -------- |
| oldPassword | 字符串 | 是       | 原密码   |
| newPassword | 字符串 | 是       | 新密码   |

### 4.4 获取当前用户发表的建言
- **接口地址**：`GET /api/v1/users/me/suggestions`
- **接口描述**：分页获取当前用户发表的所有建言
- **查询参数**：

| 参数名 | 类型 | 是否必填 | 说明             |
| ------ | ---- | -------- | ---------------- |
| page   | 数字 | 否       | 页码，默认1      |
| limit  | 数字 | 否       | 每页条数，默认10 |

### 4.5 获取当前用户收藏列表
- **接口地址**：`GET /api/v1/users/me/favorites`
- **接口描述**：分页获取当前用户收藏的建言
- **查询参数**：同上

### 4.6 获取当前用户点赞的建言ID列表
- **接口地址**：`GET /api/v1/users/me/liked`
- **接口描述**：获取当前用户点赞过的建言ID列表（用于前端高亮显示）
- **响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": ["67b2c3d4e5f6789012345678", "67b2c3d4e5f6789012345679"]
}
```

### 4.7 获取当前用户收藏的建言ID列表
- **接口地址**：`GET /api/v1/users/me/favorited`
- **接口描述**：获取当前用户收藏的建言ID列表（用于前端高亮显示）

---

## 五、管理员接口 (Admin)

**注意**：所有管理员接口都需要登录认证和管理员权限

### 5.1 平台统计
- **接口地址**：`GET /api/v1/admin/stats`
- **接口描述**：获取平台统计数据
- **响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "userCount": 125,
    "suggestionCount": 342,
    "pendingCount": 15,
    "approvedCount": 327,
    "newUsers": 5,
    "newSuggestions": 12
  }
}
```

### 5.2 获取用户列表
- **接口地址**：`GET /api/v1/admin/users`
- **接口描述**：分页获取所有用户列表，支持关键词搜索
- **查询参数**：

| 参数名   | 类型   | 是否必填 | 说明                     |
| -------- | ------ | -------- | ------------------------ |
| page     | 数字   | 否       | 页码，默认1              |
| limit    | 数字   | 否       | 每页条数，默认10，最多100 |
| keyword  | 字符串 | 否       | 搜索关键词（用户名/姓名/手机） |

### 5.3 禁用用户
- **接口地址**：`PUT /api/v1/admin/users/:id/disable`
- **接口描述**：禁用指定用户账号

### 5.4 启用用户
- **接口地址**：`PUT /api/v1/admin/users/:id/enable`
- **接口描述**：启用已禁用的用户账号

### 5.5 重置用户密码
- **接口地址**：`PUT /api/v1/admin/users/:id/reset-password`
- **接口描述**：重置用户密码为随机密码
- **响应示例**：
```json
{
  "code": 200,
  "msg": "密码已重置",
  "data": {
    "tempPassword": "a1b2c3d4"
  }
}
```

### 5.6 获取所有建言（含审核状态）
- **接口地址**：`GET /api/v1/admin/suggestions`
- **接口描述**：分页获取所有建言，支持状态和分类筛选
- **查询参数**：

| 参数名   | 类型   | 是否必填 | 说明                     |
| -------- | ------ | -------- | ------------------------ |
| page     | 数字   | 否       | 页码，默认1              |
| limit    | 数字   | 否       | 每页条数，默认10，最多100 |
| keyword  | 字符串 | 否       | 搜索关键词               |
| status   | 字符串 | 否       | 状态筛选：pending/approved/rejected |
| category | 字符串 | 否       | 分类筛选                 |

### 5.7 审核建言状态
- **接口地址**：`PUT /api/v1/admin/suggestions/:id/status`
- **接口描述**：更新建言审核状态
- **请求参数**：

| 参数名 | 类型   | 是否必填 | 说明                     |
| ------ | ------ | -------- | ------------------------ |
| status | 字符串 | 是       | 状态：pending/approved/rejected |

### 5.8 置顶/取消置顶建言
- **接口地址**：`PUT /api/v1/admin/suggestions/:id/top`
- **接口描述**：切换建言的置顶状态
- **响应示例**：
```json
{
  "code": 200,
  "msg": "已置顶",
  "data": {
    "isTop": true
  }
}
```

### 5.9 删除建言（管理员）
- **接口地址**：`DELETE /api/v1/admin/suggestions/:id`
- **接口描述**：管理员删除建言（同时删除相关评论和收藏）

---

## 六、健康检查接口

### 6.1 健康检查
- **接口地址**：`GET /api/health`
- **接口描述**：检查服务器运行状态
- **响应示例**：
```json
{
  "status": "ok",
  "time": "2026-03-30T09:15:00.000Z"
}
```

---

## 前端代理配置

前端项目通过Vite代理转发API请求：

### 用户前端 (frontend)
- 开发服务器端口：5173
- 代理配置：所有`/api`请求转发到`http://localhost:3000`
- 访问地址：`http://localhost:5173`

### 管理前端 (admin_frontend)
- 开发服务器端口：5174
- 代理配置：所有`/api`请求转发到`http://localhost:3000`
- 访问地址：`http://localhost:5174`

### 后端服务器
- 运行端口：3000
- 启动命令：`npm start` 或 `node app.js`

---

## 数据库模型说明

### 用户表 (User)
- `username`: 用户名（唯一）
- `password`: 密码（加密存储）
- `realName`: 真实姓名
- `phone`: 手机号
- `address`: 地址
- `avatar`: 头像URL
- `role`: 角色（user/admin）
- `isActive`: 账号状态（true/false）

### 文章表 (Article)
- `title`: 标题
- `content`: 内容
- `summary`: 摘要
- `category`: 分类
- `author`: 作者用户名
- `authorId`: 作者ID

### 建言表 (Suggestion)
- `title`: 标题
- `content`: 内容
- `category`: 分类
- `authorId`: 作者ID
- `authorName`: 作者姓名
- `likesCount`: 点赞数
- `favoritesCount`: 收藏数
- `likedBy`: 点赞用户ID数组
- `isTop`: 是否置顶
- `status`: 状态（pending/approved/rejected）
- `officialReply`: 干部回复内容

### 评论表 (Comment)
- `suggestion`: 建言ID
- `authorId`: 评论者ID
- `authorName`: 评论者姓名
- `content`: 评论内容

### 收藏表 (Favorite)
- `user`: 用户ID
- `suggestion`: 建言ID
