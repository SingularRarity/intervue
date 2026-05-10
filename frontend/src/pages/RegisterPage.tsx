import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { tenantApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({
    company_name: '',
    email: '',
    password: '',
    website: '',
    industry: '',
    company_size: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await tenantApi.register(form)
      setAuth(res.data.token, res.data.tenant)
      toast.success('Account created successfully!')
      navigate('/onboarding')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal nav */}
      <nav className="px-8 py-4 border-b border-dark-100 bg-white flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display italic text-dark-900 text-[17px] tracking-tight">Intervue</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary-500/70 border border-primary-500/30 px-1.5 py-0.5 rounded">Alpha</span>
        </Link>
        <Link to="/login" className="text-[13px] text-dark-500 hover:text-dark-900 font-medium transition-colors">
          Already have an account? <span className="text-primary-600">Sign in</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#f8f9fb]">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="font-display text-[36px] text-dark-900 mb-2 tracking-tight">Start your free trial</h1>
            <p className="text-dark-400 text-[14px]">15 days full access · No credit card required</p>
          </div>

          {/* Google OAuth shortcut */}
          <a
            href="/api/v1/oauth/google"
            className="flex items-center justify-center gap-3 w-full h-11 border border-dark-200 bg-white hover:bg-dark-50 rounded-md text-[13px] font-medium text-dark-700 transition-colors mb-4 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </a>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#f8f9fb] px-3 text-[11px] text-dark-400">or sign up with email</span>
            </div>
          </div>

          <div className="bg-white border border-dark-200 rounded-xl p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="input-field"
                  placeholder="Acme Technologies"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="hr@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field pr-12"
                    placeholder="Min 8 characters"
                    minLength={8}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 mb-1.5">Industry</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="EdTech">EdTech</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 mb-1.5">Company Size</label>
                  <select
                    value={form.company_size}
                    onChange={(e) => setForm({ ...form, company_size: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 mb-1.5">
                  Website <span className="text-dark-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="input-field"
                  placeholder="https://company.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="text-center text-dark-400 text-[13px] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-dark-900 font-semibold hover:text-primary-600 transition-colors">
              Sign in
            </Link>
          </p>

          <p className="text-center text-dark-300 text-[11px] mt-4">
            A product by{' '}
            <a
              href="https://singularraritylabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-400 hover:text-dark-700 transition-colors"
            >
              SingularRarity Labs
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
