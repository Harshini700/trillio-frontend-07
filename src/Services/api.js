import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.authorization = `Bearer ${token}`
  return config
})


API.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
)

export default API

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login:    (data) => API.post('/auth/login', data),
  me:       ()     => API.get('/auth/me'),
}

export const boardAPI = {
  getAll:       ()         => API.get('/boards'),
  getOne:       (id)       => API.get(`/boards/${id}`),
  create:       (data)     => API.post('/boards', data),
  update:       (id, data) => API.put(`/boards/${id}`, data),
  delete:       (id)       => API.delete(`/boards/${id}`),
  addMember:    (id, data) => API.post(`/boards/${id}/members`, data),
  removeMember: (id, uid)  => API.delete(`/boards/${id}/members/${uid}`),
}

export const cardAPI = {
  getAll:           (boardId)      => API.get(`/cards/${boardId}`),
  create:           (data)         => API.post('/cards', data),
  update:           (id, data)     => API.put(`/cards/${id}`, data),
  delete:           (id)           => API.delete(`/cards/${id}`),
  reorder:          (cards)        => API.put('/cards/reorder', { cards }),
  upload:           (id, formData) => API.post(`/cards/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteAttachment: (cardId, attId) => API.delete(`/cards/${cardId}/attachments/${attId}`),
}

export const commentAPI = {
  getAll: (cardId) => API.get(`/comments/${cardId}`),
  create: (data)   => API.post('/comments', data),
  delete: (id)     => API.delete(`/comments/${id}`),
}

export const activityAPI = {
  getAll: (boardId) => API.get(`/activities/${boardId}`),
}

export const notificationAPI = {
  getAll:   ()    => API.get('/notifications'),
  markRead: (id)  => API.put(`/notifications/${id}/read`),
  markAll:  ()    => API.put('/notifications/read-all'),
  delete:   (id)  => API.delete(`/notifications/${id}`),
}