import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { tenantApi, billingApi } from '@/lib/api'
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
      // Set auth first so the next API call carries the bearer token (+ refresh token)
      setAuth(res.data.token, res.data.tenant, 'tenant_admin', 'free', null, res.data.refresh_token)
      // Fetch the actual plan tier — store defaults to 'free'
      try {
        const planRes = await billingApi.getPlan()
        const tier = planRes.data?.plan_tier ?? planRes.data?.tier ?? 'free'
        // refreshToken omitted — setAuth preserves the existing one
        setAuth(res.data.token, res.data.tenant, 'tenant_admin', tier)
      } catch {
        // Non-fatal: leave plan as 'free'
      }
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
      <section className="hidden lg:flex flex-col justify-between w-[52%] bg-[#0a0f1e] p-14 relative overflow-hidden">
        {/* Logo */}
        <div className="z-10">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display italic text-white text-[18px] tracking-tight">Intervue</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary-500/60 border border-primary-500/20 px-1.5 py-0.5 rounded">Alpha</span>
          </Link>
        </div>

        {/* Quote + product preview */}
        <div className="z-10 flex flex-col gap-10 max-w-lg">
          <div>
            <blockquote className="font-display text-white text-[38px] leading-[1.15] tracking-tight mb-5">
              "Objective scoring changed how we evaluate candidates. No more gut-feel decisions."
            </blockquote>
            <p className="text-primary-400 text-[11px] font-bold uppercase tracking-[0.15em]">Head of Talent · Razorpay</p>
          </div>

          {/* Mini product mockup */}
          <div className="border border-white/8 bg-white/4 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => <div key={i} className="w-2 h-2 rounded-full bg-white/15" />)}
              </div>
              <span className="text-white/20 text-[9px] uppercase tracking-widest font-mono ml-1">intervue · scorecard</span>
            </div>
            <div className="flex items-end gap-0.5 h-14 mb-4">
              {[40, 55, 70, 85, 65, 90, 75, 95, 80, 68].map((h, i) => (
                <div key={i} className="flex-1 bg-primary-500/25 rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{ l: 'Technical', v: '87' }, { l: 'Communication', v: '91' }, { l: 'Overall', v: '89' }].map((s) => (
                <div key={s.l} className="bg-white/5 border border-white/8 rounded-md p-2 text-center">
                  <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1">{s.l}</p>
                  <p className="text-white font-semibold text-[16px] font-mono">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/20 text-[11px] uppercase tracking-[0.2em]">Structured hiring for growing teams.</p>
        </div>

        {/* Footer */}
        <div className="z-10">
          <a
            href="https://singularraritylabs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/20 hover:text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium transition-colors"
          >
            A SingularRarity Labs product
          </a>
        </div>

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-primary-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-purple-900/15 rounded-full blur-[100px]" />
        </div>
      </section>

      {/* Right — form panel */}
      <section className="w-full lg:w-[48%] flex items-center justify-center bg-white px-8 py-12 border-l border-dark-100">
        <div className="w-full max-w-[400px] flex flex-col gap-8">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Link to="/" className="font-display italic text-dark-900 text-[18px] tracking-tight">
              Intervue
            </Link>
          </div>

          <div>
            <h1 className="font-display text-[40px] text-dark-900 leading-tight mb-1.5 tracking-tight">Welcome back</h1>
            <p className="text-dark-400 text-[14px]">Sign in to your workspace to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-dark-400 mb-1.5">
                Work Email
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
                <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-dark-400">
                  Password
                </label>
                <Link to="/reset-password" className="text-[11px] text-primary-500 hover:text-primary-600 font-medium transition-colors">
                  Forgot password?
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
              className="w-full h-11 bg-[#0a0f1e] hover:bg-dark-800 text-white text-[13px] font-semibold rounded-md transition-all active:scale-[0.99] mt-1 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[11px] text-dark-400">or continue with</span>
              </div>
            </div>

            {/* Google OAuth */}
            <a
              href="/api/v1/oauth/google"
              className="flex items-center justify-center gap-3 h-11 border border-dark-200 bg-white hover:bg-dark-50 rounded-md text-[13px] font-medium text-dark-700 transition-colors w-full shadow-sm"
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

          <div className="pt-4 border-t border-dark-100">
            <p className="text-[13px] text-dark-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-dark-900 font-semibold hover:text-primary-600 transition-colors">
                Start free trial
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
