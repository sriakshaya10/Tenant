import api from './api'
import type { User } from '@/types'

export const authService = {
  async register(email: string, password: string, full_name: string): Promise<User> {
    const { data } = await api.post('/auth/register', { email, password, full_name })
    return data
  },

  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  async getMe(): Promise<User> {
    const { data } = await api.get('/auth/me')
    return data
  },

  async updateMe(update: { full_name?: string; email?: string }): Promise<User> {
    const { data } = await api.put('/auth/me', update)
    return data
  },

  logout() {
    localStorage.removeItem('token')
  }
}
