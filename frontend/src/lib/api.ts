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

// ── Token refresh on 401 ─────────────────────────────────────────────────────
// Access tokens are short-lived (~2h). On a 401 we try the refresh token once,
// update the store, and retry the original request. Concurrent 401s share a
// single in-flight refresh so we don't fire N refreshes at once.
let refreshInFlight: Promise<string | null> | null = null

async function runRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState()
  if (!refreshToken) {
    logout()
    return null
  }
  try {
    // Bare axios (not `api`) so this call doesn't recurse through the interceptor.
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    )
    const newToken: string = res.data.token
    const newRefresh: string = res.data.refresh_token
    setTokens(newToken, newRefresh)
    return newToken
  } catch {
    logout()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    // Don't try to refresh the refresh call itself, or retry endlessly.
    const isAuthCall = original?.url?.includes('/auth/refresh') || original?.url?.includes('/tenants/login')

    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true
      refreshInFlight = refreshInFlight ?? runRefresh()
      const newToken = await refreshInFlight
      refreshInFlight = null

      if (newToken) {
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
      // Refresh failed — bounce to login
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
  logout: (refresh_token: string) => api.post('/auth/logout', { refresh_token }),
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
  parseResumeFile: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/candidates/parse-resume-file', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  refreshGithub: (id: string) => api.post(`/candidates/${id}/refresh-github`),

  createSession: (data: unknown) => api.post('/sessions', data),
  getSession: (id: string) => api.get(`/sessions/${id}`),
  getSessionResults: (id: string) => api.get(`/sessions/${id}/results`),
  submitFeedback: (id: string, data: unknown) => api.post(`/sessions/${id}/feedback`, data),
  generateInviteToken: (id: string) => api.post(`/sessions/${id}/invite-token`),
  draftInviteEmail: (id: string, body?: { frontend_url?: string }) =>
    api.post(`/sessions/${id}/draft-invite`, body ?? {}),
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
