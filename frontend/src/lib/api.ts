import axios from 'axios'
import { useAuthStore } from './store'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Tenant API
export const tenantApi = {
  register: (data: unknown) => api.post('/tenants', data),
  login: (data: unknown) => api.post('/tenants/login', data),
  me: () => api.get('/tenants/me'),
  updateKeys: (data: unknown) => api.put('/tenants/keys', data),
}

// Interview API
export const interviewApi = {
  createTemplate: (data: unknown) => api.post('/interviews', data),
  getTemplates: () => api.get('/interviews'),
  getTemplate: (id: string) => api.get(`/interviews/${id}`),
  updateTemplate: (id: string, data: unknown) => api.put(`/interviews/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/interviews/${id}`),

  createCandidate: (data: unknown) => api.post('/candidates', data),
  getCandidates: () => api.get('/candidates'),
  getCandidate: (id: string) => api.get(`/candidates/${id}`),
  parseResume: (resume_text: string) => api.post('/candidates/parse-resume', { resume_text }),

  createSession: (data: unknown) => api.post('/sessions', data),
  getSession: (id: string) => api.get(`/sessions/${id}`),
  getSessionResults: (id: string) => api.get(`/sessions/${id}/results`),
  submitFeedback: (id: string, data: unknown) => api.post(`/sessions/${id}/feedback`, data),
  generateInviteToken: (id: string) => api.post(`/sessions/${id}/invite-token`),
  pushToAts: (id: string) => api.post(`/sessions/${id}/ats-push`),
  getProctoringReport: (id: string) => api.get(`/sessions/${id}/proctoring`),
  getCodingChallenge: (id: string) => api.get(`/sessions/${id}/coding`),
  submitCode: (id: string, data: { language: string; code: string }) =>
    api.post(`/sessions/${id}/coding/submit`, data),
}

// Team API
export const teamApi = {
  list: () => api.get('/team'),
  invite: (email: string, role: string) => api.post('/team/invite', { email, role }),
  remove: (id: string) => api.delete(`/team/${id}`),
}

// Integrations API
export const integrationsApi = {
  getAts: () => api.get('/integrations/ats'),
  updateAts: (data: unknown) => api.put('/integrations/ats', data),
  getSso: () => api.get('/integrations/sso'),
  updateSso: (data: unknown) => api.put('/integrations/sso', data),
}

// Branding API
export const brandingApi = {
  get: () => api.get('/branding'),
  update: (data: unknown) => api.put('/branding', data),
}

// Analytics API
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSessions: (params?: unknown) => api.get('/analytics/sessions', { params }),
}
