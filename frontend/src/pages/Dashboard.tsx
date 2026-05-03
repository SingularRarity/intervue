import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Mic, Users, FileText, TrendingUp, TrendingDown, Clock,
  ArrowRight, Award, CheckCircle, XCircle, Loader2,
  Filter, Download, MoreVertical,
} from 'lucide-react'
import { analyticsApi, interviewApi } from '@/lib/api'
import { formatDate, getScoreColor } from '@/lib/utils'

function CandidateAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-red-100 text-red-700',
    'bg-blue-100 text-blue-700',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Completed:  'bg-primary-50 text-primary-700 border border-primary-100',
    Hired:      'bg-primary-50 text-primary-700 border border-primary-100',
    Offered:    'bg-primary-50 text-primary-700 border border-primary-100',
    InProgress: 'bg-dark-100 text-dark-600 border border-dark-200',
    Scheduled:  'bg-amber-50 text-amber-700 border border-amber-100',
    Rejected:   'bg-red-50 text-red-700 border border-red-100',
  }
  const cls = map[status] ?? 'bg-dark-100 text-dark-600 border border-dark-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsApi.getDashboard().then(r => r.data),
  })

  const { data: _sessions } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: () => interviewApi.getCandidates().then(r => r.data),
  })

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900 tracking-tight">Active Campaigns</h1>
          <p className="text-dark-400 mt-0.5 text-sm">Your talent pipeline at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/templates" className="btn-secondary">
            <FileText className="w-4 h-4" />
            Templates
          </Link>
          <Link to="/candidates" className="btn-primary">
            <Mic className="w-4 h-4" />
            New Interview
          </Link>
        </div>
      </div>

      {/* Metrics bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-dark-200 rounded-xl p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 mb-1">Total Active</p>
          <p className="text-4xl font-semibold text-dark-900 tracking-tight mt-2">{stats?.total_interviews ?? 0}</p>
          <div className="mt-2 flex items-center gap-1 text-primary-600 text-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            12% from last month
          </div>
        </div>

        <div className="bg-white border border-dark-200 rounded-xl p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 mb-1">Avg. AI Score</p>
          <p className="text-4xl font-semibold text-dark-900 tracking-tight mt-2">
            {stats?.average_score ? stats.average_score.toFixed(1) : '0'}
            <span className="text-base text-dark-400 font-normal">/100</span>
          </p>
          <div className="mt-2 flex items-center gap-1 text-dark-400 text-xs">
            <Award className="w-3.5 h-3.5" />
            Sector benchmark: 76
          </div>
        </div>

        <div className="bg-white border border-dark-200 rounded-xl p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 mb-1">Pending Review</p>
          <p className="text-4xl font-semibold text-dark-900 tracking-tight mt-2">{stats?.completed_interviews ?? 0}</p>
          <div className="mt-2 flex items-center gap-1 text-dark-400 text-xs">
            <Clock className="w-3.5 h-3.5" />
            Avg. response: 4h
          </div>
        </div>

        <div className="bg-white border border-dark-200 rounded-xl p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 mb-1">New Candidates</p>
          <p className="text-4xl font-semibold text-dark-900 tracking-tight mt-2">{stats?.candidates_this_month ?? 0}</p>
          <div className="mt-2 flex items-center gap-1 text-primary-600 text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            This month
          </div>
        </div>
      </div>

      {/* Status + Skills row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-dark-200 rounded-xl p-6">
          <h3 className="text-[13px] font-semibold text-dark-900 mb-5">Interview Status</h3>
          <div className="space-y-4">
            {stats?.interviews_by_status?.map((item: any) => (
              <div key={item.status} className="flex items-center gap-4">
                <span className="text-sm text-dark-500 w-24 shrink-0">{item.status}</span>
                <div className="flex-1 h-1.5 bg-dark-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total_interviews > 0 ? (item.count / stats.total_interviews) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-dark-900 w-8 text-right tabular-nums">{item.count}</span>
              </div>
            )) || <p className="text-sm text-dark-400">No data yet</p>}
          </div>
        </div>

        <div className="bg-white border border-dark-200 rounded-xl p-6">
          <h3 className="text-[13px] font-semibold text-dark-900 mb-5">Top Skills</h3>
          <div className="flex flex-wrap gap-2">
            {stats?.top_skills?.map((skill: any) => (
              <span
                key={skill.skill}
                className="px-3 py-1.5 bg-dark-50 border border-dark-200 rounded-lg text-xs font-medium text-dark-700"
              >
                {skill.skill} <span className="text-dark-400">({skill.count})</span>
              </span>
            )) || <p className="text-sm text-dark-400">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Talent Pipeline table */}
      <div className="bg-white border border-dark-200 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="px-6 py-4 border-b border-dark-100 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-dark-900">Active Talent Pipeline</h3>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dark-200 rounded-md text-xs font-semibold text-dark-600 hover:bg-dark-50 transition-colors">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dark-200 rounded-md text-xs font-semibold text-dark-600 hover:bg-dark-50 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <Link to="/analytics" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium ml-2">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-50/50 border-b border-dark-100">
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400">Candidate</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400">Role</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400">Status</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 text-right">AI Score</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400 text-right">Date</th>
                <th className="px-6 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {stats?.recent_sessions?.map((session: any) => (
                <tr key={session.id} className="hover:bg-dark-50/60 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <CandidateAvatar name={session.candidate_name} />
                      <div>
                        <Link
                          to={`/results/${session.id}`}
                          className="font-semibold text-dark-900 hover:text-primary-600 text-sm transition-colors"
                        >
                          {session.candidate_name}
                        </Link>
                        <p className="text-xs text-dark-400">{session.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-dark-800">{session.template_title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={session.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {session.score !== null ? (
                      <span className={`tabular-nums font-mono text-sm font-semibold ${getScoreColor(session.score)}`}>
                        {session.score.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-dark-300 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-dark-400">
                    {formatDate(session.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-dark-300 hover:text-dark-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) ?? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-dark-400">
                    No sessions yet. Start by creating a template and adding a candidate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-6 py-3 border-t border-dark-100 bg-dark-50/30 flex items-center justify-between">
          <p className="text-xs text-dark-400">
            Showing {stats?.recent_sessions?.length ?? 0} of {stats?.total_interviews ?? 0} candidates
          </p>
          <div className="flex items-center gap-1">
            <button className="p-1.5 border border-dark-200 rounded hover:bg-white transition-colors disabled:opacity-40" disabled>
              <XCircle className="w-3.5 h-3.5 rotate-45 text-dark-400" />
            </button>
            <button className="p-1.5 border border-dark-200 rounded hover:bg-white transition-colors">
              <ArrowRight className="w-3.5 h-3.5 text-dark-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
