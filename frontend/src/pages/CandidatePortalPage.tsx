import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mic, Video, Clock, Globe, CheckCircle, ArrowRight, Wifi } from 'lucide-react'

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
      <div className="min-h-screen bg-[#fdf7ff] flex items-center justify-center">
        <p className="text-dark-400 text-sm">Loading your interview...</p>
      </div>
    )
  }

  if (error || !info) {
    return (
      <div className="min-h-screen bg-[#fdf7ff] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 text-lg font-semibold mb-2">Invalid Link</p>
          <p className="text-dark-500 text-sm">{error || 'This interview link is invalid or has expired.'}</p>
        </div>
      </div>
    )
  }

  const company = info.branding.company_display_name ?? info.company_name

  const tips = [
    { icon: Clock, text: `${info.duration_minutes} Minutes Duration — the session closes automatically after the allotted time.` },
    { icon: info.session_type === 'video' ? Video : Mic, text: 'Camera & Mic — ensure you are in a quiet environment with a stable connection.' },
    { icon: Globe, text: `Interview language: ${info.language.toUpperCase()}.` },
  ]

  return (
    <div className="min-h-screen bg-[#fdf7ff] flex flex-col font-sans">
      {/* Top branding bar */}
      <header className="bg-[#0f172a] w-full h-16 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          {info.branding.logo_url ? (
            <img src={info.branding.logo_url} alt={company} className="h-7 object-contain" />
          ) : (
            <span className="font-display italic text-white text-lg tracking-tight">InterviewAI</span>
          )}
          <span className="w-px h-4 bg-white/20" />
          <span className="text-white/50 text-[10px] uppercase tracking-widest">Candidate Portal</span>
        </div>
        <span className="text-white/30 text-xs font-semibold uppercase tracking-widest">{company}</span>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-[600px] mx-auto px-6 pt-12 pb-24">
        {/* Welcome */}
        <section className="mb-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-dark-100 border border-dark-200 flex items-center justify-center">
              {info.session_type === 'video'
                ? <Video className="w-7 h-7 text-dark-700" />
                : <Mic className="w-7 h-7 text-dark-700" />
              }
            </div>
          </div>
          <h1 className="font-display text-[42px] leading-tight text-dark-900 mb-2">
            Welcome to your Interview with {company}
          </h1>
          <p className="text-dark-500 text-[15px]">{info.template_title}</p>
        </section>

        {/* Instructions */}
        <section className="bg-primary-50 border border-primary-200/60 rounded-xl p-6 mb-6">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-dark-700 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary-500" />
            Important Instructions
          </h2>
          <ul className="space-y-4">
            {tips.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex gap-3">
                <Icon className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                <p className="text-sm text-dark-800">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* System status card */}
        <div className="bg-white border border-dark-200 rounded-xl p-5 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-dark-50 border border-dark-200 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-dark-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-dark-400">System Status</p>
              <p className="text-sm font-medium text-dark-900 font-mono">All systems operational</p>
            </div>
          </div>
          <span className="w-3 h-3 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>

        {/* CTA */}
        {info.status === 'Completed' ? (
          <div className="text-center py-4">
            <span className="inline-flex items-center gap-2 text-primary-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              This interview has already been completed.
            </span>
          </div>
        ) : (
          <>
            <button
              onClick={startInterview}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white h-14 rounded-xl font-semibold text-[15px] transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Start Interview
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-[11px] text-dark-400 mt-3">
              By clicking start, you agree to our{' '}
              <a href="#" className="underline">Terms of Service</a>.
            </p>
          </>
        )}
      </main>

      <footer className="py-8 px-6 text-center border-t border-dark-200/50">
        <p className="text-[10px] uppercase tracking-widest text-dark-300">© 2024 InterviewAI Systems. Precision Engineered.</p>
        <div className="flex justify-center gap-6 mt-3">
          {['Help', 'Support', 'Privacy'].map((l) => (
            <a key={l} href="#" className="text-[10px] uppercase tracking-widest text-dark-300 hover:text-dark-700 transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
