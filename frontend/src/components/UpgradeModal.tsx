import { useState } from 'react'
import { X, CheckCircle, Zap } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { billingApi } from '@/lib/api'

interface UpgradeModalProps {
  onClose: () => void
  triggeredBy?: string // which feature triggered the upgrade prompt
}

const PLANS = [
  {
    name: 'Starter',
    price: '₹4,999/mo',
    features: ['5 seats', '50 interviews/month', '500 candidates', 'Branding', 'Resume parsing'],
  },
  {
    name: 'Growth',
    price: '₹14,999/mo',
    highlight: true,
    features: ['20 seats', '200 interviews/month', '5,000 candidates', 'ATS integration', 'Advanced analytics', 'Proctoring'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: ['Unlimited seats', 'Unlimited interviews', 'SSO / SAML', 'Dedicated support', 'Custom SLAs'],
  },
]

export default function UpgradeModal({ onClose, triggeredBy }: UpgradeModalProps) {
  const { tenant } = useAuthStore()
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: tenant?.email ?? '',
    company: tenant?.company_name ?? '',
    plan_interested: 'growth',
    message: triggeredBy ? `I'd like to unlock "${triggeredBy}" and upgrade my plan.` : "I'm interested in upgrading my plan.",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await billingApi.contact({
        ...form,
        request_type: 'upgrade',
      })
      setSent(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-dark-200">
          <div>
            <h2 className="text-xl font-semibold text-dark-900">Upgrade your plan</h2>
            <p className="text-dark-400 text-sm mt-0.5">
              {triggeredBy ? `"${triggeredBy}" requires a higher plan` : 'Unlock more power for your team'}
            </p>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan cards */}
        <div className="px-8 py-6 grid grid-cols-3 gap-4">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                p.highlight ? 'border-primary-400 bg-primary-50' : 'border-dark-200 hover:border-dark-400'
              }`}
              onClick={() => setForm((f) => ({ ...f, plan_interested: p.name.toLowerCase() }))}
            >
              {p.highlight && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 mb-2 block">Most popular</span>
              )}
              <div className="text-dark-900 font-semibold">{p.name}</div>
              <div className="text-primary-500 font-bold mt-1 mb-3">{p.price}</div>
              <ul className="space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-dark-400 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-primary-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div className="px-8 pb-8">
          {sent ? (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 text-center">
              <CheckCircle className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-dark-900 font-semibold">Request received!</p>
              <p className="text-dark-400 text-sm mt-1">We'll reach out within 24 hours to get you set up.</p>
            </div>
          ) : (
            <>
              <p className="text-dark-400 text-sm mb-4">No payment upfront — just tell us what you need and we'll get you started.</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input-field"
                    placeholder="Your name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    className="input-field"
                    type="email"
                    placeholder="Email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="What are you hoping to unlock?"
                  required
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {submitting ? 'Sending...' : 'Request upgrade'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
