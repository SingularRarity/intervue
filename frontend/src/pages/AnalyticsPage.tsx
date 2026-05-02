import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, Users, Calendar, Loader2 } from 'lucide-react'
import { analyticsApi } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsApi.getDashboard().then(r => r.data),
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['session-analytics', dateRange],
    queryFn: () => analyticsApi.getSessions(dateRange).then(r => r.data),
    enabled: !!dateRange.from && !!dateRange.to,
  })

  if (dashLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  const statusData = dashboard?.interviews_by_status?.map((item: any) => ({
    name: item.status,
    value: item.count,
  })) || []

  const skillData = dashboard?.top_skills?.slice(0, 8).map((item: any) => ({
    name: item.skill,
    value: item.count,
  })) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-dark-400 mt-1">Insights into your hiring pipeline</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-600/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{dashboard?.total_interviews || 0}</div>
              <div className="text-sm text-dark-500">Total Interviews</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{dashboard?.completed_interviews || 0}</div>
              <div className="text-sm text-dark-500">Completed</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{dashboard?.candidates_this_month || 0}</div>
              <div className="text-sm text-dark-500">This Month</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {dashboard?.average_score ? dashboard.average_score.toFixed(1) : '0'}
              </div>
              <div className="text-sm text-dark-500">Avg Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-6">Interview Status Distribution</h3>
          <div className="h-64">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Top Skills */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-6">Top Candidate Skills</h3>
          <div className="h-64">
            {skillData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-500">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Range Analytics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Session Analytics</h3>
        <div className="flex items-center gap-4 mb-6">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="input-field w-auto"
          />
          <span className="text-dark-500">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="input-field w-auto"
          />
        </div>

        {analytics?.daily_stats && analytics.daily_stats.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.daily_stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {(!dateRange.from || !dateRange.to) && (
          <p className="text-dark-500 text-center py-8">Select a date range to view analytics</p>
        )}
      </div>
    </div>
  )
}
