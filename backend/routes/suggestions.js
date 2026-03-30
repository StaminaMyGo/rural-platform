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

/**
 * @swagger
 * /api/v1/suggestions:
 *   get:
 *     summary: 获取建言列表
 *     description: 分页获取建言列表，支持关键词搜索、分类筛选和排序，公开接口无需认证
 *     tags:
 *       - 建言接口
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/keywordParam'
 *       - name: category
 *         in: query
 *         description: 分类筛选
 *         required: false
 *         schema:
 *           type: string
 *           example: "环境"
 *       - name: sort
 *         in: query
 *         description: 排序方式 (latest-最新, hot-最热)
 *         required: false
 *         schema:
 *           type: string
 *           enum: [latest, hot]
 *           default: latest
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
 *                   total: 35
 *                   page: 1
 *                   limit: 10
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/v1/suggestions/{id}:
 *   get:
 *     summary: 获取建言详情
 *     description: 根据ID获取单个建言详情，包括评论数，公开接口无需认证
 *     tags:
 *       - 建言接口
 *     security: []
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
 *         description: 获取建言详情成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 成功
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
 *                   updatedAt: "2024-01-15T08:30:00.000Z"
 *       404:
 *         description: 建言不存在
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/v1/suggestions:
 *   post:
 *     summary: 发布建言
 *     description: 发布新的建言，需要登录认证，发布后状态为待审核
 *     tags:
 *       - 建言接口
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: 建言标题
 *                 example: "关于改善村容村貌的建议"
 *               content:
 *                 type: string
 *                 description: 建言内容
 *                 example: "具体建议内容..."
 *               category:
 *                 type: string
 *                 description: 建言分类
 *                 example: "环境"
 *     responses:
 *       201:
 *         description: 建言发布成功，等待审核
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 201
 *                 message: 建言发布成功，等待审核
 *                 data:
 *                   id: "69c23a6fd8589fba7cb98a23"
 *                   title: "关于改善村容村貌的建议"
 *                   content: "具体建议内容..."
 *                   category: "环境"
 *                   authorName: "张三"
 *                   authorId: "69c23a6fd8589fba7cb98a20"
 *                   status: "pending"
 *                   createdAt: "2024-01-15T08:30:00.000Z"
 *                   updatedAt: "2024-01-15T08:30:00.000Z"
 *       400:
 *         description: 请求参数错误，标题和内容不能为空
 *       401:
 *         description: 未授权，需要登录
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/v1/suggestions/{id}:
 *   put:
 *     summary: 编辑建言
 *     description: 编辑建言信息，只有作者或管理员可以编辑，需要登录认证，编辑后状态重置为待审核
 *     tags:
 *       - 建言接口
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
 *             properties:
 *               title:
 *                 type: string
 *                 description: 建言标题
 *                 example: "关于改善村容村貌的建议(更新版)"
 *               content:
 *                 type: string
 *                 description: 建言内容
 *                 example: "更新后的建议内容..."
 *               category:
 *                 type: string
 *                 description: 建言分类
 *                 example: "环境"
 *     responses:
 *       200:
 *         description: 建言更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 建言更新成功
 *                 data:
 *                   id: "69c23a6fd8589fba7cb98a23"
 *                   title: "关于改善村容村貌的建议(更新版)"
 *                   content: "更新后的建议内容..."
 *                   category: "环境"
 *                   authorName: "张三"
 *                   authorId: "69c23a6fd8589fba7cb98a20"
 *                   status: "pending"
 *                   createdAt: "2024-01-15T08:30:00.000Z"
 *                   updatedAt: "2024-01-16T10:45:00.000Z"
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权编辑此建言
 *       404:
 *         description: 建言不存在
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/v1/suggestions/{id}:
 *   delete:
 *     summary: 删除建言
 *     description: 删除建言，只有作者或管理员可以删除，需要登录认证
 *     tags:
 *       - 建言接口
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
 *         description: 建言删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 建言删除成功
 *                 data: null
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权删除此建言
 *       404:
 *         description: 建言不存在
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/v1/suggestions/{id}/like:
 *   post:
 *     summary: 点赞/取消点赞建言
 *     description: 点赞或取消点赞建言，需要登录认证
 *     tags:
 *       - 建言接口
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
 *                 message: 操作成功
 *                 data:
 *                   liked: true
 *                   likesCount: 16
 *       401:
 *         description: 未授权，需要登录
 *       404:
 *         description: 建言不存在
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/v1/suggestions/{id}/favorite:
 *   post:
 *     summary: 收藏/取消收藏建言
 *     description: 收藏或取消收藏建言，需要登录认证
 *     tags:
 *       - 建言接口
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
 *                 message: 操作成功
 *                 data:
 *                   favorited: true
 *                   favoritesCount: 9
 *       401:
 *         description: 未授权，需要登录
 *       404:
 *         description: 建言不存在
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/v1/suggestions/{id}/comments:
 *   get:
 *     summary: 获取评论列表
 *     description: 获取建言的评论列表，公开接口无需认证
 *     tags:
 *       - 建言接口
 *     security: []
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
 *         description: 获取评论列表成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 成功
 *                 data:
 *                   - id: "69c23a6fd8589fba7cb98a24"
 *                     suggestion: "69c23a6fd8589fba7cb98a23"
 *                     authorId: "69c23a6fd8589fba7cb98a20"
 *                     authorName: "李四"
 *                     content: "这个建议很好！"
 *                     createdAt: "2024-01-15T09:30:00.000Z"
 *       404:
 *         description: 建言不存在
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/v1/suggestions/{id}/comments:
 *   post:
 *     summary: 发表评论
 *     description: 对建言发表评论，需要登录认证
 *     tags:
 *       - 建言接口
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 评论内容
 *                 example: "这个建议很好！"
 *     responses:
 *       201:
 *         description: 评论发表成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 201
 *                 message: 评论发表成功
 *                 data:
 *                   id: "69c23a6fd8589fba7cb98a24"
 *                   suggestion: "69c23a6fd8589fba7cb98a23"
 *                   authorId: "69c23a6fd8589fba7cb98a20"
 *                   authorName: "李四"
 *                   content: "这个建议很好！"
 *                   createdAt: "2024-01-15T09:30:00.000Z"
 *       400:
 *         description: 请求参数错误，评论内容不能为空
 *       401:
 *         description: 未授权，需要登录
 *       404:
 *         description: 建言不存在
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/v1/suggestions/{id}/reply:
 *   post:
 *     summary: 干部回复（管理员）
 *     description: 管理员对建言进行官方回复，需要管理员权限
 *     tags:
 *       - 建言接口
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 回复内容
 *                 example: "感谢您的建议，我们将认真研究处理。"
 *     responses:
 *       200:
 *         description: 回复成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 回复成功
 *                 data:
 *                   content: "感谢您的建议，我们将认真研究处理。"
 *                   authorId: "69c23a6fd8589fba7cb98a25"
 *                   authorName: "王主任"
 *       400:
 *         description: 请求参数错误，回复内容不能为空
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权限，需要管理员角色
 *       404:
 *         description: 建言不存在
 *       500:
 *         description: 服务器内部错误
 */
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
