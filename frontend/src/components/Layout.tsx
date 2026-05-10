import { useState } from 'react'
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
  ExternalLink,
  CreditCard,
  HelpCircle,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { PLAN_LABELS } from '@/lib/permissions'
import AppTour, { TOUR_DONE_KEY } from './AppTour'

export default function Layout() {
  const { tenant, logout, plan } = useAuthStore()
  const navigate = useNavigate()

  const tourDoneKey = tenant?.id ? TOUR_DONE_KEY(tenant.id) : null
  const [showTour, setShowTour] = useState(
    () => !!tourDoneKey && !localStorage.getItem(tourDoneKey)
  )

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const mainNav = [
    { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',  tour: 'nav-dashboard' },
    { path: '/templates',  icon: FileText,         label: 'Interviews', tour: 'nav-interviews' },
    { path: '/candidates', icon: Users,            label: 'Candidates', tour: 'nav-candidates' },
    { path: '/analytics',  icon: BarChart3,        label: 'Analytics',  tour: 'nav-analytics' },
  ]

  const manageNav = [
    { path: '/team',         icon: UserPlus,     label: 'Team',          tour: 'nav-team' },
    { path: '/billing',      icon: CreditCard,   label: 'Plan & Billing', tour: '' },
    { path: '/integrations', icon: Plug,         label: 'Integrations',  tour: '' },
    { path: '/settings',     icon: Settings,     label: 'Settings',      tour: 'nav-settings' },
  ]

  const initials = tenant?.company_name
    ?.split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase() ?? 'AI'

  const planLabel = PLAN_LABELS[plan] ?? plan

  return (
    <div className="flex h-screen bg-canvas">
      {/* Sidebar — 220px fixed, #1E2235 per DESIGN.md */}
      <aside className="w-[220px] shrink-0 bg-[#1E2235] flex flex-col fixed left-0 top-0 h-screen z-50 border-r border-white/10">
        {/* Logo */}
        <div className="px-6 pt-8 pb-10">
          <span className="font-display text-[19px] text-white italic tracking-tight leading-none">
            Intervue
          </span>
          <p className="text-white/30 text-[10px] uppercase tracking-[0.15em] mt-1">Enterprise Suite</p>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto space-y-0.5">
          {mainNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              {...(item.tour ? { 'data-tour': item.tour } : {})}
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
              {...(item.tour ? { 'data-tour': item.tour } : {})}
              className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/5 pb-4 space-y-0.5">
          {/* Plan badge */}
          <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-white/5 flex items-center justify-between">
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Plan</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              plan === 'free' ? 'bg-dark-600 text-white/50' : 'bg-primary-500/20 text-primary-300'
            }`}>
              {planLabel}
            </span>
          </div>

          {/* Take a tour */}
          <button
            onClick={() => setShowTour(true)}
            className="mx-3 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/5 transition-colors text-[11px] w-full"
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            Take a tour
          </button>

          {/* Alpha feedback CTA */}
          <div className="mx-3 mb-2 p-3 rounded-lg bg-primary-500/8 border border-primary-500/15">
            <p className="text-primary-300 text-[10px] font-bold uppercase tracking-wider mb-1">Alpha Program</p>
            <p className="text-white/30 text-[10px] leading-relaxed mb-2">Help shape the product. Share feedback directly.</p>
            <a
              href="mailto:info@singularraritylabs.com?subject=Intervue%20Feedback"
              className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Send Feedback
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <a
            href="https://discord.gg/9wbpzut9s"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2 text-white/25 hover:text-white/60 text-[11px] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
            Discord Community
          </a>
          <a
            href="https://chat.whatsapp.com/Gtyhl4P1R0sLrpyueiBMXN"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2 text-white/25 hover:text-white/60 text-[11px] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
            WhatsApp Support
          </a>

          {/* SingularRarityLabs attribution */}
          <div className="mx-4 mt-2 mb-1 pt-2 border-t border-white/5">
            <a
              href="https://singularraritylabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-white/20 hover:text-white/40 uppercase tracking-[0.12em] font-medium transition-colors"
            >
              A SingularRarity Labs product
            </a>
          </div>

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

      {/* Main content */}
      <main className="ml-[220px] flex-1 overflow-auto bg-canvas">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Product tour */}
      {showTour && tenant?.id && (
        <AppTour tenantId={tenant.id} onDone={() => setShowTour(false)} />
      )}
    </div>
  )
}
