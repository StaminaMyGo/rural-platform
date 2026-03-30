const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { success, created, badRequest, unauthorized, conflict, serverError } = require('../utils/response')

const router = express.Router()

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     description: 新用户注册，校验用户名唯一性，默认角色为村民
 *     tags:
 *       - 认证接口
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 登录账号（唯一）
 *                 example: "liuyang"
 *               password:
 *                 type: string
 *                 description: 登录密码
 *                 example: "password123"
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
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 201
 *                 message: 注册成功
 *                 data:
 *                   id: "69c23a6fd8589fba7cb98a23"
 *                   username: "liuyang"
 *                   realName: "张二狗"
 *                   role: "user"
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 code: 400
 *                 message: 用户名和密码不能为空
 *                 data: null
 *       409:
 *         description: 用户名已存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 code: 409
 *                 message: 用户名已存在
 *                 data: null
 *       500:
 *         description: 服务器内部错误
 */
// POST /api/auth/register — 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, realName, phone, address } = req.body
    if (!username || !password) {
      return badRequest(res, '用户名和密码不能为空')
    }

    const exists = await User.findOne({ username })
    if (exists) return conflict(res, '用户名已存在')

    const user = await User.create({ username, password, realName, phone, address })
    return created(res, {
      id: user._id,
      username: user.username,
      realName: user.realName,
      role: user.role
    }, '注册成功')
  } catch (err) {
    return serverError(res, err.message)
  }
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     description: 用户登录，验证用户名和密码，返回JWT令牌
 *     tags:
 *       - 认证接口
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 登录账号
 *                 example: "liuyang"
 *               password:
 *                 type: string
 *                 description: 登录密码
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               example:
 *                 code: 200
 *                 message: 登录成功
 *                 data:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   user:
 *                     id: "69c23a6fd8589fba7cb98a23"
 *                     username: "liuyang"
 *                     realName: "张二狗"
 *                     phone: "13800138000"
 *                     address: "XX省XX市XX村XX组"
 *                     avatar: null
 *                     role: "user"
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 code: 400
 *                 message: 用户名和密码不能为空
 *                 data: null
 *       401:
 *         description: 用户名或密码错误，或账号被禁用
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 code: 401
 *                 message: 用户名或密码错误
 *                 data: null
 *       500:
 *         description: 服务器内部错误
 */
// POST /api/auth/login — 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return badRequest(res, '用户名和密码不能为空')
    }

    const user = await User.findOne({ username }).select('+password')
    if (!user) return unauthorized(res, '用户名或密码错误')

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return unauthorized(res, '用户名或密码错误')

    if (!user.isActive) {
      return unauthorized(res, '账号已被禁用，请联系管理员')
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, realName: user.realName },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    return success(res, {
      token,
      user: {
        id: user._id,
        username: user.username,
        realName: user.realName,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        role: user.role
      }
    }, '登录成功')
  } catch (err) {
    return serverError(res, err.message)
  }
})

module.exports = router
