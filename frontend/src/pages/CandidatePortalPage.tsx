import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mic, Video, Clock, Globe, CheckCircle } from 'lucide-react'

interface SessionInfo {
  session_id: string
  status: string
  session_type: string
  scheduled_at: string | null
  candidate_name: string
  template_title: string
  duration_minutes: number
  language: string
  company_name: string
  branding: {
    logo_url?: string
    primary_color?: string
    company_display_name?: string
  }
}

export default function CandidatePortalPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [info, setInfo] = useState<SessionInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/v1/candidate-portal/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setInfo(data)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const startInterview = () => {
    if (!info) return
    const path =
      info.session_type === 'video'
        ? `/video-interview/${info.session_id}`
        : `/interview/${info.session_id}`
    navigate(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <p className="text-dark-400">Loading your interview...</p>
      </div>
    )
  }

  if (error || !info) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg font-semibold mb-2">Invalid Link</p>
          <p className="text-dark-400">{error || 'This interview link is invalid or has expired.'}</p>
        </div>
      </div>
    )
  }

  const company = info.branding.company_display_name ?? info.company_name

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Company branding */}
        <div className="text-center mb-8">
          {info.branding.logo_url ? (
            <img src={info.branding.logo_url} alt={company} className="h-12 mx-auto mb-4 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{company}</h1>
          <p className="text-dark-400 mt-1">AI-Powered Interview</p>
        </div>

        {/* Session card */}
        <div className="bg-dark-900 rounded-2xl border border-dark-800 p-8 mb-6">
          <p className="text-white text-lg font-semibold mb-1">
            Hello, {info.candidate_name}!
          </p>
          <p className="text-dark-400 text-sm mb-6">
            You've been invited to complete an AI interview for:
          </p>

          <div className="bg-dark-800 rounded-xl p-4 mb-6">
            <p className="text-primary-400 font-semibold">{info.template_title}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-dark-300 text-sm">
              <Clock className="w-4 h-4 text-dark-500 flex-shrink-0" />
              <span>{info.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-3 text-dark-300 text-sm">
              {info.session_type === 'video' ? (
                <Video className="w-4 h-4 text-dark-500 flex-shrink-0" />
              ) : (
                <Mic className="w-4 h-4 text-dark-500 flex-shrink-0" />
              )}
              <span className="capitalize">{info.session_type} interview</span>
            </div>
            <div className="flex items-center gap-3 text-dark-300 text-sm">
              <Globe className="w-4 h-4 text-dark-500 flex-shrink-0" />
              <span>Language: {info.language.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-dark-900 rounded-2xl border border-dark-800 p-6 mb-6">
          <p className="text-white font-medium mb-3">Before you begin:</p>
          <ul className="space-y-2">
            {[
              'Find a quiet, well-lit place',
              'Allow microphone access when prompted',
              info.session_type === 'video' ? 'Allow camera access when prompted' : null,
              'Do not switch tabs during the interview',
              'Speak clearly and at a comfortable pace',
            ]
              .filter(Boolean)
              .map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-dark-300 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
          </ul>
        </div>

        {info.status === 'Completed' ? (
          <div className="text-center text-green-400 font-medium py-4">
            This interview has already been completed.
          </div>
        ) : (
          <button
            onClick={startInterview}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-2xl transition-colors text-lg"
          >
            Start Interview
          </button>
        )}
      </div>
    </div>
  )
}
