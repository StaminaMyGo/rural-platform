const { forbidden } = require('../utils/response')

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return forbidden(res, '仅管理员可访问')
  }
  next()
}

module.exports = adminMiddleware
