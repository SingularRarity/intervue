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
import IntegrationsPage from './pages/IntegrationsPage'
import CandidatePortalPage from './pages/CandidatePortalPage'
import CodeAssessmentPage from './pages/CodeAssessmentPage'

function App() {
  const { token } = useAuthStore()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      {/* Public candidate portal — no auth required */}
      <Route path="/candidate/:token" element={<CandidatePortalPage />} />

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

      {/* Protected app routes with sidebar */}
      <Route element={token ? <Layout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/interview/:sessionId" element={<InterviewPage />} />
        <Route path="/results/:sessionId" element={<SessionResultsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
      </Route>
    </Routes>
  )
}

export default App
