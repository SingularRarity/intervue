import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Mic, Users, FileText, TrendingUp, Clock, ArrowRight, 
  Award, AlertCircle, CheckCircle, XCircle, Loader2 
} from 'lucide-react'
import { analyticsApi, interviewApi } from '@/lib/api'
import { formatDate, getScoreColor } from '@/lib/utils'

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsApi.getDashboard().then(r => r.data),
  })

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: () => interviewApi.getCandidates().then(r => r.data),
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'InProgress': return <Clock className="w-4 h-4 text-primary-400" />
      case 'Scheduled': return <Clock className="w-4 h-4 text-amber-400" />
      default: return <XCircle className="w-4 h-4 text-red-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return 'badge-success'
      case 'InProgress': return 'badge-info'
      case 'Scheduled': return 'badge-warning'
      default: return 'badge-danger'
    }
  }

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">Overview of your interview activities</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/templates" className="btn-secondary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </Link>
          <Link to="/candidates" className="btn-primary flex items-center gap-2">
            <Mic className="w-4 h-4" />
            New Interview
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-600/10 rounded-xl flex items-center justify-center">
              <Mic className="w-6 h-6 text-primary-400" />
            </div>
            <span className="text-xs text-dark-500">Total</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.total_interviews || 0}</div>
          <p className="text-dark-400 text-sm mt-1">Total Interviews</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xs text-dark-500">Completed</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.completed_interviews || 0}</div>
          <p className="text-dark-400 text-sm mt-1">Completed Interviews</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs text-dark-500">Average</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {stats?.average_score ? stats.average_score.toFixed(1) : '0'}
          </div>
          <p className="text-dark-400 text-sm mt-1">Average Score</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs text-dark-500">This Month</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.candidates_this_month || 0}</div>
          <p className="text-dark-400 text-sm mt-1">New Candidates</p>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-6">Interview Status</h3>
          <div className="space-y-4">
            {stats?.interviews_by_status?.map((item: any) => (
              <div key={item.status} className="flex items-center gap-4">
                <span className="text-sm text-dark-400 w-24">{item.status}</span>
                <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.total_interviews > 0 ? (item.count / stats.total_interviews) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-white w-12 text-right">{item.count}</span>
              </div>
            )) || <p className="text-dark-500">No data available</p>}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-6">Top Skills</h3>
          <div className="flex flex-wrap gap-2">
            {stats?.top_skills?.map((skill: any) => (
              <span
                key={skill.skill}
                className="px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-300"
              >
                {skill.skill} <span className="text-dark-500">({skill.count})</span>
              </span>
            )) || <p className="text-dark-500">No data available</p>}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
          <Link to="/analytics" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-800">
                <th className="text-left text-sm font-medium text-dark-400 py-3 px-4">Candidate</th>
                <th className="text-left text-sm font-medium text-dark-400 py-3 px-4">Template</th>
                <th className="text-left text-sm font-medium text-dark-400 py-3 px-4">Status</th>
                <th className="text-left text-sm font-medium text-dark-400 py-3 px-4">Score</th>
                <th className="text-left text-sm font-medium text-dark-400 py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_sessions?.map((session: any) => (
                <tr key={session.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <Link to={`/results/${session.id}`} className="text-white hover:text-primary-400 font-medium">
                      {session.candidate_name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-dark-300">{session.template_title}</td>
                  <td className="py-3 px-4">
                    <span className={getStatusBadge(session.status)}>
                      {session.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {session.score !== null ? (
                      <span className={`font-bold ${getScoreColor(session.score)}`}>
                        {session.score.toFixed(0)}
                      </span>
                    ) : (
                      <span className="text-dark-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-dark-400 text-sm">
                    {formatDate(session.created_at)}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-dark-500">
                    No sessions yet. Start by creating a template and adding a candidate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
