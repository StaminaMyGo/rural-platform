import service from './request'

// 登录
export function login(data) {
  return service.post('/auth/login', data)
}

// 统计数据
export function getStats() {
  return service.get('/v1/admin/stats')
}

// 用户管理
export function getUsers(params) {
  return service.get('/v1/admin/users', { params })
}

export function disableUser(id) {
  return service.put(`/v1/admin/users/${id}/disable`)
}

export function enableUser(id) {
  return service.put(`/v1/admin/users/${id}/enable`)
}

export function resetPassword(id) {
  return service.put(`/v1/admin/users/${id}/reset-password`)
}

// 建言管理
export function getSuggestions(params) {
  return service.get('/v1/admin/suggestions', { params })
}

export function updateSuggestionStatus(id, status) {
  return service.put(`/v1/admin/suggestions/${id}/status`, { status })
}

export function toggleSuggestionTop(id) {
  return service.put(`/v1/admin/suggestions/${id}/top`)
}

export function deleteSuggestion(id) {
  return service.delete(`/v1/admin/suggestions/${id}`)
}

export function replyToSuggestion(id, data) {
  return service.post(`/v1/suggestions/${id}/reply`, data)
}
