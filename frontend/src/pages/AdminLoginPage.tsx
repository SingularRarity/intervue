import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { godAdminApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { setGodAdmin } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await godAdminApi.login({ email, password })
      const { token, admin } = res.data
      setGodAdmin(token, admin.id, admin.email)
      navigate('/admin')
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1E2235] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary-400" />
          </div>
          <h1 className="text-white text-2xl font-bold">Admin Console</h1>
          <p className="text-white/40 text-sm mt-1">Platform administration access</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-primary-400 transition-colors placeholder:text-white/30"
                placeholder="admin@intervue.in"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-primary-400 transition-colors placeholder:text-white/30"
                placeholder="••••••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in to Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
