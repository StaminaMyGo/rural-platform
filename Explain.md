# 乡村公共服务平台技术说明文档

## 项目概述
这是一个基于Vue.js + Node.js + MongoDB的乡村公共服务平台，包含客户端、管理员端和后端三个子系统。项目采用前后端分离架构，实现了完整的用户认证、权限管理、数据统计等功能。

## 技术栈详解

### 1. 前端技术 (Vue.js 3)

#### 核心语法
```javascript
// Vue 3 Composition API
import { ref, computed, onMounted } from 'vue'

// 响应式数据声明
const userInfo = ref(null)
const suggestions = ref([])

// 计算属性
const totalSuggestions = computed(() => suggestions.value.length)

// 生命周期钩子
onMounted(async () => {
  await loadData()
})
```

#### 模块化结构
```
src/
├── api/           # API请求封装
├── components/    # 可复用组件
├── router/        # 路由配置
├── stores/        # Pinia状态管理
└── views/         # 页面组件
```

### 2. 后端技术 (Node.js + Express)

#### 路由定义
```javascript
// routes/suggestion.js
router.get('/', suggestionController.getSuggestions)
router.post('/', authMiddleware, suggestionController.createSuggestion)
router.put('/:id', authMiddleware, suggestionController.updateSuggestion)
```

#### 中间件机制
```javascript
// JWT认证中间件
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: '未授权' })
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: '无效的token' })
  }
}
```

### 3. 数据库 (MongoDB + Mongoose)

#### 数据模型定义
```javascript
// models/User.js
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })
```

#### 关联查询
```javascript
Suggestion.find()
  .populate('author', 'username email') // 关联用户信息
  .sort({ createdAt: -1 }) // 按创建时间倒序
  .skip((page - 1) * limit) // 分页
  .limit(limit)
```

## 项目模块关联

### 1. 认证流程
1. 用户登录 → 后端验证密码 → 生成JWT Token → 前端存储Token
2. 后续请求携带Token → 中间件验证Token → 路由处理业务逻辑

### 2. 数据流
```
前端页面 → Vue组件 → Pinia Store → API层 → Axios请求
          ↓
      后端路由 → 控制器 → 模型操作 → 数据库
          ↓
      响应数据 → JSON格式 → 前端解析 → 界面更新
```

### 3. 权限控制体系
- **角色判断**: 基于JWT中的role字段
- **接口保护**: 中间件拦截未授权请求
- **前端路由守卫**: 根据角色动态加载路由

## 关键技术点

### 1. JWT认证机制
- Token组成: Header.Payload.Signature
- 有效期管理: refresh token机制
- 安全存储: HttpOnly cookie或localStorage

### 2. 文件上传处理
```javascript
// 使用multer处理文件上传
const upload = multer({ dest: 'uploads/' })
router.post('/upload', upload.single('file'), uploadController.handleUpload)
```

### 3. 错误处理
```javascript
// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器错误',
    data: null
  })
})
```

## 最佳实践

### 1. 代码组织
- 单一职责原则: 每个文件/函数只做一件事
- 模块化: 按功能拆分模块，降低耦合度
- 配置分离: 敏感信息存储在环境变量中

### 2. 性能优化
- 数据库索引: 为常用查询字段创建索引
- 缓存策略: Redis缓存热点数据
- 分页加载: 避免一次性加载大量数据

### 3. 安全性
- 密码加密: bcryptjs散列存储
- SQL注入防护: Mongoose内置防护
- XSS防护: 输入输出过滤
- CSRF防护: Token验证机制

## 部署指南

### 1. 环境要求
- Node.js 16+
- MongoDB 4.4+
- Nginx (生产环境)

### 2. 部署步骤
```bash
# 安装依赖
npm install

# 环境配置
cp .env.example .env

# 数据库初始化
npm run db:seed

# 启动服务
npm run build  # 前端构建
npm start      # 后端启动
```

## 常见问题

### 1. 跨域问题
配置CORS中间件:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))
```

### 2. 数据库连接
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('数据库连接成功'))
```

## 扩展建议
1. 添加WebSocket实现实时通知
2. 集成第三方登录(微信、支付宝)
3. 添加数据分析看板
4. 实现微服务架构拆分