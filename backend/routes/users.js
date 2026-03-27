const express = require('express')
const User = require('../models/User')
const Suggestion = require('../models/Suggestion')
const Favorite = require('../models/Favorite')
const authMiddleware = require('../middleware/auth')
const { success, badRequest, notFound, serverError } = require('../utils/response')

const router = express.Router()

// 所有用户路由均需要登录
router.use(authMiddleware)

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

// GET /api/v1/users/me/liked — 获取当前用户点赞的建言ID列表（用于前端高亮）
router.get('/me/liked', async (req, res) => {
  try {
    const suggestions = await Suggestion.find({ likedBy: req.user.id }).select('_id').lean()
    return success(res, suggestions.map(s => s._id))
  } catch (err) {
    return serverError(res, err.message)
  }
})

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
