import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mic, Video, Clock, Globe, CheckCircle, ArrowRight, Wifi, MicOff } from 'lucide-react'

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
  const [micChecked, setMicChecked] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [micError, setMicError] = useState('')
  const [consent, setConsent] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

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
    // Pass the candidate_token through so InterviewPage can authenticate the WS connection
    // without a JWT (candidate has no account).
    const base =
      info.session_type === 'video'
        ? `/video-interview/${info.session_id}`
        : `/interview/${info.session_id}`
    navigate(`${base}?candidate_token=${encodeURIComponent(token!)}`)
  }

  const runMicCheck = async () => {
    setMicError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      // Show a live level meter for ~3 seconds, then call it good.
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)

      const t0 = Date.now()
      let peak = 0
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        peak = Math.max(peak, avg)
        setMicLevel(avg)
        if (Date.now() - t0 < 3000) {
          requestAnimationFrame(tick)
        } else {
          // Stop tracks — we just wanted to confirm hardware works
          stream.getTracks().forEach((t) => t.stop())
          ctx.close()
          if (peak < 5) {
            setMicError("We didn't pick up any sound. Try speaking — or check your mic permissions.")
          } else {
            setMicChecked(true)
          }
        }
      }
      tick()
    } catch (e: any) {
      setMicError(e.message || 'Could not access microphone. Please grant permission and try again.')
    }
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
            <span className="font-display italic text-white text-lg tracking-tight">Intervue</span>
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

        {/* CTA — multi-step: mic check → consent → ready */}
        {info.status === 'Completed' ? (
          <div className="text-center py-4">
            <span className="inline-flex items-center gap-2 text-primary-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              This interview has already been completed.
            </span>
          </div>
        ) : !micChecked ? (
          <div className="bg-white border border-dark-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-dark-900 mb-1">Step 1 of 2 — Check your microphone</h3>
            <p className="text-[13px] text-dark-500 mb-4">
              Quick 3-second test. Just say "hello" once you click below.
            </p>
            <button
              onClick={runMicCheck}
              className="w-full bg-dark-900 hover:bg-dark-800 text-white h-12 rounded-lg font-medium text-[14px] transition-colors flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Run Mic Check
            </button>
            {micLevel > 0 && (
              <div className="mt-4">
                <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 transition-all" style={{ width: `${Math.min(100, micLevel * 2)}%` }} />
                </div>
                <p className="text-[11px] text-dark-400 mt-2 text-center">Listening...</p>
              </div>
            )}
            {micError && (
              <p className="mt-4 text-[12px] text-red-600 flex items-center gap-2">
                <MicOff className="w-4 h-4" />
                {micError}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white border border-dark-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-dark-900 mb-1 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-500" />
              Mic looks good — Step 2 of 2
            </h3>
            <p className="text-[13px] text-dark-500 mb-4">
              Just one quick consent before we begin.
            </p>
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary-500"
              />
              <span className="text-[13px] text-dark-700 leading-relaxed">
                I understand that <strong>{company}</strong> will record audio of this interview for evaluation purposes, and that AI will be used to score my responses. I can stop at any time.
              </span>
            </label>
            <button
              onClick={startInterview}
              disabled={!consent}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-dark-200 disabled:cursor-not-allowed text-white h-14 rounded-xl font-semibold text-[15px] transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
            >
              I'm Ready — Start Interview
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      <footer className="py-8 px-6 text-center border-t border-dark-200/50">
        <p className="text-[10px] uppercase tracking-widest text-dark-300">© 2026 Intervue by SingularRarityLabs.</p>
        <div className="flex justify-center gap-6 mt-3">
          {['Help', 'Support', 'Privacy'].map((l) => (
            <a key={l} href="#" className="text-[10px] uppercase tracking-widest text-dark-300 hover:text-dark-700 transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
