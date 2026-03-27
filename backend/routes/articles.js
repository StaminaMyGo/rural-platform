const express = require('express')
const Article = require('../models/Article')
const authMiddleware = require('../middleware/auth')
const { success, created, badRequest, notFound, forbidden, serverError } = require('../utils/response')

const router = express.Router()

// 所有文章路由均需要登录
router.use(authMiddleware)

// GET /api/articles — 获取文章列表（支持分页 + 关键词搜索）
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))
    const keyword = req.query.keyword?.trim() || ''

    let query = {}
    if (keyword) {
      // 模糊搜索：标题或内容包含关键词（不区分大小写）
      const regex = new RegExp(keyword, 'i')
      query = { $or: [{ title: regex }, { content: regex }, { summary: regex }] }
    }

    const total = await Article.countDocuments(query)
    const list = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v')

    return success(res, { list, total, page, limit })
  } catch (err) {
    return serverError(res, err.message)
  }
})

// GET /api/articles/:id — 获取单篇文章
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).select('-__v')
    if (!article) return notFound(res, '文章不存在')
    return success(res, article)
  } catch (err) {
    return serverError(res, err.message)
  }
})

// POST /api/articles — 新建文章
router.post('/', async (req, res) => {
  try {
    const { title, content, summary, category } = req.body
    if (!title || !content) return badRequest(res, '标题和内容不能为空')

    const article = await Article.create({
      title,
      content,
      summary,
      category,
      author: req.user.username,
      authorId: req.user.id
    })
    return created(res, article, '文章创建成功')
  } catch (err) {
    return serverError(res, err.message)
  }
})

// PUT /api/articles/:id — 更新文章
router.put('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    if (!article) return notFound(res, '文章不存在')

    // 只有作者或管理员可以编辑
    if (article.authorId?.toString() !== req.user.id && req.user.role !== 'admin') {
      return forbidden(res, '无权编辑此文章')
    }

    const { title, content, summary, category } = req.body
    if (title !== undefined) article.title = title
    if (content !== undefined) article.content = content
    if (summary !== undefined) article.summary = summary
    if (category !== undefined) article.category = category

    await article.save()
    return success(res, article, '文章更新成功')
  } catch (err) {
    return serverError(res, err.message)
  }
})

// DELETE /api/articles/:id — 删除文章
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    if (!article) return notFound(res, '文章不存在')

    if (article.authorId?.toString() !== req.user.id && req.user.role !== 'admin') {
      return forbidden(res, '无权删除此文章')
    }

    await article.deleteOne()
    return success(res, null, '文章删除成功')
  } catch (err) {
    return serverError(res, err.message)
  }
})

module.exports = router
