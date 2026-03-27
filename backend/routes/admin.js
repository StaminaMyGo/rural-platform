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
