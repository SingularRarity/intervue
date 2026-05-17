import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { tenantApi } from '@/lib/api'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refresh_token')
    const error = searchParams.get('error')

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`)
      return
    }

    if (!token) {
      navigate('/login')
      return
    }

    // Store token first so the API call is authenticated, then fetch tenant
    const tempStore = useAuthStore.getState()
    tempStore.setAuth(token, { id: '', company_name: '', email: '', is_active: true, has_claude_key: false, has_sarvam_key: false }, 'tenant_admin', 'free', null, refreshToken)

    tenantApi
      .me()
      .then((res) => {
        setAuth(token, res.data, 'tenant_admin', 'free', null, refreshToken)
        navigate('/dashboard')
      })
      .catch(() => {
        navigate('/login?error=Failed+to+load+account')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#1E2235] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-3" />
        <p className="text-dark-400 text-sm">Signing you in...</p>
      </div>
    </div>
  )
}
