require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const authRoutes = require('./routes/auth')
const articleRoutes = require('./routes/articles')
const suggestionRoutes = require('./routes/suggestions')
const usersRoutes = require('./routes/users')
const adminRoutes = require('./routes/admin')
const { notFound, serverError } = require('./utils/response')

const app = express()
const PORT = process.env.PORT || 3000

// 连接数据库
connectDB()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/v1/suggestions', suggestionRoutes)
app.use('/api/v1/users', usersRoutes)
app.use('/api/v1/admin', adminRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 404 处理
app.use((req, res) => {
  notFound(res, `接口 ${req.method} ${req.path} 不存在`)
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  serverError(res, err.message || '服务器内部错误')
})

app.listen(PORT, () => {
  console.log(`服务器启动成功，监听端口 ${PORT}`)
  console.log(`API 地址：http://localhost:${PORT}/api`)
})
