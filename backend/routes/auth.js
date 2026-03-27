const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { success, created, badRequest, unauthorized, conflict, serverError } = require('../utils/response')

const router = express.Router()

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
