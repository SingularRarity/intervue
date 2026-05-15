import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './lib/store'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import TemplatesPage from './pages/TemplatesPage'
import CandidatesPage from './pages/CandidatesPage'
import InterviewPage from './pages/InterviewPage'
import VideoInterviewPage from './pages/VideoInterviewPage'
import SessionResultsPage from './pages/SessionResultsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import TeamPage from './pages/TeamPage'
import BillingPage from './pages/BillingPage'
import IntegrationsPage from './pages/IntegrationsPage'
import CandidatePortalPage from './pages/CandidatePortalPage'
import CodeAssessmentPage from './pages/CodeAssessmentPage'
import NotFoundPage from './pages/NotFoundPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminPage from './pages/AdminPage'
import OnboardingPage from './pages/OnboardingPage'

function App() {
  const { token, tenant } = useAuthStore()
  const onboardingDone = tenant?.id ? !!localStorage.getItem(`onboarding_done_${tenant.id}`) : false

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

      {/* Public candidate portal */}
      <Route path="/candidate/:token" element={<CandidatePortalPage />} />

      {/* God admin console — its own layout */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminPage />} />

      {/* Onboarding — no sidebar, requires auth; skip if already completed */}
      <Route
        path="/onboarding"
        element={!token ? <Navigate to="/login" /> : onboardingDone ? <Navigate to="/dashboard" /> : <OnboardingPage />}
      />

      {/* Video interview — no sidebar */}
      <Route
        path="/video-interview/:sessionId"
        element={token ? <VideoInterviewPage /> : <Navigate to="/login" />}
      />

      {/* Code assessment — no sidebar */}
      <Route
        path="/code/:sessionId"
        element={token ? <CodeAssessmentPage /> : <Navigate to="/login" />}
      />

      {/* Interview UI — public so candidates (no JWT, only ?candidate_token=) can join.
          InterviewPage decides at runtime whether to use the candidate_token from the
          URL or the JWT from localStorage. */}
      <Route path="/interview/:sessionId" element={<InterviewPage />} />

      {/* Protected app routes with sidebar */}
      <Route element={token ? <Layout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/results/:sessionId" element={<SessionResultsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
