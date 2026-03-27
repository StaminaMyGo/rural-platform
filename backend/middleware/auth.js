const jwt = require('jsonwebtoken')
const { unauthorized } = require('../utils/response')

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res)
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return unauthorized(res, 'Token 无效或已过期')
  }
}

module.exports = authMiddleware
