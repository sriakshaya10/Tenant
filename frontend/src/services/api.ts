import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired session sends you back to sign in. A failed sign-in attempt is also a 401,
    // but that one must reach the form so it can show the error instead of reloading the page.
    const isAuthAttempt = /\/auth\/(login|register)$/.test(error.config?.url ?? '')
    if (error.response?.status === 401 && !isAuthAttempt) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
