import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { tenantApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await tenantApi.login({ email, password })
      setAuth(res.data.token, res.data.tenant)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex h-screen w-full overflow-hidden">
      {/* Left — dark brand panel (hidden on mobile) */}
      <section className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0f172a] p-12 relative overflow-hidden">
        {/* Logo */}
        <div className="z-10">
          <Link to="/" className="font-display italic text-white text-xl tracking-tight">
            Intervue
          </Link>
        </div>

        {/* Quote + product preview */}
        <div className="z-10 flex flex-col gap-10 max-w-lg">
          <blockquote className="font-display italic text-white text-[40px] leading-tight">
            "Precision is the only metric that matters in high-stakes hiring."
          </blockquote>
          <div>
            <p className="text-primary-400 text-xs font-bold uppercase tracking-widest">Director of Talent @ NexCore</p>
            <p className="text-white/30 text-xs mt-1 font-mono">Scale 2024 Operations</p>
          </div>

          {/* Mini product mockup card */}
          <div className="border border-white/10 bg-white/5 rounded-xl p-4 backdrop-blur-sm shadow-2xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <div className="w-2 h-2 rounded-full bg-white/20" />
              </div>
              <span className="text-white/30 text-[10px] uppercase tracking-widest font-mono">Score Calibration v2.4</span>
            </div>
            {/* Mini bar chart */}
            <div className="flex items-end gap-1 h-16 mt-2">
              {[40, 55, 70, 85, 65, 90, 75, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary-500/30 rounded-t-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-primary-400 text-[10px] font-bold uppercase tracking-wider">Real-time Analysis</span>
              <span className="text-white text-xs font-mono">Match: 98%</span>
            </div>
          </div>
        </div>

        {/* Footer tagline */}
        <div className="z-10">
          <p className="text-white/20 text-[10px] uppercase tracking-[0.2em]">Serious software for serious hiring.</p>
        </div>

        {/* Background glow */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-900/20 rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Right — form panel */}
      <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8f7f5] px-8 py-12">
        <div className="w-full max-w-[420px] flex flex-col gap-10">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Link to="/" className="font-display italic text-dark-900 text-xl tracking-tight">
              Intervue
            </Link>
          </div>

          <div>
            <h1 className="font-display text-[48px] text-dark-900 leading-tight mb-2">Welcome back</h1>
            <p className="text-dark-500 text-sm">Enter your credentials to access the workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-dark-400 mb-1.5">
                Corporate Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="name@company.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-dark-400">
                  Password
                </label>
                <Link to="/reset-password" className="text-[11px] text-dark-400 hover:text-dark-700 font-medium">
                  Recovery options
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0f172a] hover:bg-dark-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all active:scale-[0.98] mt-1 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authenticate Access'}
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#f8f7f5] px-3 text-[10px] uppercase tracking-widest text-dark-400">Identity Providers</span>
              </div>
            </div>

            {/* Google OAuth */}
            <a
              href="/api/v1/oauth/google"
              className="flex items-center justify-center gap-3 h-10 border border-dark-200 bg-white hover:bg-dark-50 rounded-lg text-[11px] font-bold uppercase tracking-wide text-dark-600 transition-colors w-full"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </a>
          </form>

          <div className="pt-6 border-t border-dark-200">
            <p className="text-[11px] text-dark-400 leading-relaxed">
              Don't have an account?{' '}
              <Link to="/register" className="text-dark-900 font-semibold underline decoration-primary-500 underline-offset-4">
                Get Started
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
