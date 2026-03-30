const express = require('express')
const User = require('../models/User')
const Suggestion = require('../models/Suggestion')
const Comment = require('../models/Comment')
const Favorite = require('../models/Favorite')
const authMiddleware = require('../middleware/auth')
const adminMiddleware = require('../middleware/admin')
const {
  success, badRequest, notFound, serverError
} = require('../utils/response')

const router = express.Router()

// 所有管理员路由均需要登录 + 管理员权限
router.use(authMiddleware, adminMiddleware)

/**
 * @swagger
 * /api/v1/admin/stats:
 *   get:
 *     summary: 获取平台统计
 *     description: 获取平台统计数据，包括用户数、建言数、待审核数等，需要管理员权限
 *     tags:
 *       - 管理员接口
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取统计成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 成功
 *                 data:
 *                   userCount: 125
 *                   suggestionCount: 89
 *                   pendingCount: 12
 *                   approvedCount: 77
 *                   newUsers: 5
 *                   newSuggestions: 8
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权限，需要管理员角色
 *       500:
 *         description: 服务器内部错误
 */
// GET /api/v1/admin/stats — 平台统计
router.get('/stats', async (req, res) => {
  try {
    const [userCount, suggestionCount, pendingCount, approvedCount] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Suggestion.countDocuments(),
      Suggestion.countDocuments({ status: 'pending' }),
      Suggestion.countDocuments({ status: 'approved' })
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [newUsers, newSuggestions] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: today } }),
      Suggestion.countDocuments({ createdAt: { $gte: today } })
    ])

    return success(res, {
      userCount,
      suggestionCount,
      pendingCount,
      approvedCount,
      newUsers,
      newSuggestions
    })
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: 获取用户列表
 *     description: 获取用户列表，支持分页和关键词搜索，需要管理员权限
 *     tags:
 *       - 管理员接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/keywordParam'
 *     responses:
 *       200:
 *         description: 获取用户列表成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *               example:
 *                 code: 200
 *                 message: 成功
 *                 data:
 *                   list:
 *                     - id: "69c23a6fd8589fba7cb98a20"
 *                       username: "liuyang"
 *                       realName: "张二狗"
 *                       phone: "13800138000"
 *                       address: "XX省XX市XX村XX组"
 *                       avatar: null
 *                       role: "user"
 *                       isActive: true
 *                       createdAt: "2024-01-10T08:30:00.000Z"
 *                       updatedAt: "2024-01-15T08:30:00.000Z"
 *                   total: 125
 *                   page: 1
 *                   limit: 10
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权限，需要管理员角色
 *       500:
 *         description: 服务器内部错误
 */
// GET /api/v1/admin/users — 获取用户列表
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const keyword = req.query.keyword?.trim() || ''

    const query = { role: 'user' }
    if (keyword) {
      const regex = new RegExp(keyword, 'i')
      query.$or = [{ username: regex }, { realName: regex }, { phone: regex }]
    }

    const total = await User.countDocuments(query)
    const list = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password -__v')
      .lean()

    return success(res, { list, total, page, limit })
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/admin/users/{id}/disable:
 *   put:
 *     summary: 禁用用户
 *     description: 禁用用户账号，需要管理员权限
 *     tags:
 *       - 管理员接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 用户ID
 *         required: true
 *         schema:
 *           type: string
 *           example: "69c23a6fd8589fba7cb98a20"
 *     responses:
 *       200:
 *         description: 用户已禁用
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 用户已禁用
 *                 data:
 *                   id: "69c23a6fd8589fba7cb98a20"
 *                   username: "liuyang"
 *                   realName: "张二狗"
 *                   phone: "13800138000"
 *                   address: "XX省XX市XX村XX组"
 *                   avatar: null
 *                   role: "user"
 *                   isActive: false
 *                   createdAt: "2024-01-10T08:30:00.000Z"
 *                   updatedAt: "2024-01-16T10:45:00.000Z"
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权限，需要管理员角色
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
// PUT /api/v1/admin/users/:id/disable — 禁用用户
router.put('/users/:id/disable', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password -__v')
    if (!user) return notFound(res, '用户不存在')
    return success(res, user, '用户已禁用')
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/admin/users/{id}/enable:
 *   put:
 *     summary: 启用用户
 *     description: 启用被禁用的用户账号，需要管理员权限
 *     tags:
 *       - 管理员接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 用户ID
 *         required: true
 *         schema:
 *           type: string
 *           example: "69c23a6fd8589fba7cb98a20"
 *     responses:
 *       200:
 *         description: 用户已启用
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 用户已启用
 *                 data:
 *                   id: "69c23a6fd8589fba7cb98a20"
 *                   username: "liuyang"
 *                   realName: "张二狗"
 *                   phone: "13800138000"
 *                   address: "XX省XX市XX村XX组"
 *                   avatar: null
 *                   role: "user"
 *                   isActive: true
 *                   createdAt: "2024-01-10T08:30:00.000Z"
 *                   updatedAt: "2024-01-16T10:45:00.000Z"
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权限，需要管理员角色
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
// PUT /api/v1/admin/users/:id/enable — 启用用户
router.put('/users/:id/enable', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }).select('-password -__v')
    if (!user) return notFound(res, '用户不存在')
    return success(res, user, '用户已启用')
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/admin/users/{id}/reset-password:
 *   put:
 *     summary: 重置用户密码
 *     description: 重置用户密码为随机密码，需要管理员权限
 *     tags:
 *       - 管理员接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 用户ID
 *         required: true
 *         schema:
 *           type: string
 *           example: "69c23a6fd8589fba7cb98a20"
 *     responses:
 *       200:
 *         description: 密码已重置
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 密码已重置
 *                 data:
 *                   tempPassword: "a1b2c3d4"
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权限，需要管理员角色
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
// PUT /api/v1/admin/users/:id/reset-password — 重置密码
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+password')
    if (!user) return notFound(res, '用户不存在')

    const tempPassword = Math.random().toString(36).slice(-8)
    user.password = tempPassword
    await user.save()
    return success(res, { tempPassword }, '密码已重置')
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/admin/suggestions:
 *   get:
 *     summary: 获取所有建言
 *     description: 获取所有建言列表，包含审核状态，支持分页、搜索、状态和分类筛选，需要管理员权限
 *     tags:
 *       - 管理员接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/keywordParam'
 *       - name: status
 *         in: query
 *         description: 审核状态筛选 (pending-待审核, approved-已通过, rejected-已拒绝)
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           example: "pending"
 *       - name: category
 *         in: query
 *         description: 分类筛选
 *         required: false
 *         schema:
 *           type: string
 *           example: "环境"
 *     responses:
 *       200:
 *         description: 获取建言列表成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *               example:
 *                 code: 200
 *                 message: 成功
 *                 data:
 *                   list:
 *                     - id: "69c23a6fd8589fba7cb98a23"
 *                       title: "关于改善村容村貌的建议"
 *                       content: "具体建议内容..."
 *                       category: "环境"
 *                       authorName: "张三"
 *                       authorId: "69c23a6fd8589fba7cb98a20"
 *                       likesCount: 15
 *                       favoritesCount: 8
 *                       commentCount: 5
 *                       status: "pending"
 *                       isTop: false
 *                       createdAt: "2024-01-15T08:30:00.000Z"
 *                       updatedAt: "2024-01-15T08:30:00.000Z"
 *                   total: 89
 *                   page: 1
 *                   limit: 10
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权限，需要管理员角色
 *       500:
 *         description: 服务器内部错误
 */
// GET /api/v1/admin/suggestions — 获取所有建言（含审核状态）
router.get('/suggestions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const keyword = req.query.keyword?.trim() || ''
    const status = req.query.status || ''
    const category = req.query.category || ''

    const query = {}
    if (keyword) {
      const regex = new RegExp(keyword, 'i')
      query.$or = [{ title: regex }, { content: regex }]
    }
    if (status) query.status = status
    if (category && category !== 'all') query.category = category

    const total = await Suggestion.countDocuments(query)
    const list = await Suggestion.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-likedBy -__v')
      .lean()

    return success(res, { list, total, page, limit })
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/admin/suggestions/{id}/status:
 *   put:
 *     summary: 审核建言
 *     description: 审核建言状态（待审核、已通过、已拒绝），需要管理员权限
 *     tags:
 *       - 管理员接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 建言ID
 *         required: true
 *         schema:
 *           type: string
 *           example: "69c23a6fd8589fba7cb98a23"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: 审核状态
 *                 enum: [pending, approved, rejected]
 *                 example: "approved"
 *     responses:
 *       200:
 *         description: 审核状态已更新
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 审核状态已更新
 *                 data:
 *                   id: "69c23a6fd8589fba7cb98a23"
 *                   title: "关于改善村容村貌的建议"
 *                   content: "具体建议内容..."
 *                   category: "环境"
 *                   authorName: "张三"
 *                   authorId: "69c23a6fd8589fba7cb98a20"
 *                   likesCount: 15
 *                   favoritesCount: 8
 *                   commentCount: 5
 *                   status: "approved"
 *                   isTop: false
 *                   createdAt: "2024-01-15T08:30:00.000Z"
 *                   updatedAt: "2024-01-16T10:45:00.000Z"
 *       400:
 *         description: 请求参数错误，状态值无效
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权限，需要管理员角色
 *       404:
 *         description: 建言不存在
 *       500:
 *         description: 服务器内部错误
 */
// PUT /api/v1/admin/suggestions/:id/status — 审核建言
router.put('/suggestions/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return badRequest(res, '状态值无效')
    }

    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-likedBy -__v')

    if (!suggestion) return notFound(res, '建言不存在')
    return success(res, suggestion, '审核状态已更新')
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/admin/suggestions/{id}/top:
 *   put:
 *     summary: 置顶/取消置顶建言
 *     description: 置顶或取消置顶建言，需要管理员权限
 *     tags:
 *       - 管理员接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 建言ID
 *         required: true
 *         schema:
 *           type: string
 *           example: "69c23a6fd8589fba7cb98a23"
 *     responses:
 *       200:
 *         description: 操作成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 已置顶
 *                 data:
 *                   isTop: true
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权限，需要管理员角色
 *       404:
 *         description: 建言不存在
 *       500:
 *         description: 服务器内部错误
 */
// PUT /api/v1/admin/suggestions/:id/top — 置顶/取消置顶
router.put('/suggestions/:id/top', async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id)
    if (!suggestion) return notFound(res, '建言不存在')
    suggestion.isTop = !suggestion.isTop
    await suggestion.save()
    return success(res, { isTop: suggestion.isTop }, suggestion.isTop ? '已置顶' : '已取消置顶')
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/admin/suggestions/{id}:
 *   delete:
 *     summary: 删除建言（管理员）
 *     description: 删除建言及相关评论和收藏，需要管理员权限
 *     tags:
 *       - 管理员接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 建言ID
 *         required: true
 *         schema:
 *           type: string
 *           example: "69c23a6fd8589fba7cb98a23"
 *     responses:
 *       200:
 *         description: 建言已删除
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 建言已删除
 *                 data: null
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权限，需要管理员角色
 *       404:
 *         description: 建言不存在
 *       500:
 *         description: 服务器内部错误
 */
// DELETE /api/v1/admin/suggestions/:id — 删除建言
router.delete('/suggestions/:id', async (req, res) => {
  try {
    const suggestion = await Suggestion.findByIdAndDelete(req.params.id)
    if (!suggestion) return notFound(res, '建言不存在')
    await Comment.deleteMany({ suggestion: suggestion._id })
    await Favorite.deleteMany({ suggestion: suggestion._id })
    return success(res, null, '建言已删除')
  } catch (err) {
    return serverError(res, err.message)
  }
})

module.exports = router
