const express = require('express')
const Suggestion = require('../models/Suggestion')
const Comment = require('../models/Comment')
const Favorite = require('../models/Favorite')
const authMiddleware = require('../middleware/auth')
const adminMiddleware = require('../middleware/admin')
const {
  success, created, badRequest, notFound, forbidden, serverError
} = require('../utils/response')

const router = express.Router()

// GET /api/v1/suggestions — 分页获取建言列表
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))
    const keyword = req.query.keyword?.trim() || ''
    const category = req.query.category?.trim() || ''
    const sort = req.query.sort || 'latest'

    const query = { status: 'approved' }
    if (keyword) {
      const regex = new RegExp(keyword, 'i')
      query.$or = [{ title: regex }, { content: regex }]
    }
    if (category && category !== 'all') {
      query.category = category
    }

    const sortObj = sort === 'hot'
      ? { likesCount: -1, createdAt: -1 }
      : { isTop: -1, createdAt: -1 }

    const total = await Suggestion.countDocuments(query)
    const list = await Suggestion.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-likedBy -__v')
      .lean()

    // 附带评论数
    const ids = list.map(s => s._id)
    const commentCounts = await Comment.aggregate([
      { $match: { suggestion: { $in: ids } } },
      { $group: { _id: '$suggestion', count: { $sum: 1 } } }
    ])
    const countMap = {}
    commentCounts.forEach(c => { countMap[c._id.toString()] = c.count })
    list.forEach(s => { s.commentCount = countMap[s._id.toString()] || 0 })

    return success(res, { list, total, page, limit })
  } catch (err) {
    return serverError(res, err.message)
  }
})

// GET /api/v1/suggestions/:id — 获取单个建言详情
router.get('/:id', async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id).select('-likedBy -__v').lean()
    if (!suggestion) return notFound(res, '建言不存在')

    const commentCount = await Comment.countDocuments({ suggestion: suggestion._id })
    suggestion.commentCount = commentCount

    return success(res, suggestion)
  } catch (err) {
    return serverError(res, err.message)
  }
})

// POST /api/v1/suggestions — 发布建言（需登录）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, category } = req.body
    if (!title || !content) return badRequest(res, '标题和内容不能为空')

    const suggestion = await Suggestion.create({
      title,
      content,
      category: category || '其他',
      authorId: req.user.id,
      authorName: req.user.realName || req.user.username
    })
    return created(res, suggestion, '建言发布成功，等待审核')
  } catch (err) {
    return serverError(res, err.message)
  }
})

// PUT /api/v1/suggestions/:id — 编辑建言（作者或管理员）
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id)
    if (!suggestion) return notFound(res, '建言不存在')

    if (suggestion.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return forbidden(res, '无权编辑此建言')
    }

    const { title, content, category } = req.body
    if (title !== undefined) suggestion.title = title
    if (content !== undefined) suggestion.content = content
    if (category !== undefined) suggestion.category = category

    // 编辑后重置为待审核
    if (req.user.role !== 'admin') suggestion.status = 'pending'

    await suggestion.save()
    return success(res, suggestion, '建言更新成功')
  } catch (err) {
    return serverError(res, err.message)
  }
})

// DELETE /api/v1/suggestions/:id — 删除建言（作者或管理员）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id)
    if (!suggestion) return notFound(res, '建言不存在')

    if (suggestion.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return forbidden(res, '无权删除此建言')
    }

    await suggestion.deleteOne()
    await Comment.deleteMany({ suggestion: suggestion._id })
    await Favorite.deleteMany({ suggestion: suggestion._id })
    return success(res, null, '建言删除成功')
  } catch (err) {
    return serverError(res, err.message)
  }
})

// POST /api/v1/suggestions/:id/like — 点赞/取消点赞（需登录）
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id)
    if (!suggestion) return notFound(res, '建言不存在')

    const userId = req.user.id
    const idx = suggestion.likedBy.findIndex(id => id.toString() === userId)
    let liked
    if (idx === -1) {
      suggestion.likedBy.push(userId)
      suggestion.likesCount += 1
      liked = true
    } else {
      suggestion.likedBy.splice(idx, 1)
      suggestion.likesCount = Math.max(0, suggestion.likesCount - 1)
      liked = false
    }
    await suggestion.save()
    return success(res, { liked, likesCount: suggestion.likesCount })
  } catch (err) {
    return serverError(res, err.message)
  }
})

// POST /api/v1/suggestions/:id/favorite — 收藏/取消收藏（需登录）
router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id)
    if (!suggestion) return notFound(res, '建言不存在')

    const existing = await Favorite.findOne({ user: req.user.id, suggestion: req.params.id })
    let favorited
    if (existing) {
      await existing.deleteOne()
      suggestion.favoritesCount = Math.max(0, suggestion.favoritesCount - 1)
      favorited = false
    } else {
      await Favorite.create({ user: req.user.id, suggestion: req.params.id })
      suggestion.favoritesCount += 1
      favorited = true
    }
    await suggestion.save()
    return success(res, { favorited, favoritesCount: suggestion.favoritesCount })
  } catch (err) {
    return serverError(res, err.message)
  }
})

// GET /api/v1/suggestions/:id/comments — 获取评论列表
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ suggestion: req.params.id })
      .sort({ createdAt: 1 })
      .select('-__v')
      .lean()
    return success(res, comments)
  } catch (err) {
    return serverError(res, err.message)
  }
})

// POST /api/v1/suggestions/:id/comments — 发表评论（需登录）
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id)
    if (!suggestion) return notFound(res, '建言不存在')

    const { content } = req.body
    if (!content?.trim()) return badRequest(res, '评论内容不能为空')

    const comment = await Comment.create({
      suggestion: req.params.id,
      authorId: req.user.id,
      authorName: req.user.realName || req.user.username,
      content: content.trim()
    })
    return created(res, comment, '评论发表成功')
  } catch (err) {
    return serverError(res, err.message)
  }
})

// POST /api/v1/suggestions/:id/reply — 干部回复（管理员）
router.post('/:id/reply', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id)
    if (!suggestion) return notFound(res, '建言不存在')

    const { content } = req.body
    if (!content?.trim()) return badRequest(res, '回复内容不能为空')

    suggestion.officialReply = {
      content: content.trim(),
      authorId: req.user.id,
      authorName: req.user.realName || req.user.username
    }
    await suggestion.save()
    return success(res, suggestion.officialReply, '回复成功')
  } catch (err) {
    return serverError(res, err.message)
  }
})

module.exports = router
