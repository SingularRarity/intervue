import { useState, useEffect } from 'react'
import { Plug, Link2, Shield, CheckCircle, Info } from 'lucide-react'
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark-900 tracking-tight">Integrations</h1>
        <p className="text-dark-400 mt-0.5 text-sm">Connect Intervue to your existing HR stack</p>
      </div>

      {/* ATS Section */}
      <div className="card">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-dark-900 font-semibold flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary-400" />
            ATS Webhook
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
            Growth+
          </span>
        </div>
        <p className="text-dark-400 text-sm mb-4">
          When an interview session is completed, Intervue will POST the candidate's score, recommendation, and full analysis to your ATS webhook.
        </p>

        {/* How it works note */}
        <div className="flex gap-2.5 p-3 bg-primary-50 border border-primary-100 rounded-xl mb-5">
          <Info className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
          <div className="text-[12px] text-primary-700 leading-relaxed">
            <strong>How it works:</strong> Save your webhook URL below. After each interview session is complete and results are reviewed, use the API endpoint <code className="bg-primary-100 px-1 rounded">POST /api/v1/sessions/:id/ats-push</code> to trigger the push. Native in-app push button coming in the next release.
          </div>
        </div>

        <form onSubmit={saveAts} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">
              Greenhouse Webhook URL
            </label>
            <input
              type="url"
              value={ats.greenhouse_webhook}
              onChange={(e) => setAts({ ...ats, greenhouse_webhook: e.target.value })}
              placeholder="https://hooks.greenhouse.io/applicant_sources/..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">
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
          <button type="submit" className="btn-primary flex items-center gap-2">
            {atsSaved && <CheckCircle className="w-4 h-4" />}
            {atsSaved ? 'Saved!' : 'Save Webhook Config'}
          </button>
        </form>
      </div>

      {/* SSO Section */}
      <div className="card">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-dark-900 font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-400" />
            Enterprise SSO
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full">
            Enterprise
          </span>
        </div>
        <p className="text-dark-400 text-sm mb-5">
          Allow your team to sign in with your identity provider (Google Workspace, GitHub, or SAML 2.0).
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
            <label htmlFor="sso-enabled" className="text-dark-600 text-sm">Enable SSO for this workspace</label>
          </div>
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Provider</label>
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
              <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">OAuth Client ID</label>
              <input
                type="text"
                value={sso.client_id}
                onChange={(e) => setSso({ ...sso, client_id: e.target.value })}
                placeholder="your-client-id.apps.googleusercontent.com"
                className="input-field"
              />
            </div>
          )}
          {sso.provider === 'saml' && (
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">SAML Metadata URL</label>
              <input
                type="url"
                value={sso.saml_metadata_url}
                onChange={(e) => setSso({ ...sso, saml_metadata_url: e.target.value })}
                placeholder="https://your-idp.com/metadata"
                className="input-field"
              />
            </div>
          )}
          <button type="submit" className="btn-primary flex items-center gap-2">
            {ssoSaved && <CheckCircle className="w-4 h-4" />}
            {ssoSaved ? 'Saved!' : 'Save SSO Config'}
          </button>
        </form>
      </div>

      {/* Plug icon for empty state feel */}
      <div className="flex items-center gap-3 text-dark-300 text-sm pt-2">
        <Plug className="w-4 h-4" />
        <span>More integrations (Slack, Workday, BambooHR) coming soon.</span>
      </div>
    </div>
  )
}
