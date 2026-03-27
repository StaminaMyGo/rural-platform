import service from './request'

export function login(data) {
  return service.post('/auth/login', data)
}

export function register(data) {
  return service.post('/auth/register', data)
}
