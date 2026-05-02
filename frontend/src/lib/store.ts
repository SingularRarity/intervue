import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  tenant: Tenant | null
  setAuth: (token: string, tenant: Tenant) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      tenant: null,
      setAuth: (token, tenant) => set({ token, tenant }),
      logout: () => set({ token: null, tenant: null }),
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
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, { ...message, timestamp: new Date() }],
  })),
  clearMessages: () => set({ messages: [] }),
}))
