import { useState, useEffect } from 'react'
import { Users, UserPlus, Trash2, Shield, Eye, Briefcase } from 'lucide-react'
import api from '@/lib/api'

interface TeamMember {
  id: string
  email: string
  role: string
  invited_at: string
  accepted_at: string | null
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: Shield,
  recruiter: Briefcase,
  viewer: Eye,
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('recruiter')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    try {
      const res = await api.get('/team')
      setMembers(res.data.members)
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
    try {
      await api.post('/team/invite', { email, role })
      setEmail('')
      await fetchTeam()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  const removeMember = async (id: string) => {
    try {
      await api.delete(`/team/${id}`)
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
          <p className="text-dark-400 text-sm">Invite colleagues to collaborate on interviews</p>
        </div>
      </div>

      {/* Invite Form */}
      <div className="bg-white border border-dark-200 rounded-2xl p-6 mb-6">
        <h2 className="text-dark-900 font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary-400" />
          Invite Member
        </h2>
        <form onSubmit={inviteMember} className="flex gap-3 flex-wrap">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="input-field flex-1 min-w-48"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input-field w-auto"
          >
            <option value="viewer">Viewer</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="btn-primary"
          >
            {inviting ? 'Inviting...' : 'Invite'}
          </button>
        </form>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Members List */}
      <div className="bg-white border border-dark-200 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-200">
              <th className="text-left px-6 py-4 text-dark-400 text-sm font-medium">Member</th>
              <th className="text-left px-6 py-4 text-dark-400 text-sm font-medium">Role</th>
              <th className="text-left px-6 py-4 text-dark-400 text-sm font-medium">Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-dark-500">
                  Loading...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-dark-500">
                  No team members yet. Invite someone above.
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const Icon = ROLE_ICONS[member.role] ?? Users
                return (
                  <tr key={member.id} className="border-b border-dark-200 last:border-0">
                    <td className="px-6 py-4 text-dark-900">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-dark-300 text-sm">
                        <Icon className="w-3.5 h-3.5 text-primary-400" />
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.accepted_at ? (
                        <span className="text-green-400 text-xs">Active</span>
                      ) : (
                        <span className="text-yellow-400 text-xs">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => removeMember(member.id)}
                        className="text-dark-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
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
