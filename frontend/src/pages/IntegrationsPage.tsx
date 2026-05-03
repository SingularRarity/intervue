import { useState, useEffect } from 'react'
import { Plug, Link2, Shield, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

interface AtsConfig {
  greenhouse_webhook: string
  lever_webhook: string
}

interface SsoConfig {
  provider: string
  client_id: string
  saml_metadata_url: string
  enabled: boolean
}

export default function IntegrationsPage() {
  const [ats, setAts] = useState<AtsConfig>({ greenhouse_webhook: '', lever_webhook: '' })
  const [sso, setSso] = useState<SsoConfig>({
    provider: 'google',
    client_id: '',
    saml_metadata_url: '',
    enabled: false,
  })
  const [atsSaved, setAtsSaved] = useState(false)
  const [ssoSaved, setSsoSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/integrations/ats'), api.get('/integrations/sso')])
      .then(([atsRes, ssoRes]) => {
        const a = atsRes.data.ats_config
        const s = ssoRes.data.sso_config
        if (a) setAts({ greenhouse_webhook: a.greenhouse_webhook ?? '', lever_webhook: a.lever_webhook ?? '' })
        if (s) setSso({ provider: s.provider ?? 'google', client_id: s.client_id ?? '', saml_metadata_url: s.saml_metadata_url ?? '', enabled: s.enabled ?? false })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveAts = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.put('/integrations/ats', {
      greenhouse_webhook: ats.greenhouse_webhook || null,
      lever_webhook: ats.lever_webhook || null,
    })
    setAtsSaved(true)
    setTimeout(() => setAtsSaved(false), 3000)
  }

  const saveSso = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.put('/integrations/sso', {
      provider: sso.provider,
      client_id: sso.client_id || null,
      saml_metadata_url: sso.saml_metadata_url || null,
      enabled: sso.enabled,
    })
    setSsoSaved(true)
    setTimeout(() => setSsoSaved(false), 3000)
  }

  if (loading) return <div className="text-dark-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Plug className="w-7 h-7 text-primary-400" />
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Integrations</h1>
          <p className="text-dark-400 text-sm">Connect your ATS and configure Enterprise SSO</p>
        </div>
      </div>

      {/* ATS Section */}
      <div className="bg-white border border-dark-200 rounded-2xl p-6 mb-6">
        <h2 className="text-dark-900 font-semibold mb-1 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary-400" />
          ATS Integration
        </h2>
        <p className="text-dark-400 text-sm mb-5">
          Push completed interview results to your ATS via webhook.
        </p>
        <form onSubmit={saveAts} className="space-y-4">
          <div>
            <label className="block text-dark-500 text-sm mb-1.5">
              Greenhouse Webhook URL
            </label>
            <input
              type="url"
              value={ats.greenhouse_webhook}
              onChange={(e) => setAts({ ...ats, greenhouse_webhook: e.target.value })}
              placeholder="https://hooks.greenhouse.io/..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-dark-500 text-sm mb-1.5">
              Lever Webhook URL
            </label>
            <input
              type="url"
              value={ats.lever_webhook}
              onChange={(e) => setAts({ ...ats, lever_webhook: e.target.value })}
              placeholder="https://api.lever.co/v1/..."
              className="input-field"
            />
          </div>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
          >
            {atsSaved && <CheckCircle className="w-4 h-4" />}
            {atsSaved ? 'Saved!' : 'Save ATS Config'}
          </button>
        </form>
      </div>

      {/* SSO Section */}
      <div className="bg-white border border-dark-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-dark-900 font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-400" />
            Enterprise SSO
          </h2>
          <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full">
            Enterprise
          </span>
        </div>
        <p className="text-dark-400 text-sm mb-5">
          Allow your team to sign in with your identity provider.
        </p>
        <form onSubmit={saveSso} className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="sso-enabled"
              checked={sso.enabled}
              onChange={(e) => setSso({ ...sso, enabled: e.target.checked })}
              className="w-4 h-4 accent-primary-600"
            />
            <label htmlFor="sso-enabled" className="text-dark-600 text-sm">
              Enable SSO
            </label>
          </div>
          <div>
            <label className="block text-dark-500 text-sm mb-1.5">Provider</label>
            <select
              value={sso.provider}
              onChange={(e) => setSso({ ...sso, provider: e.target.value })}
              className="input-field"
            >
              <option value="google">Google Workspace</option>
              <option value="github">GitHub</option>
              <option value="saml">SAML 2.0</option>
            </select>
          </div>
          {sso.provider !== 'saml' && (
            <div>
              <label className="block text-dark-500 text-sm mb-1.5">OAuth Client ID</label>
              <input
                type="text"
                value={sso.client_id}
                onChange={(e) => setSso({ ...sso, client_id: e.target.value })}
                placeholder="your-client-id"
                className="input-field"
              />
            </div>
          )}
          {sso.provider === 'saml' && (
            <div>
              <label className="block text-dark-500 text-sm mb-1.5">SAML Metadata URL</label>
              <input
                type="url"
                value={sso.saml_metadata_url}
                onChange={(e) => setSso({ ...sso, saml_metadata_url: e.target.value })}
                placeholder="https://your-idp.com/metadata"
                className="input-field"
              />
            </div>
          )}
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
          >
            {ssoSaved && <CheckCircle className="w-4 h-4" />}
            {ssoSaved ? 'Saved!' : 'Save SSO Config'}
          </button>
        </form>
      </div>
    </div>
  )
}
