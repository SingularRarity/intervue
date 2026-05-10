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

// Team API (updated — uses tenant_users)
export const teamApi = {
  list: () => api.get('/team'),
  invite: (data: { email: string; full_name?: string; role: string }) => api.post('/team/invite', data),
  updateRole: (id: string, role: string) => api.patch(`/team/${id}/role`, { role }),
  remove: (id: string) => api.delete(`/team/${id}`),
}

// Billing API
export const billingApi = {
  listPlans: () => api.get('/billing/plans'),
  getPlan: () => api.get('/billing/plan'),
  getUsage: () => api.get('/billing/usage'),
  contact: (data: { name: string; email: string; company?: string; request_type: string; plan_interested?: string; message: string }) =>
    api.post('/billing/contact', data),
}

// God admin API (uses a separate axios instance with its own token management)
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

adminApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export { adminApi }

export const jdApi = {
  parseFile: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/interviews/parse-jd', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const questionsApi = {
  list: (params?: { category?: string; difficulty?: string; source_type?: string; q?: string; limit?: number }) =>
    api.get('/questions', { params }),
  categories: () => api.get('/questions/categories'),
}

export const godAdminApi = {
  login: (data: { email: string; password: string }) => adminApi.post('/admin/auth/login', data),
  me: () => adminApi.get('/admin/auth/me'),
  stats: () => adminApi.get('/admin/stats'),
  listTenants: () => adminApi.get('/admin/tenants'),
  setTenantPlan: (id: string, plan: string) => adminApi.put(`/admin/tenants/${id}/plan`, { plan }),
  toggleTenant: (id: string) => adminApi.post(`/admin/tenants/${id}/toggle`),
  listPermissions: () => adminApi.get('/admin/permissions'),
  updatePermission: (id: string, allowed: boolean) => adminApi.put(`/admin/permissions/${id}`, { allowed }),
  listContacts: () => adminApi.get('/admin/contacts'),
  updateContactStatus: (id: string, status: string) => adminApi.put(`/admin/contacts/${id}/status`, { status }),
}
