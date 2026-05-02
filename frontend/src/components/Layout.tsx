import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Mic,
  Sparkles,
  UserPlus,
  Plug,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'

export default function Layout() {
  const { tenant, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/templates', icon: FileText, label: 'Templates' },
    { path: '/candidates', icon: Users, label: 'Candidates' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/team', icon: UserPlus, label: 'Team' },
    { path: '/integrations', icon: Plug, label: 'Integrations' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="flex h-screen bg-dark-950">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-900 border-r border-dark-800 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">InterviewAI</h1>
              <p className="text-xs text-dark-400">Powered by Sarvam</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600/10 text-primary-400 border border-primary-600/20'
                    : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-dark-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-200 truncate">{tenant?.company_name}</p>
              <p className="text-xs text-dark-500 truncate">{tenant?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-dark-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
