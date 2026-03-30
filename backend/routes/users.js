const express = require('express')
const User = require('../models/User')
const Suggestion = require('../models/Suggestion')
const Favorite = require('../models/Favorite')
const authMiddleware = require('../middleware/auth')
const { success, badRequest, notFound, serverError } = require('../utils/response')

const router = express.Router()

// 所有用户路由均需要登录
router.use(authMiddleware)

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: 获取当前用户信息
 *     description: 获取当前登录用户的个人信息，需要登录认证
 *     tags:
 *       - 用户接口
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取用户信息成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 成功
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
 *                   updatedAt: "2024-01-15T08:30:00.000Z"
 *       401:
 *         description: 未授权，需要登录
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
// GET /api/v1/users/me — 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -__v')
    if (!user) return notFound(res, '用户不存在')
    return success(res, user)
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     summary: 更新个人信息
 *     description: 更新当前登录用户的个人信息，需要登录认证
 *     tags:
 *       - 用户接口
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               realName:
 *                 type: string
 *                 description: 真实姓名
 *                 example: "张二狗"
 *               phone:
 *                 type: string
 *                 description: 手机号
 *                 example: "13800138000"
 *               address:
 *                 type: string
 *                 description: 家庭住址
 *                 example: "XX省XX市XX村XX组"
 *               avatar:
 *                 type: string
 *                 description: 头像URL
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       200:
 *         description: 个人信息更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 个人信息更新成功
 *                 data:
 *                   id: "69c23a6fd8589fba7cb98a20"
 *                   username: "liuyang"
 *                   realName: "张二狗"
 *                   phone: "13800138000"
 *                   address: "XX省XX市XX村XX组"
 *                   avatar: "https://example.com/avatar.jpg"
 *                   role: "user"
 *                   isActive: true
 *                   createdAt: "2024-01-10T08:30:00.000Z"
 *                   updatedAt: "2024-01-16T10:45:00.000Z"
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权，需要登录
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
// PUT /api/v1/users/me — 更新个人信息
router.put('/me', async (req, res) => {
  try {
    const { realName, phone, address, avatar } = req.body
    const update = {}
    if (realName !== undefined) update.realName = realName
    if (phone !== undefined) update.phone = phone
    if (address !== undefined) update.address = address
    if (avatar !== undefined) update.avatar = avatar

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true
    }).select('-password -__v')

    return success(res, user, '个人信息更新成功')
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/users/change-password:
 *   post:
 *     summary: 修改密码
 *     description: 修改当前登录用户的密码，需要登录认证
 *     tags:
 *       - 用户接口
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: 原密码
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 description: 新密码，至少6位
 *                 example: "newpassword456"
 *     responses:
 *       200:
 *         description: 密码修改成功，请重新登录
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 密码修改成功，请重新登录
 *                 data: null
 *       400:
 *         description: 请求参数错误，原密码错误，或新密码不符合要求
 *       401:
 *         description: 未授权，需要登录
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
// POST /api/v1/users/change-password — 修改密码
router.post('/change-password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) return badRequest(res, '原密码和新密码不能为空')
    if (newPassword.length < 6) return badRequest(res, '新密码至少 6 位')

    const user = await User.findById(req.user.id).select('+password')
    if (!user) return notFound(res, '用户不存在')

    const isMatch = await user.comparePassword(oldPassword)
    if (!isMatch) return badRequest(res, '原密码错误')

    user.password = newPassword
    await user.save()
    return success(res, null, '密码修改成功，请重新登录')
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/users/me/suggestions:
 *   get:
 *     summary: 获取用户发表的建言
 *     description: 获取当前登录用户发表的建言列表，支持分页，需要登录认证
 *     tags:
 *       - 用户接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
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
 *                       status: "approved"
 *                       isTop: false
 *                       createdAt: "2024-01-15T08:30:00.000Z"
 *                       updatedAt: "2024-01-15T08:30:00.000Z"
 *                   total: 12
 *                   page: 1
 *                   limit: 10
 *       401:
 *         description: 未授权，需要登录
 *       500:
 *         description: 服务器内部错误
 */
// GET /api/v1/users/me/suggestions — 获取当前用户发表的建言
router.get('/me/suggestions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))

    const query = { authorId: req.user.id }
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
 * /api/v1/users/me/favorites:
 *   get:
 *     summary: 获取用户收藏列表
 *     description: 获取当前登录用户收藏的建言列表，支持分页，需要登录认证
 *     tags:
 *       - 用户接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: 获取收藏列表成功
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
 *                       status: "approved"
 *                       isTop: false
 *                       createdAt: "2024-01-15T08:30:00.000Z"
 *                       updatedAt: "2024-01-15T08:30:00.000Z"
 *                   total: 8
 *                   page: 1
 *                   limit: 10
 *       401:
 *         description: 未授权，需要登录
 *       500:
 *         description: 服务器内部错误
 */
// GET /api/v1/users/me/favorites — 获取当前用户收藏列表
router.get('/me/favorites', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))

    const total = await Favorite.countDocuments({ user: req.user.id })
    const favorites = await Favorite.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'suggestion',
        select: '-likedBy -__v'
      })
      .lean()

    const list = favorites
      .filter(f => f.suggestion)
      .map(f => f.suggestion)

    return success(res, { list, total, page, limit })
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/users/me/liked:
 *   get:
 *     summary: 获取用户点赞的建言ID列表
 *     description: 获取当前登录用户点赞的建言ID列表（用于前端高亮显示），需要登录认证
 *     tags:
 *       - 用户接口
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取点赞ID列表成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 成功
 *                 data: ["69c23a6fd8589fba7cb98a23", "69c23a6fd8589fba7cb98a24"]
 *       401:
 *         description: 未授权，需要登录
 *       500:
 *         description: 服务器内部错误
 */
// GET /api/v1/users/me/liked — 获取当前用户点赞的建言ID列表（用于前端高亮）
router.get('/me/liked', async (req, res) => {
  try {
    const suggestions = await Suggestion.find({ likedBy: req.user.id }).select('_id').lean()
    return success(res, suggestions.map(s => s._id))
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/v1/users/me/favorited:
 *   get:
 *     summary: 获取用户收藏的建言ID列表
 *     description: 获取当前登录用户收藏的建言ID列表（用于前端高亮显示），需要登录认证
 *     tags:
 *       - 用户接口
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取收藏ID列表成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 成功
 *                 data: ["69c23a6fd8589fba7cb98a23", "69c23a6fd8589fba7cb98a24"]
 *       401:
 *         description: 未授权，需要登录
 *       500:
 *         description: 服务器内部错误
 */
// GET /api/v1/users/me/favorited — 获取当前用户收藏的建言ID列表（用于前端高亮）
router.get('/me/favorited', async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id }).select('suggestion').lean()
    return success(res, favorites.map(f => f.suggestion))
  } catch (err) {
    return serverError(res, err.message)
  }
})

module.exports = router
