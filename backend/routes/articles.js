const express = require('express')
const Article = require('../models/Article')
const authMiddleware = require('../middleware/auth')
const { success, created, badRequest, notFound, forbidden, serverError } = require('../utils/response')

const router = express.Router()

// 所有文章路由均需要登录
router.use(authMiddleware)

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: 获取文章列表
 *     description: 获取文章列表，支持分页和关键词搜索，需要登录认证
 *     tags:
 *       - 文章接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/keywordParam'
 *     responses:
 *       200:
 *         description: 获取文章列表成功
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
 *                       title: "乡村发展规划"
 *                       summary: "关于乡村未来发展的规划建议"
 *                       category: "规划"
 *                       author: "张三"
 *                       authorId: "69c23a6fd8589fba7cb98a20"
 *                       createdAt: "2024-01-15T08:30:00.000Z"
 *                       updatedAt: "2024-01-15T08:30:00.000Z"
 *                   total: 25
 *                   page: 1
 *                   limit: 10
 *       401:
 *         description: 未授权，需要登录
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 code: 401
 *                 message: 未授权，请先登录
 *                 data: null
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/articles/{id}:
 *   get:
 *     summary: 获取单篇文章
 *     description: 根据ID获取单篇文章详情，需要登录认证
 *     tags:
 *       - 文章接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 文章ID
 *         required: true
 *         schema:
 *           type: string
 *           example: "69c23a6fd8589fba7cb98a23"
 *     responses:
 *       200:
 *         description: 获取文章成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 成功
 *                 data:
 *                   id: "69c23a6fd8589fba7cb98a23"
 *                   title: "乡村发展规划"
 *                   content: "详细的发展规划内容..."
 *                   summary: "关于乡村未来发展的规划建议"
 *                   category: "规划"
 *                   author: "张三"
 *                   authorId: "69c23a6fd8589fba7cb98a20"
 *                   createdAt: "2024-01-15T08:30:00.000Z"
 *                   updatedAt: "2024-01-15T08:30:00.000Z"
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权访问
 *       404:
 *         description: 文章不存在
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/articles:
 *   post:
 *     summary: 创建文章
 *     description: 创建新文章，需要登录认证
 *     tags:
 *       - 文章接口
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
 *                 description: 文章标题
 *                 example: "乡村发展规划"
 *               content:
 *                 type: string
 *                 description: 文章内容
 *                 example: "详细的发展规划内容..."
 *               summary:
 *                 type: string
 *                 description: 文章摘要
 *                 example: "关于乡村未来发展的规划建议"
 *               category:
 *                 type: string
 *                 description: 文章分类
 *                 example: "规划"
 *     responses:
 *       201:
 *         description: 文章创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 201
 *                 message: 文章创建成功
 *                 data:
 *                   id: "69c23a6fd8589fba7cb98a23"
 *                   title: "乡村发展规划"
 *                   content: "详细的发展规划内容..."
 *                   summary: "关于乡村未来发展的规划建议"
 *                   category: "规划"
 *                   author: "张三"
 *                   authorId: "69c23a6fd8589fba7cb98a20"
 *                   createdAt: "2024-01-15T08:30:00.000Z"
 *                   updatedAt: "2024-01-15T08:30:00.000Z"
 *       400:
 *         description: 请求参数错误，标题和内容不能为空
 *       401:
 *         description: 未授权，需要登录
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/articles/{id}:
 *   put:
 *     summary: 更新文章
 *     description: 更新文章信息，只有作者或管理员可以编辑，需要登录认证
 *     tags:
 *       - 文章接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 文章ID
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
 *                 description: 文章标题
 *                 example: "乡村发展规划(更新版)"
 *               content:
 *                 type: string
 *                 description: 文章内容
 *                 example: "更新后的发展规划内容..."
 *               summary:
 *                 type: string
 *                 description: 文章摘要
 *                 example: "更新后的规划建议"
 *               category:
 *                 type: string
 *                 description: 文章分类
 *                 example: "规划"
 *     responses:
 *       200:
 *         description: 文章更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 文章更新成功
 *                 data:
 *                   id: "69c23a6fd8589fba7cb98a23"
 *                   title: "乡村发展规划(更新版)"
 *                   content: "更新后的发展规划内容..."
 *                   summary: "更新后的规划建议"
 *                   category: "规划"
 *                   author: "张三"
 *                   authorId: "69c23a6fd8589fba7cb98a20"
 *                   createdAt: "2024-01-15T08:30:00.000Z"
 *                   updatedAt: "2024-01-16T10:45:00.000Z"
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权编辑此文章
 *       404:
 *         description: 文章不存在
 *       500:
 *         description: 服务器内部错误
 */
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

/**
 * @swagger
 * /api/articles/{id}:
 *   delete:
 *     summary: 删除文章
 *     description: 删除文章，只有作者或管理员可以删除，需要登录认证
 *     tags:
 *       - 文章接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 文章ID
 *         required: true
 *         schema:
 *           type: string
 *           example: "69c23a6fd8589fba7cb98a23"
 *     responses:
 *       200:
 *         description: 文章删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 文章删除成功
 *                 data: null
 *       401:
 *         description: 未授权，需要登录
 *       403:
 *         description: 无权删除此文章
 *       404:
 *         description: 文章不存在
 *       500:
 *         description: 服务器内部错误
 */
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
