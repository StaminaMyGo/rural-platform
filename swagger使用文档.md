# Swagger API 文档配置指南

## 什么是 Swagger？

Swagger 是一个 API 文档生成工具，它可以根据代码中的注释自动生成可视化的 API 文档。有了 Swagger：

- **自动生成文档**：无需手动编写接口文档
- **可视化测试**：可以直接在网页上测试接口
- **保持同步**：代码更新时文档自动更新
- **标准化**：统一 API 的格式和规范

## 1. 新增的依赖包

首先，项目中添加了两个新的 npm 包（在 `package.json` 中）：

```json
"swagger-jsdoc": "^6.2.8",      // 解析代码中的 @swagger 注释
"swagger-ui-express": "^5.0.1"  // 提供网页界面展示文档
```

这两个包需要先安装才能使用：

| 包名 | 作用 |
|------|------|
| `swagger-jsdoc` | 扫描代码文件，提取 `@swagger` 注释 |
| `swagger-ui-express` | 在 Express 应用中提供 Swagger UI 网页 |

## 2. Swagger 配置文件 (`config/swagger.js`)

这个文件定义了 API 文档的基本信息和结构：

### 基础信息

```javascript
definition: {
  openapi: '3.0.0',  // 使用 OpenAPI 3.0 标准
  info: {
    title: '乡村公共平台 API 文档',
    version: '1.0.0',
    description: '乡村公共平台后端API接口文档...'
  }
}
```

### 服务器地址

```javascript
servers: [
  {
    url: 'http://localhost:3000',      // 开发环境
    description: '开发环境'
  },
  {
    url: 'https://api.example.com',    // 生产环境
    description: '生产环境'
  }
]
```

### 认证方式

```javascript
securitySchemes: {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',  // 使用 Bearer Token (JWT)
    bearerFormat: 'JWT'
  }
},
security: [{
  bearerAuth: []  // 默认所有接口需要认证
}]
```

### 数据模型定义

定义了三种通用的响应格式：

1. **ApiResponse**：普通接口响应
2. **PaginatedResponse**：分页列表响应
3. **ErrorResponse**：错误响应

### 通用参数定义

```javascript
parameters: {
  pageParam: { name: 'page', in: 'query' },    // 页码参数
  limitParam: { name: 'limit', in: 'query' },  // 每页条数
  keywordParam: { name: 'keyword', in: 'query' } // 搜索关键词
}
```

### 接口分类

```javascript
tags: [
  { name: '认证接口', description: '用户注册、登录等认证相关接口' },
  { name: '文章接口', description: '文章管理相关接口' },
  // ... 其他分类
]
```

### 扫描路由文件

```javascript
apis: [
  './routes/*.js',      // 扫描 routes 目录所有 .js 文件
  './routes/**/*.js'    // 扫描 routes 的子目录
]
```

## 3. 主应用配置 (`app.js`)

### 引入 Swagger

```javascript
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./config/swagger')
```

### 配置文档路由

```javascript
// Swagger API文档 - 访问地址：http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,  // 启用搜索框
  customSiteTitle: '乡村公共平台 API 文档',
  customCss: '.swagger-ui .topbar { display: none }', // 自定义样式
  swaggerOptions: {
    persistAuthorization: true,  // 保持认证token
    displayRequestDuration: true // 显示请求耗时
  }
}))
```

### 提供 JSON 格式文档

```javascript
// 访问地址：http://localhost:3000/api-docs.json
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})
```

## 4. 路由文件中的 `@swagger` 注解

以 `auth.js` 中的注册接口为例：

```javascript
/**
 * @swagger
 * /api/auth/register:           // API路径
 *   post:                      // HTTP方法
 *     summary: 用户注册         // 接口摘要
 *     description: 新用户注册... // 详细描述
 *     tags:                    // 所属分类
 *       - 认证接口
 *     security: []             // 不需要认证（空数组）
 *     requestBody:             // 请求参数
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:        // 必填字段
 *               - username
 *               - password
 *             properties:      // 字段详情
 *               username:
 *                 type: string
 *                 description: 登录账号
 *                 example: "liuyang"
 *     responses:              // 响应示例
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse' // 引用通用格式
 *               example:
 *                 code: 201
 *                 message: 注册成功
 *                 data: { ... }
 */
```

### 关键注解说明

| 注解 | 说明 |
|------|------|
| `@swagger` | 标记开始一个接口定义 |
| 路径和方法 | `/api/auth/register:` 和 `post:` |
| `summary` 和 `description` | 接口简要和详细说明 |
| `tags` | 分类标签，对应配置中的 `tags` |
| `security` | 认证要求，`[]` 表示不需要，`bearerAuth: []` 表示需要 |
| `requestBody` | 请求体参数定义 |
| `responses` | 各种状态码的响应格式 |
| `$ref` | 引用配置文件中定义的数据模型（如 `ApiResponse`） |

## 5. 其他路由文件的配置

所有路由文件（`auth.js`、`articles.js`、`suggestions.js`、`users.js`、`admin.js`）都添加了类似的 `@swagger` 注释，每个接口都详细描述了：

- 接口用途和功能
- 需要的参数
- 可能的响应状态
- 响应数据格式

## 6. 访问和使用

配置完成后，你可以：

1. **查看文档**：启动服务后访问 `http://localhost:3000/api-docs`
2. **测试接口**：在文档页面上直接点击 "Try it out" 测试接口
3. **获取JSON**：访问 `http://localhost:3000/api-docs.json` 获取原始 OpenAPI 规范

## 总结

引入 Swagger 的主要配置步骤：

| 步骤 | 文件 | 作用 |
|------|------|------|
| 1. 安装依赖 | `package.json` | 添加 `swagger-jsdoc` 和 `swagger-ui-express` |
| 2. 创建配置 | `config/swagger.js` | 定义文档结构、认证、数据模型等 |
| 3. 主应用配置 | `app.js` | 添加文档路由和中间件 |
| 4. 添加注释 | `routes/*.js` | 在每个接口上方添加 `@swagger` 注释 |
| 5. 访问文档 | `http://localhost:3000/api-docs` | 查看和测试 API |

这种配置方式的优点是：

- **代码即文档**：文档与代码在一起，同步更新
- **降低维护成本**：无需单独维护文档
- **便于测试**：前端开发可以直接在文档中测试
- **规范化**：统一接口格式和响应结构

对于零基础的你来说，只需要记住：在写接口代码时，按照示例格式在函数上方添加 `@swagger` 注释，Swagger 就会自动生成对应的文档页面。