import service from './request'

// 建言列表（公开，已通过的）
export function getSuggestions(params) {
  return service.get('/v1/suggestions', { params })
}

// 获取单个建言
export function getSuggestion(id) {
  return service.get(`/v1/suggestions/${id}`)
}

// 发布建言
export function createSuggestion(data) {
  return service.post('/v1/suggestions', data)
}

// 编辑建言
export function updateSuggestion(id, data) {
  return service.put(`/v1/suggestions/${id}`, data)
}

// 删除建言
export function deleteSuggestion(id) {
  return service.delete(`/v1/suggestions/${id}`)
}

// 点赞/取消点赞
export function likeSuggestion(id) {
  return service.post(`/v1/suggestions/${id}/like`)
}

// 收藏/取消收藏
export function favoriteSuggestion(id) {
  return service.post(`/v1/suggestions/${id}/favorite`)
}

// 获取评论列表
export function getComments(id) {
  return service.get(`/v1/suggestions/${id}/comments`)
}

// 发表评论
export function addComment(id, data) {
  return service.post(`/v1/suggestions/${id}/comments`, data)
}

// 官方回复（管理员）
export function replyToSuggestion(id, data) {
  return service.post(`/v1/suggestions/${id}/reply`, data)
}

// 用户个人信息
export function getProfile() {
  return service.get('/v1/users/me')
}

export function updateProfile(data) {
  return service.put('/v1/users/me', data)
}

export function changePassword(data) {
  return service.post('/v1/users/change-password', data)
}

// 我的建言
export function getMySuggestions(params) {
  return service.get('/v1/users/me/suggestions', { params })
}

// 我的收藏列表
export function getMyFavorites(params) {
  return service.get('/v1/users/me/favorites', { params })
}

// 我的点赞列表（ID集合）
export function getMyLiked() {
  return service.get('/v1/users/me/liked')
}

// 我的收藏ID集合
export function getMyFavorited() {
  return service.get('/v1/users/me/favorited')
}
