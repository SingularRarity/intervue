import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TenantRole = 'tenant_admin' | 'manager' | 'interviewer' | 'viewer'
export type PlanTier = 'free' | 'starter' | 'growth' | 'enterprise'

interface Tenant {
  id: string
  company_name: string
  email: string
  is_active: boolean
  has_claude_key: boolean
  has_sarvam_key: boolean
  industry?: string
  company_size?: string
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  tenant: Tenant | null
  role: TenantRole
  plan: PlanTier
  userId: string | null
  isGodAdmin: boolean
  setAuth: (token: string, tenant: Tenant, role?: TenantRole, plan?: PlanTier, userId?: string | null, refreshToken?: string | null) => void
  setGodAdmin: (token: string, adminId: string, email: string) => void
  setTokens: (token: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      tenant: null,
      role: 'tenant_admin',
      plan: 'free',
      userId: null,
      isGodAdmin: false,
      setAuth: (token, tenant, role = 'tenant_admin', plan = 'free', userId = null, refreshToken = null) =>
        set({
          token,
          // Preserve an existing refresh token if the caller doesn't supply one
          // (e.g. the second setAuth in LoginPage that only updates the plan).
          refreshToken: refreshToken ?? get().refreshToken,
          tenant, role, plan, userId, isGodAdmin: false,
        }),
      setGodAdmin: (token, adminId, email) =>
        set({
          token,
          refreshToken: null,
          tenant: { id: '', company_name: 'Platform Admin', email, is_active: true, has_claude_key: false, has_sarvam_key: false },
          role: 'tenant_admin',
          plan: 'enterprise',
          userId: adminId,
          isGodAdmin: true,
        }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      logout: () => set({ token: null, refreshToken: null, tenant: null, role: 'tenant_admin', plan: 'free', userId: null, isGodAdmin: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

interface InterviewState {
  currentSession: string | null
  isRecording: boolean
  messages: Array<{
    role: 'interviewer' | 'candidate' | 'system'
    content: string
    timestamp: Date
    audioUrl?: string
  }>
  setCurrentSession: (sessionId: string | null) => void
  setIsRecording: (recording: boolean) => void
  addMessage: (message: { role: 'interviewer' | 'candidate' | 'system'; content: string; audioUrl?: string }) => void
  clearMessages: () => void
}

export const useInterviewStore = create<InterviewState>((set) => ({
  currentSession: null,
  isRecording: false,
  messages: [],
  setCurrentSession: (sessionId) => set({ currentSession: sessionId }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, timestamp: new Date() }],
    })),
  clearMessages: () => set({ messages: [] }),
}))
