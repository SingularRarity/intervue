import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Users, BarChart3, MessageSquare, Building2,
  ToggleLeft, ToggleRight, LogOut, ChevronDown, ChevronUp,
} from 'lucide-react'
import { godAdminApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface PlatformStats {
  total_tenants: number
  active_tenants: number
  total_interviews: number
  total_candidates: number
  new_contacts: number
  tenants_by_plan: { plan: string | null; count: number | null }[]
}

interface TenantRow {
  id: string
  company_name: string
  email: string
  is_active: boolean
  plan_tier: string | null
  sub_status: string | null
  interview_count: number | null
  candidate_count: number | null
  created_at: string
}

interface ContactRow {
  id: string
  name: string
  email: string
  company: string | null
  request_type: string
  plan_interested: string | null
  message: string
  status: string
  created_at: string
  tenant_company: string | null
}

type Tab = 'overview' | 'tenants' | 'contacts'

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white border border-dark-200 rounded-xl p-5">
      <div className="text-dark-400 text-xs uppercase tracking-widest mb-1">{label}</div>
      <div className="text-3xl font-bold text-dark-900 tabular-nums">{value.toLocaleString()}</div>
      {sub && <div className="text-dark-400 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { isGodAdmin, logout } = useAuthStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [expandedContact, setExpandedContact] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isGodAdmin) {
      navigate('/admin/login')
      return
    }
    Promise.all([
      godAdminApi.stats(),
      godAdminApi.listTenants(),
      godAdminApi.listContacts(),
    ])
      .then(([s, t, c]) => {
        setStats(s.data)
        setTenants(t.data)
        setContacts(c.data)
      })
      .finally(() => setLoading(false))
  }, [isGodAdmin, navigate])

  const setPlan = async (tenantId: string, plan: string) => {
    await godAdminApi.setTenantPlan(tenantId, plan)
    setTenants((prev) =>
      prev.map((t) => t.id === tenantId ? { ...t, plan_tier: plan } : t)
    )
  }

  const toggleTenant = async (tenantId: string) => {
    await godAdminApi.toggleTenant(tenantId)
    setTenants((prev) =>
      prev.map((t) => t.id === tenantId ? { ...t, is_active: !t.is_active } : t)
    )
  }

  const resolveContact = async (id: string, status: string) => {
    await godAdminApi.updateContactStatus(id, status)
    setContacts((prev) =>
      prev.map((c) => c.id === id ? { ...c, status } : c)
    )
  }

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'tenants', label: 'Tenants', icon: Building2 },
    { id: 'contacts', label: `Contacts${stats?.new_contacts ? ` (${stats.new_contacts})` : ''}`, icon: MessageSquare },
  ]

  return (
    <div className="flex h-screen bg-canvas">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-[#1E2235] flex flex-col fixed left-0 top-0 h-screen z-50 border-r border-white/10">
        <div className="px-6 pt-8 pb-10">
          <span className="font-display text-[19px] text-white italic tracking-tight leading-none">Intervue</span>
          <p className="text-white/30 text-[10px] uppercase tracking-[0.15em] mt-1">God Admin</p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all text-left ${
                tab === id
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-primary-400/20 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary-400" />
            </div>
            <span className="text-white/60 text-xs">God Admin</span>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-2 py-2 text-white/40 hover:text-white/70 text-xs transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-[220px] overflow-y-auto p-8">
        {loading ? (
          <div className="text-dark-400 text-sm">Loading platform data...</div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && stats && (
              <div>
                <h1 className="text-2xl font-bold text-dark-900 mb-6">Platform Overview</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard label="Total tenants" value={stats.total_tenants} />
                  <StatCard label="Active tenants" value={stats.active_tenants} />
                  <StatCard label="Total interviews" value={stats.total_interviews} />
                  <StatCard label="Candidates" value={stats.total_candidates} />
                </div>

                {stats.new_contacts > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-amber-500 shrink-0" />
                    <span className="text-amber-700 text-sm">
                      <strong>{stats.new_contacts}</strong> new contact request{stats.new_contacts !== 1 ? 's' : ''} waiting.{' '}
                      <button onClick={() => setTab('contacts')} className="underline">View now</button>
                    </span>
                  </div>
                )}

                <div className="bg-white border border-dark-200 rounded-2xl p-6">
                  <h2 className="text-dark-900 font-semibold mb-4">Tenants by plan</h2>
                  <div className="space-y-3">
                    {stats.tenants_by_plan.map((row) => (
                      <div key={row.plan ?? 'null'} className="flex items-center gap-3">
                        <span className="text-dark-700 text-sm w-20 capitalize">{row.plan ?? 'No plan'}</span>
                        <div className="flex-1 h-2 bg-dark-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-400 rounded-full"
                            style={{ width: `${Math.min(((row.count ?? 0) / stats.total_tenants) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-dark-400 text-sm tabular-nums w-8 text-right">{row.count ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tenants */}
            {tab === 'tenants' && (
              <div>
                <h1 className="text-2xl font-bold text-dark-900 mb-6">
                  Tenants <span className="text-dark-400 font-normal text-lg">({tenants.length})</span>
                </h1>
                <div className="bg-white border border-dark-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-200">
                        <th className="text-left px-5 py-3.5 text-dark-400 font-medium">Company</th>
                        <th className="text-left px-5 py-3.5 text-dark-400 font-medium">Plan</th>
                        <th className="text-right px-5 py-3.5 text-dark-400 font-medium">Interviews</th>
                        <th className="text-right px-5 py-3.5 text-dark-400 font-medium">Candidates</th>
                        <th className="text-center px-5 py-3.5 text-dark-400 font-medium">Status</th>
                        <th className="px-5 py-3.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map((t) => (
                        <tr key={t.id} className="border-b border-dark-200 last:border-0 hover:bg-dark-50">
                          <td className="px-5 py-3.5">
                            <div className="text-dark-900 font-medium">{t.company_name}</div>
                            <div className="text-dark-400 text-xs">{t.email}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <select
                              value={t.plan_tier ?? 'free'}
                              onChange={(e) => setPlan(t.id, e.target.value)}
                              className="text-sm bg-transparent border border-dark-200 rounded-lg px-2 py-1 outline-none focus:border-primary-400 cursor-pointer"
                            >
                              {['free', 'starter', 'growth', 'enterprise'].map((p) => (
                                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-3.5 text-right text-dark-700 tabular-nums">
                            {(t.interview_count ?? 0).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right text-dark-700 tabular-nums">
                            {(t.candidate_count ?? 0).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button onClick={() => toggleTenant(t.id)} className="inline-flex items-center">
                              {t.is_active
                                ? <ToggleRight className="w-5 h-5 text-primary-400" />
                                : <ToggleLeft className="w-5 h-5 text-dark-300" />}
                            </button>
                          </td>
                          <td className="px-5 py-3.5">
                            {!t.is_active && (
                              <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full border border-red-200">Disabled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Contacts */}
            {tab === 'contacts' && (
              <div>
                <h1 className="text-2xl font-bold text-dark-900 mb-6">
                  Contact requests <span className="text-dark-400 font-normal text-lg">({contacts.length})</span>
                </h1>
                <div className="space-y-3">
                  {contacts.map((c) => (
                    <div key={c.id} className="bg-white border border-dark-200 rounded-xl overflow-hidden">
                      <div
                        className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-dark-50"
                        onClick={() => setExpandedContact(expandedContact === c.id ? null : c.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-dark-900 font-medium">{c.name}</span>
                            <span className="text-dark-400 text-xs">— {c.email}</span>
                            {c.tenant_company && (
                              <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full border border-primary-200">{c.tenant_company}</span>
                            )}
                          </div>
                          <div className="text-dark-400 text-xs mt-0.5 flex items-center gap-2">
                            <span className="capitalize">{c.request_type.replace('_', ' ')}</span>
                            {c.plan_interested && (
                              <span>· interested in <strong>{c.plan_interested}</strong></span>
                            )}
                            <span>· {new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={c.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => resolveContact(c.id, e.target.value)}
                            className="text-xs bg-transparent border border-dark-200 rounded-lg px-2 py-1 outline-none focus:border-primary-400"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          {expandedContact === c.id
                            ? <ChevronUp className="w-4 h-4 text-dark-400" />
                            : <ChevronDown className="w-4 h-4 text-dark-400" />}
                        </div>
                      </div>
                      {expandedContact === c.id && (
                        <div className="px-6 pb-4 border-t border-dark-200 pt-4">
                          <p className="text-dark-700 text-sm leading-relaxed">{c.message}</p>
                          <a
                            href={`mailto:${c.email}`}
                            className="inline-flex items-center gap-1.5 mt-3 text-primary-500 text-sm hover:text-primary-700 transition-colors"
                          >
                            Reply to {c.name} →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <p className="text-dark-400 text-sm text-center py-12">No contact requests yet.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
