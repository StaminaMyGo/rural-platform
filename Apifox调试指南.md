# Apifox 前端接口调试指南

## 一、Apifox 简介

Apifox 是一款集 API 文档、调试、Mock、测试于一体的协作平台，可以替代 Postman、Swagger、Mock.js 等工具。通过 Apifox，您可以：
- 管理和调试所有 API 接口
- 自动生成 API 文档
- 模拟接口数据（Mock）
- 自动化测试
- 团队协作共享

官方网站：https://www.apifox.cn/

## 二、环境准备

### 1. 安装 Apifox
- 下载地址：https://www.apifox.cn/download/
- 支持 Windows、macOS、Linux 系统
- 也可使用 Web 版本：https://www.apifox.cn/web

### 2. 启动项目服务
在调试接口前，请确保以下服务已启动：

```bash
# 1. 启动后端服务器（端口 3000）
cd backend
npm install  # 如果未安装依赖
npm start    # 或 node app.js

# 2. 启动用户前端（端口 5173，可选）
cd frontend
npm install  # 如果未安装依赖
npm run dev

# 3. 启动管理前端（端口 5174，可选）
cd admin_frontend
npm install  # 如果未安装依赖
npm run dev
```

**注意**：Apifox 调试只需要后端服务运行即可。

## 三、创建 Apifox 项目

1. 打开 Apifox，点击"新建项目"
2. 输入项目名称：`乡村公共平台`
3. 选择项目类型：`HTTP`
4. 点击"创建"

## 四、导入 API 文档

您可以通过以下方式导入 API 文档：

### 方法一：手动创建（推荐）
1. 在 Apifox 中创建对应目录结构：
   ```
   乡村公共平台/
   ├── 认证接口 (Auth)
   ├── 文章接口 (Articles)
   ├── 建言接口 (Suggestions)
   ├── 用户接口 (Users)
   └── 管理员接口 (Admin)
   ```

2. 参考根目录下的 [API接口文档.md](API接口文档.md)，在对应目录中创建接口

### 方法二：导入 OpenAPI 文件（如果有）
1. 如果后端有 Swagger/OpenAPI 文档，可导出 JSON 文件
2. 在 Apifox 中点击"导入" → "OpenAPI/Swagger"
3. 选择文件导入

### 方法三：从代码生成（高级）
1. 安装 Apifox CLI：`npm install -g @apifox/cli`
2. 从代码注释生成 OpenAPI 规范
3. 导入到 Apifox

## 五、配置环境变量

环境变量可以方便地在不同环境间切换（开发、测试、生产）。

### 1. 创建环境
1. 点击左侧"环境"选项卡
2. 点击"新建环境"
3. 输入环境名称：`开发环境`

### 2. 配置变量
在"开发环境"中添加以下变量：

| 变量名 | 初始值 | 描述 |
|--------|--------|------|
| `baseUrl` | `http://localhost:3000` | 后端服务器地址 |
| `token` | `空` | 登录后的 JWT token（调试时会自动更新） |

### 3. 在接口中使用变量
在接口 URL 中使用变量：`{{baseUrl}}/api/auth/login`

## 六、调试接口步骤

### 步骤1：测试认证接口
1. 打开"认证接口" → "用户注册"
2. 设置请求方法：`POST`
3. 设置 URL：`{{baseUrl}}/api/auth/register`
4. 在"Body"选项卡中选择 `raw` → `JSON`
5. 输入测试数据：
```json
{
  "username": "testuser",
  "password": "123456",
  "realName": "测试用户",
  "phone": "13800138000",
  "address": "测试村"
}
```
6. 点击"发送"，查看响应结果

### 步骤2：测试登录接口
1. 打开"用户登录"接口
2. URL：`{{baseUrl}}/api/auth/login`
3. 请求数据：
```json
{
  "username": "testuser",
  "password": "123456"
}
```
4. 点击"发送"
5. **重要**：登录成功后，提取 token 保存到环境变量：
   - 在"后置操作"中添加"提取变量"
   - 设置变量名：`token`
   - 使用 JSONPath 表达式：`$.data.token`

### 步骤3：测试需要认证的接口
1. 在接口的"Auth"选项卡中选择 `Bearer Token`
2. Token 值填写：`{{token}}`
3. 现在可以测试需要登录的接口，如"获取文章列表"

## 七、接口调试示例

### 示例1：完整的建言发布流程
```bash
# 1. 用户注册
POST {{baseUrl}}/api/auth/register
# 2. 用户登录（保存token）
POST {{baseUrl}}/api/auth/login
# 3. 发布建言（使用token）
POST {{baseUrl}}/api/v1/suggestions
# 4. 获取建言列表
GET {{baseUrl}}/api/v1/suggestions
# 5. 点赞建言
POST {{baseUrl}}/api/v1/suggestions/{id}/like
```

### 示例2：管理员操作流程
```bash
# 1. 管理员登录（使用admin账号）
POST {{baseUrl}}/api/auth/login
# 2. 获取平台统计
GET {{baseUrl}}/api/v1/admin/stats
# 3. 获取待审核建言
GET {{baseUrl}}/api/v1/admin/suggestions?status=pending
# 4. 审核建言
PUT {{baseUrl}}/api/v1/admin/suggestions/{id}/status
# 5. 回复建言
POST {{baseUrl}}/api/v1/suggestions/{id}/reply
```

## 八、使用测试集合

测试集合可以批量运行接口，模拟完整业务流程。

### 创建测试集合
1. 点击"测试用例"选项卡
2. 点击"新建测试用例"
3. 添加测试步骤：
   - 注册用户
   - 用户登录
   - 发布建言
   - 获取建言列表
   - 点赞建言
4. 设置步骤间的变量传递
5. 点击"运行"执行整个流程

### 自动化测试
1. 在测试用例中添加断言
2. 设置预期响应状态码、响应体
3. 定时运行测试监控接口健康

## 九、Mock 数据功能

当后端接口未完成时，可以使用 Mock 功能生成模拟数据。

### 创建 Mock 服务
1. 在接口编辑页面点击"高级设置"
2. 开启"Mock"
3. 配置 Mock 规则：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "list|5-10": [{
      "_id": "@id",
      "title": "@ctitle(10,20)",
      "content": "@cparagraph",
      "authorName": "@cname",
      "createdAt": "@datetime"
    }],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

### 使用 Mock URL
1. Apifox 会为每个接口生成 Mock URL
2. 前端开发时可以先使用 Mock URL
3. 后端接口完成后切换到真实 URL

## 十、前端项目集成

### 1. 代理配置说明
前端项目已配置 Vite 代理，开发时所有 `/api` 请求会转发到后端：

**用户前端 (frontend/vite.config.js):**
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  }
}
```

**管理前端 (admin_frontend/vite.config.js):**
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  }
}
```

### 2. 前端 API 调用示例
```javascript
// 用户前端调用示例 (frontend/src/api/suggestions.js)
import service from './request'

// 获取建言列表
export function getSuggestions(params) {
  return service.get('/v1/suggestions', { params })
}

// 发布建言
export function createSuggestion(data) {
  return service.post('/v1/suggestions', data)
}
```

### 3. 与 Apifox 配合调试
1. 启动后端服务：`npm start` (backend目录)
2. 在 Apifox 中调试接口，确保接口正常工作
3. 启动前端项目：`npm run dev`
4. 前端会自动使用代理访问后端接口

## 十一、常见问题与解决方案

### 问题1：跨域错误
**表现**：前端请求出现 CORS 错误
**解决方案**：
- 后端已配置 CORS 中间件，确保后端服务正常运行
- 检查前端代理配置是否正确
- 确保请求地址正确

### 问题2：401 未授权
**表现**：接口返回 401 状态码
**解决方案**：
- 检查 token 是否有效
- 在 Apifox 中重新登录获取新 token
- 检查接口是否需要认证，在 Auth 中配置 Bearer Token

### 问题3：404 接口不存在
**表现**：接口返回 404 状态码
**解决方案**：
- 检查 URL 是否正确，特别是路径前缀
- 确认后端路由是否正确定义
- 检查请求方法（GET/POST/PUT/DELETE）是否正确

### 问题4：500 服务器错误
**表现**：接口返回 500 状态码
**解决方案**：
- 查看后端控制台错误日志
- 检查数据库连接是否正常
- 确认请求参数格式是否正确

### 问题5：代理不生效
**表现**：前端请求未转发到后端
**解决方案**：
- 确认 Vite 服务器已启动
- 检查 vite.config.js 中的代理配置
- 重启前端开发服务器

## 十二、调试技巧与最佳实践

### 1. 使用环境变量
- 为不同环境（开发、测试、生产）配置不同的 baseUrl
- 使用变量管理 token，避免每次手动输入

### 2. 保存常用请求
- 将常用的测试数据保存为"例子"
- 创建"快捷请求"快速测试接口

### 3. 文档与代码同步
- 在 Apifox 中维护最新的接口文档
- 前后端开发都参考同一份文档
- 接口变更时及时更新文档

### 4. 团队协作
- 使用团队项目共享接口文档
- 添加接口说明和注意事项
- 使用评论功能讨论接口设计

### 5. 自动化测试
- 为关键接口创建自动化测试
- 设置定时运行监控接口健康
- 集成到 CI/CD 流程中

## 十三、相关资源

1. **项目文档**：
   - [API接口文档.md](API接口文档.md) - 完整的 API 接口说明
   - [README.md](README.md) - 项目说明

2. **Apifox 学习资源**：
   - 官方文档：https://www.apifox.cn/help/
   - 视频教程：https://www.apifox.cn/help/app/videos/
   - 社区论坛：https://community.apifox.cn/

3. **项目目录说明**：
   - `backend/` - 后端 Node.js 服务
   - `frontend/` - 用户前端 Vue.js 项目
   - `admin_frontend/` - 管理后台 Vue.js 项目
   - `refs/` - 参考资料和文档

## 十四、总结

通过 Apifox 进行接口调试可以大大提高开发效率：
1. **前后端分离**：前端可以使用 Mock 数据并行开发
2. **接口文档**：统一维护最新的接口文档
3. **自动化测试**：确保接口稳定性和兼容性
4. **团队协作**：减少沟通成本，提高协作效率

建议将 Apifox 作为日常开发的标准工具，建立规范的接口调试流程。

---

**最后更新**：2026-03-30
**维护者**：乡村公共平台开发团队
**如有问题**：请参考文档或联系开发人员