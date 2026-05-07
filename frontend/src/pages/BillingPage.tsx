import { useState, useEffect } from 'react'
import { CreditCard, Zap, Users, BarChart3, CheckCircle } from 'lucide-react'
import { billingApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { PLAN_LABELS } from '@/lib/permissions'
import UpgradeModal from '@/components/UpgradeModal'

interface UsageData {
  interviews_this_month: number
  total_candidates: number
  active_seats: number
  plan_tier: string
  limits: {
    max_seats: number
    max_interviews_per_month: number
    max_candidates: number
  }
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0
  const warn = pct > 80
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-dark-700 font-medium">{label}</span>
        <span className="text-dark-400 tabular-nums">{used.toLocaleString()} / {max.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${warn ? 'bg-amber-400' : 'bg-primary-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function BillingPage() {
  const { plan, tenant } = useAuthStore()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    billingApi.getUsage()
      .then((r) => setUsage(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const planLabel = PLAN_LABELS[plan] ?? plan

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-7 h-7 text-primary-400" />
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Plan & Usage</h1>
          <p className="text-dark-400 text-sm">Your current plan and resource usage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current plan card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-dark-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-dark-400">Current plan</span>
            </div>
            <div className="text-3xl font-bold text-dark-900 mb-1">{planLabel}</div>
            <div className="text-dark-400 text-sm mb-6">{tenant?.company_name}</div>

            {plan !== 'enterprise' && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Upgrade plan
              </button>
            )}
            {plan === 'enterprise' && (
              <div className="text-center text-primary-500 text-sm font-medium">
                <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                Enterprise — all features unlocked
              </div>
            )}
          </div>

          {/* Plan perks */}
          <div className="bg-white border border-dark-200 rounded-2xl p-6 mt-4">
            <h3 className="text-sm font-semibold text-dark-900 mb-4">What's included</h3>
            {usage && (
              <ul className="space-y-2 text-sm text-dark-500">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                  {usage.limits.max_seats} team seats
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                  {usage.limits.max_interviews_per_month} interviews / month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                  {usage.limits.max_candidates.toLocaleString()} candidates
                </li>
                {(plan === 'starter' || plan === 'growth' || plan === 'enterprise') && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                    Custom branding
                  </li>
                )}
                {(plan === 'growth' || plan === 'enterprise') && (
                  <>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                      ATS integration
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                      Advanced analytics
                    </li>
                  </>
                )}
                {plan === 'enterprise' && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                    SSO / SAML
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Usage meters */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-dark-200 rounded-2xl p-6">
            <h2 className="text-dark-900 font-semibold mb-6">This month's usage</h2>

            {loading ? (
              <div className="space-y-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-dark-100 rounded" />
                ))}
              </div>
            ) : usage ? (
              <div className="space-y-6">
                <UsageBar
                  label="Interviews"
                  used={usage.interviews_this_month}
                  max={usage.limits.max_interviews_per_month}
                />
                <UsageBar
                  label="Candidates"
                  used={usage.total_candidates}
                  max={usage.limits.max_candidates}
                />
                <UsageBar
                  label="Active seats"
                  used={usage.active_seats}
                  max={usage.limits.max_seats}
                />
              </div>
            ) : (
              <p className="text-dark-400 text-sm">Could not load usage data.</p>
            )}
          </div>

          {/* Quick stats */}
          {usage && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { label: 'Interviews run', value: usage.interviews_this_month, icon: BarChart3 },
                { label: 'Total candidates', value: usage.total_candidates, icon: Users },
                { label: 'Active seats', value: usage.active_seats, icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white border border-dark-200 rounded-xl p-4">
                  <Icon className="w-4 h-4 text-primary-400 mb-2" />
                  <div className="text-2xl font-bold text-dark-900 tabular-nums">{value.toLocaleString()}</div>
                  <div className="text-dark-400 text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
