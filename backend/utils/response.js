/**
 * 统一响应工具 —— 封装常见接口状态码
 */

const STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
}

function success(res, data = null, message = '成功', statusCode = STATUS.OK) {
  return res.status(statusCode).json({
    code: statusCode,
    message,
    data
  })
}

function created(res, data = null, message = '创建成功') {
  return success(res, data, message, STATUS.CREATED)
}

function badRequest(res, message = '请求参数错误') {
  return res.status(STATUS.BAD_REQUEST).json({
    code: STATUS.BAD_REQUEST,
    message,
    data: null
  })
}

function unauthorized(res, message = '未授权，请先登录') {
  return res.status(STATUS.UNAUTHORIZED).json({
    code: STATUS.UNAUTHORIZED,
    message,
    data: null
  })
}

function forbidden(res, message = '权限不足') {
  return res.status(STATUS.FORBIDDEN).json({
    code: STATUS.FORBIDDEN,
    message,
    data: null
  })
}

function notFound(res, message = '资源不存在') {
  return res.status(STATUS.NOT_FOUND).json({
    code: STATUS.NOT_FOUND,
    message,
    data: null
  })
}

function conflict(res, message = '资源已存在') {
  return res.status(STATUS.CONFLICT).json({
    code: STATUS.CONFLICT,
    message,
    data: null
  })
}

function serverError(res, message = '服务器内部错误') {
  return res.status(STATUS.INTERNAL_ERROR).json({
    code: STATUS.INTERNAL_ERROR,
    message,
    data: null
  })
}

module.exports = {
  STATUS,
  success,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError
}
