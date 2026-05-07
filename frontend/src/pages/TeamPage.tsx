import { useState, useEffect } from 'react'
import { Users, UserPlus, Trash2, Shield, Eye, Briefcase, Mic, ChevronDown, Copy, Check } from 'lucide-react'
import { teamApi } from '@/lib/api'
import { useAuthStore, type TenantRole } from '@/lib/store'
import { ROLE_LABELS } from '@/lib/permissions'

interface TeamMember {
  id: string
  email: string
  full_name: string | null
  role: TenantRole
  is_active: boolean
  accepted_at: string | null
  created_at: string
}

interface InviteResponse {
  id: string
  email: string
  role: TenantRole
  invite_token: string
}

const ROLE_ICONS: Record<TenantRole, React.ElementType> = {
  tenant_admin: Shield,
  manager: Briefcase,
  interviewer: Mic,
  viewer: Eye,
}

const ROLE_OPTIONS: { value: TenantRole; label: string }[] = [
  { value: 'viewer', label: 'Viewer — read-only access' },
  { value: 'interviewer', label: 'Interviewer — run sessions' },
  { value: 'manager', label: 'Manager — full hiring access' },
  { value: 'tenant_admin', label: 'Admin — manage everything' },
]

export default function TeamPage() {
  const { role: myRole, isGodAdmin } = useAuthStore()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [inviteRole, setInviteRole] = useState<TenantRole>('interviewer')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  const canManage = isGodAdmin || myRole === 'tenant_admin' || myRole === 'manager'

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    try {
      const res = await teamApi.list()
      setMembers(res.data)
    } catch {
      setError('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setInviting(true)
    setError('')
    setInviteLink(null)
    try {
      const res = await teamApi.invite({ email, full_name: fullName || undefined, role: inviteRole })
      const data: InviteResponse = res.data
      const link = `${window.location.origin}/accept-invite?token=${data.invite_token}`
      setInviteLink(link)
      setEmail('')
      setFullName('')
      await fetchTeam()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  const copyLink = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const changeRole = async (id: string, newRole: TenantRole) => {
    setUpdatingRole(id)
    try {
      await teamApi.updateRole(id, newRole)
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role: newRole } : m))
    } catch {
      setError('Failed to update role')
    } finally {
      setUpdatingRole(null)
    }
  }

  const removeMember = async (id: string) => {
    try {
      await teamApi.remove(id)
      setMembers((prev) => prev.filter((m) => m.id !== id))
    } catch {
      setError('Failed to remove member')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-7 h-7 text-primary-400" />
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Team</h1>
          <p className="text-dark-400 text-sm">Manage roles and invite colleagues</p>
        </div>
      </div>

      {/* Invite Form */}
      {canManage && (
        <div className="bg-white border border-dark-200 rounded-2xl p-6 mb-6">
          <h2 className="text-dark-900 font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary-400" />
            Invite member
          </h2>
          <form onSubmit={inviteMember} className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="input-field flex-1 min-w-48"
                required
              />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name (optional)"
                className="input-field flex-1 min-w-36"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TenantRole)}
                className="input-field w-auto"
              >
                {ROLE_OPTIONS.filter((r) =>
                  // Managers cannot invite admins
                  myRole === 'tenant_admin' || isGodAdmin || r.value !== 'tenant_admin'
                ).map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button type="submit" disabled={inviting} className="btn-primary shrink-0">
                {inviting ? 'Inviting...' : 'Send invite'}
              </button>
            </div>
          </form>

          {/* Invite link display */}
          {inviteLink && (
            <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center gap-3">
              <div className="flex-1 text-xs text-primary-700 font-mono truncate">{inviteLink}</div>
              <button
                onClick={copyLink}
                className="shrink-0 text-primary-600 hover:text-primary-800 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}

          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white border border-dark-200 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-200">
              <th className="text-left px-6 py-4 text-dark-400 text-sm font-medium">Member</th>
              <th className="text-left px-6 py-4 text-dark-400 text-sm font-medium">Role</th>
              <th className="text-left px-6 py-4 text-dark-400 text-sm font-medium">Status</th>
              {canManage && <th className="px-6 py-4" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 4 : 3} className="text-center py-12 text-dark-500">Loading...</td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 4 : 3} className="text-center py-12 text-dark-500">
                  No team members yet. Invite someone above.
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const Icon = ROLE_ICONS[member.role] ?? Users
                return (
                  <tr key={member.id} className="border-b border-dark-200 last:border-0">
                    <td className="px-6 py-4">
                      <div className="text-dark-900 font-medium">{member.full_name || member.email}</div>
                      {member.full_name && <div className="text-dark-400 text-xs">{member.email}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {canManage ? (
                        <div className="relative inline-flex items-center gap-1.5">
                          <select
                            value={member.role}
                            disabled={updatingRole === member.id}
                            onChange={(e) => changeRole(member.id, e.target.value as TenantRole)}
                            className="text-sm text-dark-700 bg-transparent border-none outline-none cursor-pointer pr-5 appearance-none"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r.value} value={r.value}>{ROLE_LABELS[r.value]}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-dark-400 absolute right-0 pointer-events-none" />
                        </div>
                      ) : (
                        <span className="flex items-center gap-1.5 text-dark-500 text-sm">
                          <Icon className="w-3.5 h-3.5 text-primary-400" />
                          {ROLE_LABELS[member.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!member.is_active ? (
                        <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-200">Invite pending</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full border border-primary-200">Active</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => removeMember(member.id)}
                          className="text-dark-400 hover:text-red-400 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
