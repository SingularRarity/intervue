import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  UserPlus,
  Plug,
  MessageCircle,
  Plus,
  ExternalLink,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'

export default function Layout() {
  const { tenant, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const mainNav = [
    { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/templates',  icon: FileText,         label: 'Interviews' },
    { path: '/candidates', icon: Users,            label: 'Candidates' },
    { path: '/analytics',  icon: BarChart3,        label: 'Analytics' },
  ]

  const manageNav = [
    { path: '/team',         icon: UserPlus, label: 'Team' },
    { path: '/integrations', icon: Plug,     label: 'Integrations' },
    { path: '/settings',     icon: Settings, label: 'Settings' },
  ]

  const initials = tenant?.company_name
    ?.split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase() ?? 'AI'

  return (
    <div className="flex h-screen bg-canvas">
      {/* Sidebar — 220px fixed, #1E2235 per DESIGN.md */}
      <aside className="w-[220px] shrink-0 bg-[#1E2235] flex flex-col fixed left-0 top-0 h-screen z-50 border-r border-white/10">
        {/* Logo */}
        <div className="px-6 pt-8 pb-10">
          <span className="font-display text-[19px] text-white italic tracking-tight leading-none">
            InterviewAI
          </span>
          <p className="text-white/30 text-[10px] uppercase tracking-[0.15em] mt-1">Enterprise Suite</p>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto space-y-0.5">
          {mainNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-6 pb-1 px-4">
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/25">Manage</p>
          </div>

          {manageNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* New Campaign CTA */}
        <div className="px-5 mt-6">
          <button
            onClick={() => navigate('/templates')}
            className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold py-2.5 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        {/* Footer links + user */}
        <div className="mt-4 pt-4 border-t border-white/5 pb-4 space-y-0.5">
          {/* Alpha feedback CTA */}
          <div className="mx-3 mb-3 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
            <p className="text-primary-300 text-[11px] font-semibold mb-0.5">Alpha Program</p>
            <p className="text-white/35 text-[10px] leading-relaxed mb-2">Help us improve. Share what's broken or missing.</p>
            <a
              href="mailto:founders@interviewai.dev?subject=InterviewAI%20Feedback"
              className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Send Feedback
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <a
            href="mailto:founders@interviewai.dev"
            className="flex items-center gap-3 px-4 py-2 text-white/30 hover:text-white text-xs uppercase tracking-widest transition-colors"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            Contact Support
          </a>

          {/* User row */}
          <div className="mx-4 mt-3 pt-3 border-t border-white/5 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white/80 truncate leading-tight">
                {tenant?.company_name}
              </p>
              <p className="text-[10px] text-white/30 truncate leading-tight">
                {tenant?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/30 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content — offset by sidebar width */}
      <main className="ml-[220px] flex-1 overflow-auto bg-canvas">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
