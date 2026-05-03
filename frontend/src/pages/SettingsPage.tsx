import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Key, Shield, Building2, Eye, EyeOff, Loader2, Save, CheckCircle } from 'lucide-react'
import { tenantApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { tenant, setAuth } = useAuthStore()
  const queryClient = useQueryClient()

  const [claudeKey, setClaudeKey] = useState('')
  const [sarvamKey, setSarvamKey] = useState('')
  const [showClaude, setShowClaude] = useState(false)
  const [showSarvam, setShowSarvam] = useState(false)

  const { data: currentTenant, isLoading } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: () => tenantApi.me().then(r => r.data),
  })

  const updateKeysMutation = useMutation({
    mutationFn: (data: any) => tenantApi.updateKeys(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] })
      toast.success('API keys updated successfully')
      setClaudeKey('')
      setSarvamKey('')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update keys'),
  })

  const handleSaveKeys = () => {
    const data: any = {}
    if (claudeKey.trim()) data.claude_api_key = claudeKey.trim()
    if (sarvamKey.trim()) data.sarvam_api_key = sarvamKey.trim()

    if (Object.keys(data).length === 0) {
      toast.error('Please enter at least one API key')
      return
    }

    updateKeysMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-dark-900">Settings</h1>
        <p className="text-dark-400 mt-1">Manage your account and API configurations</p>
      </div>

      {/* Company Info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-600/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-900">Company Information</h2>
            <p className="text-sm text-dark-500">Your organization details</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">Company Name</label>
            <p className="text-dark-900 font-medium">{currentTenant?.company_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">Email</label>
            <p className="text-dark-900 font-medium">{currentTenant?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">Industry</label>
            <p className="text-dark-900 font-medium">{currentTenant?.industry || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">Company Size</label>
            <p className="text-dark-900 font-medium">{currentTenant?.company_size || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-600/10 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-900">API Keys</h2>
            <p className="text-sm text-dark-500">Configure your AI service credentials</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Claude Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-dark-300">Anthropic Claude API Key</label>
              {currentTenant?.has_claude_key && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle className="w-3 h-3" />
                  Configured
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showClaude ? 'text' : 'password'}
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                className="input-field pr-12"
                placeholder={currentTenant?.has_claude_key ? '••••••••••••••••' : 'Enter your Claude API key'}
              />
              <button
                type="button"
                onClick={() => setShowClaude(!showClaude)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
              >
                {showClaude ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-dark-500 mt-1">
              Get your key from{' '}
              <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                console.anthropic.com
              </a>
            </p>
          </div>

          {/* Sarvam Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-dark-300">Sarvam AI API Key</label>
              {currentTenant?.has_sarvam_key && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle className="w-3 h-3" />
                  Configured
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showSarvam ? 'text' : 'password'}
                value={sarvamKey}
                onChange={(e) => setSarvamKey(e.target.value)}
                className="input-field pr-12"
                placeholder={currentTenant?.has_sarvam_key ? '••••••••••••••••' : 'Enter your Sarvam API key'}
              />
              <button
                type="button"
                onClick={() => setShowSarvam(!showSarvam)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
              >
                {showSarvam ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-dark-500 mt-1">
              Get your key from{' '}
              <a href="https://dashboard.sarvam.ai/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                dashboard.sarvam.ai
              </a>
            </p>
          </div>

          <button
            onClick={handleSaveKeys}
            disabled={updateKeysMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {updateKeysMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save API Keys
          </button>
        </div>
      </div>

      {/* Security Note */}
      <div className="card border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-400 mb-1">Security Note</h3>
            <p className="text-sm text-dark-400">
              Your API keys are encrypted and stored securely. Each tenant has complete data isolation. 
              We never use your keys for any purpose other than conducting interviews for your candidates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
