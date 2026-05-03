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
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Minimal nav */}
      <nav className="px-8 py-5 border-b border-dark-200 bg-white">
        <Link to="/" className="font-display text-[17px] text-dark-900 leading-none">
          Interview<span className="text-primary-500">AI</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="font-display text-3xl text-dark-900 mb-1.5">Create your account</h1>
            <p className="text-dark-500 text-[15px]">Start conducting AI interviews in minutes</p>
          </div>

          <div className="bg-white border border-dark-200 rounded-xl p-8">
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

          <p className="text-center text-dark-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
