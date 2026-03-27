import service from './request'

export function getArticles(params) {
  return service.get('/articles', { params })
}

export function getArticle(id) {
  return service.get(`/articles/${id}`)
}

export function createArticle(data) {
  return service.post('/articles', data)
}

export function updateArticle(id, data) {
  return service.put(`/articles/${id}`, data)
}

export function deleteArticle(id) {
  return service.delete(`/articles/${id}`)
}
