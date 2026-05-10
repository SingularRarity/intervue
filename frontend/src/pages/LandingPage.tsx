import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Shield, Globe, Zap, Brain, BarChart3, MessageSquare, Mic, Clock, Radio, Users, TrendingUp } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] font-sans selection:bg-primary-500/30">
      {/* Nav */}
      <header className="bg-[#0a0f1e]/98 backdrop-blur-md sticky top-0 z-50 border-b border-white/8">
        <nav className="flex justify-between items-center px-8 h-[62px] w-full max-w-[1200px] mx-auto">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display italic text-white text-[18px] tracking-tight">Intervue</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary-500/70 border border-primary-500/30 px-1.5 py-0.5 rounded">Alpha</span>
            </Link>
            <div className="hidden md:flex gap-7">
              <a href="#features" className="text-white/50 hover:text-white transition-colors text-[13px] font-medium">Features</a>
              <a href="#how-it-works" className="text-white/50 hover:text-white transition-colors text-[13px] font-medium">How It Works</a>
              <a href="#pricing" className="text-white/50 hover:text-white transition-colors text-[13px] font-medium">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-white/50 hover:text-white text-[13px] transition-colors font-medium px-3 py-2">Sign In</Link>
            <Link to="/register" className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-md text-[13px] font-semibold transition-all hover:-translate-y-px shadow-lg shadow-primary-500/20">
              Start Free Trial
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative pt-24 pb-20 overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(16,185,129,0.08),transparent_60%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>

          <div className="relative z-10 max-w-[1200px] mx-auto px-8">
            {/* Alpha badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                <Radio className="w-3 h-3 text-primary-500 animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">Now in Alpha · 15-Day Free Trial · No Credit Card</span>
              </div>
            </div>

            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="font-display text-[64px] md:text-[76px] text-white leading-[1.0] tracking-[-0.02em] mb-6">
                AI Interviews that<br />
                <em className="text-primary-400 not-italic">Hire Better.</em>
              </h1>
              <p className="text-white/45 text-[17px] leading-relaxed max-w-2xl mx-auto mb-10">
                Intervue conducts structured, voice-based AI interviews — delivering objective scorecards so your team can hire faster, fairer, and at scale.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2.5 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-lg font-semibold text-[15px] transition-all hover:-translate-y-px shadow-xl shadow-primary-500/25"
                >
                  Start 15-Day Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/8 text-white/80 px-8 py-3.5 rounded-lg font-medium text-[15px] border border-white/10 transition-all"
                >
                  See How It Works
                </a>
              </div>
            </div>

            {/* Product preview */}
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/10 to-purple-500/10 blur-2xl opacity-80 rounded-2xl" />
              <div className="relative border border-white/8 bg-white/4 backdrop-blur-xl p-6 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 mb-5">
                  {[1, 2, 3].map((i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/12" />)}
                  <span className="ml-2 text-[10px] font-mono text-white/20 tracking-wider">intervue · interview-session</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                    <span className="text-[10px] text-primary-400 font-medium">LIVE</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Candidate', val: 'Priya Sharma', sub: 'Sr. Backend Engineer' },
                    { label: 'Template', val: 'System Design', sub: 'Senior · 45 min' },
                    { label: 'Language', val: 'English', sub: 'Voice · Real-time' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/5 border border-white/8 rounded-lg p-3">
                      <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1">{item.label}</p>
                      <p className="text-white text-sm font-semibold leading-tight">{item.val}</p>
                      <p className="text-white/35 text-[10px] mt-0.5">{item.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse shrink-0" />
                  <span className="text-primary-400 text-xs font-medium">AI Interviewer: "Can you walk me through how you'd design a distributed rate limiter?"</span>
                </div>

                <div className="flex items-end gap-0.5 h-10 mb-4">
                  {[20, 45, 30, 70, 55, 85, 40, 65, 90, 50, 75, 35, 60, 80, 25, 70, 45, 90, 60, 35].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary-500/30 rounded-sm"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Technical', val: '—' },
                    { label: 'Communication', val: '—' },
                    { label: 'Problem Solving', val: '—' },
                    { label: 'Overall', val: '—' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/4 border border-white/8 rounded-md p-2 text-center">
                      <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1 leading-tight">{s.label}</p>
                      <p className="font-semibold text-base font-mono text-white/20">{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trust strip */}
            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {[
                { icon: Users, val: '500+', label: 'Interviews conducted' },
                { icon: TrendingUp, val: '4.8×', label: 'Faster screening' },
                { icon: CheckCircle, val: '100%', label: 'Structured & consistent' },
                { icon: Globe, val: '10+', label: 'Indian languages' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 text-white/30">
                  <item.icon className="w-3.5 h-3.5 text-primary-500/60" />
                  <span className="text-[13px] font-semibold text-white/60">{item.val}</span>
                  <span className="text-[12px]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 px-8 border-t border-white/5">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-4">Simple Process</p>
              <h2 className="font-display text-[44px] text-white tracking-tight mb-4 leading-tight">Three steps to better hiring</h2>
              <p className="text-white/35 max-w-lg mx-auto text-[15px] leading-relaxed">
                Set it up in minutes. Candidates interview on their schedule. You read structured reports.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
              <div className="hidden md:block absolute top-8 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-white/10 via-primary-500/20 to-white/10" />
              {[
                {
                  step: '01',
                  icon: FileIcon,
                  title: 'Build a Template',
                  desc: 'Define the role, difficulty level, interview type, and focus topics. Our AI tailors questions automatically. Takes under 3 minutes.',
                },
                {
                  step: '02',
                  icon: Mic,
                  title: 'Send the Link',
                  desc: 'Share a candidate portal link. The AI conducts a fully structured voice interview on their schedule — no human required.',
                },
                {
                  step: '03',
                  icon: BarChart3,
                  title: 'Read the Report',
                  desc: 'Get a structured scorecard: technical depth, communication, problem-solving, full transcript, and a hire recommendation.',
                },
              ].map((item, idx) => (
                <div key={item.step} className="relative bg-white/3 border border-white/8 hover:border-white/12 rounded-xl p-8 transition-all group">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-[11px] font-bold text-primary-500/50 bg-primary-500/10 border border-primary-500/20 rounded px-2 py-0.5">{item.step}</span>
                  </div>
                  <item.icon className="w-6 h-6 text-primary-400 mb-4" />
                  <h3 className="text-white font-semibold text-[17px] mb-2.5">{item.title}</h3>
                  <p className="text-white/40 text-[13px] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-8 border-t border-white/5">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-4">Platform Capabilities</p>
              <h2 className="font-display text-[44px] text-white tracking-tight mb-4 leading-tight">Built for serious hiring teams</h2>
              <p className="text-white/35 max-w-lg mx-auto text-[15px] leading-relaxed">
                Everything you need to run structured, scalable AI interviews from day one.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Wide feature card */}
              <div className="md:col-span-2 bg-white/3 border border-white/8 rounded-xl p-8 flex flex-col justify-between relative overflow-hidden group hover:border-primary-500/20 transition-all">
                <div className="z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-primary-500/15 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-[18px] leading-tight">AI-Powered Interviews</h3>
                      <p className="text-white/35 text-[11px]">Voice · Multi-language · Adaptive</p>
                    </div>
                  </div>
                  <p className="text-white/45 text-[14px] leading-relaxed max-w-md">
                    Advanced question intelligence combined with real-time voice in 10+ Indian languages. The AI listens, probes deeper, and adapts based on each answer.
                  </p>
                  <ul className="mt-5 space-y-2">
                    {['Adaptive follow-up questions', 'Real-time voice transcription', 'Multi-language support (Hindi, Tamil, Telugu & more)'].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-white/35 text-[12px]">
                        <CheckCircle className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 flex gap-0.5 items-end h-14">
                  {[40, 55, 35, 70, 85, 65, 90, 75, 95, 80, 65, 88, 72, 95, 60].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary-500/20 group-hover:bg-primary-500/30 rounded-sm transition-colors" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>

              <div className="bg-white/3 border border-white/8 rounded-xl p-8 flex flex-col justify-between hover:border-white/12 transition-all">
                <div>
                  <div className="w-10 h-10 bg-white/8 rounded-lg flex items-center justify-center mb-5">
                    <Shield className="w-5 h-5 text-white/60" />
                  </div>
                  <h3 className="text-white font-semibold text-[18px] mb-2">Enterprise Security</h3>
                  <p className="text-white/40 text-[13px] leading-relaxed">Your data stays in your account. Tenants are fully isolated. API keys are encrypted at rest.</p>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {['AES-256 encrypted API keys', 'Full tenant isolation', 'No cross-tenant data sharing', 'SOC 2 aligned practices'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-white/35 text-[11px] font-medium">
                      <div className="w-1 h-1 rounded-full bg-primary-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/3 border border-white/8 rounded-xl p-8 hover:border-white/12 transition-all">
                <div className="w-10 h-10 bg-white/8 rounded-lg flex items-center justify-center mb-5">
                  <Globe className="w-5 h-5 text-white/50" />
                </div>
                <h3 className="text-white font-semibold text-[18px] mb-2">Indian Language Support</h3>
                <p className="text-white/40 text-[13px] leading-relaxed">Conduct interviews in Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, and more. Reach every qualified candidate.</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {['Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'English'].map((lang) => (
                    <span key={lang} className="text-[10px] text-white/30 border border-white/10 rounded px-2 py-0.5 font-medium">{lang}</span>
                  ))}
                </div>
              </div>

              <div className="bg-white/3 border border-white/8 rounded-xl p-8 hover:border-white/12 transition-all">
                <div className="w-10 h-10 bg-white/8 rounded-lg flex items-center justify-center mb-5">
                  <BarChart3 className="w-5 h-5 text-white/50" />
                </div>
                <h3 className="text-white font-semibold text-[18px] mb-2">Structured Scorecards</h3>
                <p className="text-white/40 text-[13px] leading-relaxed">Every session produces a scored report: technical depth, communication, problem-solving, full transcript, and a hire recommendation.</p>
              </div>

              <div className="bg-white/3 border border-white/8 rounded-xl p-8 hover:border-white/12 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-500/15 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-[18px] mb-2">Async by Default</h3>
                    <p className="text-white/40 text-[13px] leading-relaxed">Candidates interview on their own schedule. No calendar ping-pong. No interviewer time required.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 px-8 border-t border-white/5">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-4">Pricing</p>
              <h2 className="font-display text-[44px] text-white tracking-tight mb-4 leading-tight">Start free, scale when ready</h2>
              <p className="text-white/35 max-w-lg mx-auto text-[15px] leading-relaxed">
                Full access during alpha. No credit card required.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {[
                {
                  name: 'Free Trial',
                  badge: 'Current Alpha',
                  price: '₹0',
                  period: '15 days',
                  desc: 'Full platform access to evaluate fit.',
                  features: ['10 AI interviews', 'All templates', 'Score reports', 'Email support'],
                  cta: 'Start Free Trial',
                  href: '/register',
                  highlight: false,
                },
                {
                  name: 'Individual',
                  badge: 'Solo Hiring',
                  price: '₹999',
                  period: 'per month',
                  desc: 'For founders and solo recruiters.',
                  features: ['10 AI interviews/mo', 'All templates', 'Score reports', 'Email support'],
                  cta: 'Get Started',
                  href: '/register',
                  highlight: false,
                },
                {
                  name: 'Startup',
                  badge: 'Most Popular',
                  price: '₹7,999',
                  period: 'per month',
                  desc: 'For teams actively hiring.',
                  features: ['100 AI interviews/mo', 'Multi-language support', 'Team collaboration', 'API access', 'Priority support'],
                  cta: 'Get Started',
                  href: '/register',
                  highlight: true,
                },
                {
                  name: 'Enterprise',
                  badge: 'Custom',
                  price: 'Custom',
                  period: 'pricing',
                  desc: 'For large-scale hiring operations.',
                  features: ['Unlimited interviews', 'RBAC & SSO', 'Custom branding', 'SLA & dedicated support', 'On-prem option'],
                  cta: 'Contact Sales',
                  href: 'mailto:info@singularraritylabs.com?subject=Intervue%20Enterprise',
                  highlight: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-xl p-7 flex flex-col ${
                    plan.highlight
                      ? 'bg-primary-500/10 border-2 border-primary-500/40'
                      : 'bg-white/3 border border-white/8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-semibold text-[16px]">{plan.name}</h3>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      plan.highlight ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-white/8 text-white/40 border border-white/10'
                    }`}>{plan.badge}</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-[36px] font-semibold text-white leading-none">{plan.price}</span>
                    <span className="text-white/35 text-[13px] ml-1">/{plan.period}</span>
                  </div>
                  <p className="text-white/35 text-[12px] mb-6">{plan.desc}</p>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-white/50 text-[13px]">
                        <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${plan.highlight ? 'text-primary-400' : 'text-white/30'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.href.startsWith('/') ? (
                    <Link
                      to={plan.href}
                      className={`w-full text-center py-3 rounded-lg text-[13px] font-semibold transition-all ${
                        plan.highlight
                          ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                          : 'bg-white/8 hover:bg-white/12 text-white/70 border border-white/10'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <a
                      href={plan.href}
                      className="w-full text-center py-3 rounded-lg text-[13px] font-semibold bg-white/8 hover:bg-white/12 text-white/70 border border-white/10 transition-all"
                    >
                      {plan.cta}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Alpha CTA */}
        <section id="feedback" className="py-24 px-8 border-t border-white/5">
          <div className="max-w-[1200px] mx-auto">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-14 flex flex-col items-center text-center gap-6">
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px,transparent 1px)', backgroundSize: '24px 24px' }}
              />
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0a0f1e]/15 backdrop-blur-sm rounded-full relative z-10">
                <MessageSquare className="w-3 h-3 text-[#0a0f1e]/60" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0a0f1e]/60">Alpha Program</span>
              </div>

              <h2 className="font-display text-[48px] text-[#0a0f1e] font-semibold relative z-10 leading-[1.1] max-w-xl">
                Try it free.<br />Tell us what to build.
              </h2>
              <p className="text-[#0a0f1e]/55 text-[16px] max-w-lg relative z-10 leading-relaxed">
                We're building Intervue with a focused group of Indian startups. Full access in exchange for honest feedback. No contracts, no lock-in.
              </p>
              <div className="flex flex-wrap gap-3 relative z-10">
                <Link
                  to="/register"
                  className="bg-[#0a0f1e] text-white px-10 py-3.5 rounded-lg font-semibold text-[15px] hover:bg-[#131929] transition-colors shadow-xl"
                >
                  Start Free Trial
                </Link>
                <a
                  href="mailto:info@singularraritylabs.com?subject=Alpha%20Program%20Interest"
                  className="bg-white/20 hover:bg-white/30 text-[#0a0f1e] border border-[#0a0f1e]/10 px-10 py-3.5 rounded-lg font-semibold text-[15px] transition-colors"
                >
                  Talk to Us
                </a>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-[#0a0f1e]/40 text-[13px] relative z-10">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> No credit card required</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> 15-day full access</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Direct founder support</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 bg-[#07090f]">
        <div className="max-w-[1200px] mx-auto px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-display italic text-white text-[18px] tracking-tight">Intervue</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary-500/60 border border-primary-500/20 px-1.5 py-0.5 rounded">Alpha</span>
              </div>
              <p className="text-white/30 text-[13px] leading-relaxed max-w-xs mb-6">
                Structured AI interviews built for Indian hiring teams who demand objectivity and speed.
              </p>
              <a
                href="mailto:info@singularraritylabs.com"
                className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-[12px] font-medium transition-colors"
              >
                info@singularraritylabs.com
              </a>
            </div>

            {/* Product links */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/20 mb-4">Product</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'How It Works', href: '#how-it-works' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Sign In', href: '/login' },
                  { label: 'Start Free Trial', href: '/register' },
                ].map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link to={link.href} className="text-white/30 hover:text-white/60 text-[13px] transition-colors">{link.label}</Link>
                    ) : (
                      <a href={link.href} className="text-white/30 hover:text-white/60 text-[13px] transition-colors">{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/20 mb-4">Company</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Alpha Program', href: '#feedback' },
                  { label: 'Contact Support', href: 'mailto:info@singularraritylabs.com' },
                  { label: 'Discord Community', href: 'https://discord.gg/9wbpzut9s', external: true },
                  { label: 'WhatsApp Support', href: 'https://chat.whatsapp.com/Gtyhl4P1R0sLrpyueiBMXN', external: true },
                  { label: 'SingularRarityLabs', href: 'https://singularraritylabs.com', external: true },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-white/30 hover:text-white/60 text-[13px] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-white/20 text-[12px]">
              © 2026 Intervue. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-white/20 text-[12px]">
              <span>A product by</span>
              <a
                href="https://singularraritylabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white/70 font-semibold transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-white/40"
              >
                SingularRarity Labs
              </a>
              <span>· Intervue by SingularRarity Labs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
