import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Radio, Shield, Globe, Zap, Brain, BarChart3, MessageSquare, Mic, Clock } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] font-sans selection:bg-primary-500/30">
      {/* Nav */}
      <header className="bg-[#0f172a]/95 backdrop-blur-md sticky top-0 z-50 border-b border-white/10">
        <nav className="flex justify-between items-center px-8 h-16 w-full max-w-[1280px] mx-auto">
          <div className="flex items-center gap-8">
            <span className="font-display italic text-white text-xl tracking-tight">Intervue</span>
            <div className="hidden md:flex gap-6">
              <a href="#features" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-white/70 hover:text-white transition-colors text-sm font-medium">How It Works</a>
              <a href="#feedback" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Alpha Program</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-white/70 hover:text-white text-sm transition-colors font-medium">Sign In</Link>
            <Link to="/register" className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px">
              Start Free Trial
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero — two column */}
        <section className="relative min-h-[820px] flex items-center overflow-hidden py-20">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.07),transparent_55%)]" />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          <div className="relative z-10 max-w-[1280px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full w-fit">
                <Radio className="w-3 h-3 text-primary-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Now in Alpha — 15-Day Free Trial</span>
              </div>

              <h1 className="font-display text-[56px] md:text-[64px] text-white leading-[1.05] tracking-tight">
                AI Interviews,<br />
                <em className="text-primary-400 not-italic">Done Right.</em>
              </h1>

              <p className="text-white/55 text-[17px] leading-relaxed max-w-lg">
                Intervue conducts structured, voice-based interviews using Claude and Sarvam AI — then delivers an objective scorecard so your team can hire faster and fairer.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-xl font-semibold text-[15px] transition-all hover:-translate-y-px"
                >
                  Start 15-Day Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-8 py-3.5 rounded-xl font-semibold text-[15px] border border-white/10 transition-all"
                >
                  See How It Works
                </a>
              </div>

              <p className="text-white/25 text-xs">No credit card · No setup fee · Cancel anytime</p>
            </div>

            {/* Product preview card */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/15 to-purple-500/15 blur-2xl opacity-60 rounded-2xl" />
                <div className="relative border border-white/10 bg-white/5 backdrop-blur-xl p-6 rounded-xl overflow-hidden">
                  {/* Window chrome */}
                  <div className="flex items-center gap-1.5 mb-5">
                    {[1, 2, 3].map((i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/15" />)}
                    <span className="ml-2 text-[10px] font-mono text-white/20">Interview Session · Live</span>
                  </div>

                  {/* Live interview indicator */}
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    <span className="text-primary-400 text-xs font-medium">AI Interviewer is speaking…</span>
                  </div>

                  {/* Waveform bars */}
                  <div className="flex items-end gap-0.5 h-12 mb-4 px-2">
                    {[20, 45, 30, 70, 55, 85, 40, 65, 90, 50, 75, 35, 60, 80, 25].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-primary-500/40 rounded-t-sm"
                        style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>

                  {/* Score summary */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Technical', val: '—', color: 'text-white/30' },
                      { label: 'Communication', val: '—', color: 'text-white/30' },
                      { label: 'Overall', val: '—', color: 'text-white/30' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-center">
                        <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1">{s.label}</p>
                        <p className={`font-semibold text-lg font-mono ${s.color}`}>{s.val}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-white/20 text-[10px] font-mono text-center">Scores generated after session completes</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 px-8 max-w-[1280px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary-400 text-[11px] font-bold uppercase tracking-widest mb-3">Simple & Transparent</p>
            <h2 className="font-display text-[40px] text-white tracking-tight mb-3">Three steps to better hiring</h2>
            <p className="text-white/40 max-w-xl mx-auto text-[15px] leading-relaxed">
              No PhD required. Set it up, send the link, read the report.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: FileIcon,
                title: 'Create a Template',
                desc: 'Define the role, difficulty, interview type, and topics. Takes about 2 minutes.',
              },
              {
                step: '02',
                icon: Mic,
                title: 'Send the Invite',
                desc: 'Share a candidate portal link. The AI conducts a structured voice interview on their schedule.',
              },
              {
                step: '03',
                icon: BarChart3,
                title: 'Read the Report',
                desc: 'Get a structured analysis: technical depth, communication score, strengths, and a hire recommendation.',
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-white/5 border border-white/10 rounded-xl p-7">
                <p className="font-mono text-[11px] text-primary-500/60 mb-4">{item.step}</p>
                <item.icon className="w-6 h-6 text-primary-400 mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-8 max-w-[1280px] mx-auto border-t border-white/5">
          <div className="text-center mb-14">
            <p className="text-primary-400 text-[11px] font-bold uppercase tracking-widest mb-3">What's Included</p>
            <h2 className="font-display text-[40px] text-white tracking-tight mb-3">Built for fast-moving teams</h2>
            <p className="text-white/40 max-w-xl mx-auto text-[15px] leading-relaxed">
              Everything you need to run structured AI interviews from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-7 flex flex-col justify-between relative overflow-hidden group">
              <div className="z-10">
                <Brain className="w-8 h-8 text-primary-500 mb-5" />
                <h3 className="font-display text-2xl text-white mb-2">AI-Powered Interviews</h3>
                <p className="text-white/50 text-[14px] leading-relaxed max-w-md">
                  Powered by Claude (Anthropic) for question intelligence and Sarvam AI for real-time voice in 10+ Indian languages. Your candidates speak naturally — the AI listens and probes deeper.
                </p>
              </div>
              <div className="mt-8 flex gap-1 items-end h-16">
                {[40, 55, 35, 70, 85, 65, 90, 75, 95, 80].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary-500/25 group-hover:bg-primary-500/35 rounded-t-sm transition-colors" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-primary-500/10 to-transparent pointer-events-none" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <Shield className="w-8 h-8 text-white mb-5" />
                <h3 className="font-display text-2xl text-white mb-2">Private & Secure</h3>
                <p className="text-white/50 text-[14px] leading-relaxed">Your data stays in your account. Each tenant is fully isolated. API keys are encrypted at rest.</p>
              </div>
              <ul className="mt-5 space-y-2">
                {['Encrypted API Keys', 'Tenant Isolation', 'No data sharing'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-white/40 text-[11px] font-bold uppercase tracking-wider">
                    <CheckCircle className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-7">
              <Globe className="w-8 h-8 text-white/50 mb-5" />
              <h3 className="font-display text-2xl text-white mb-2">Indian Language Support</h3>
              <p className="text-white/40 text-[14px]">Conduct interviews in Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, and more via Sarvam AI's multilingual engine.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-7">
              <BarChart3 className="w-8 h-8 text-white/50 mb-5" />
              <h3 className="font-display text-2xl text-white mb-2">Structured Reports</h3>
              <p className="text-white/40 text-[14px]">Every session produces a scored report: technical depth, communication, problem-solving, full transcript, and a hire/no-hire recommendation.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-7 flex items-start gap-5">
              <Clock className="w-6 h-6 text-primary-500 shrink-0 mt-1" />
              <div>
                <h3 className="font-display text-xl text-white mb-1">Async by Default</h3>
                <p className="text-white/40 text-[13px] leading-relaxed">Candidates interview on their own schedule. No calendar ping-pong. You read the report whenever you want.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Alpha feedback CTA */}
        <section id="feedback" className="py-20 px-8 mb-20">
          <div className="max-w-[1280px] mx-auto">
            <div className="relative overflow-hidden bg-primary-500 rounded-3xl p-14 flex flex-col items-center text-center gap-6">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px,transparent 1px)', backgroundSize: '20px 20px' }}
              />

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0f172a]/15 rounded-full relative z-10">
                <MessageSquare className="w-3 h-3 text-[#0f172a]/70" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f172a]/70">Alpha Program</span>
              </div>

              <h2 className="font-display text-[44px] text-[#0f172a] font-bold relative z-10 leading-tight">
                Try it free for 15 days.<br />Tell us what to fix.
              </h2>
              <p className="text-[#0f172a]/60 text-[17px] max-w-xl relative z-10 leading-relaxed">
                We're building Intervue in the open with a small group of Indian startups. You get full access, and we get honest feedback. That's the deal.
              </p>
              <div className="flex flex-wrap gap-4 relative z-10">
                <Link
                  to="/register"
                  className="bg-[#0f172a] text-white px-10 py-4 rounded-xl font-semibold text-[15px] hover:scale-[1.02] transition-transform"
                >
                  Start Free Trial
                </Link>
                <a
                  href="mailto:founders@interviewai.dev?subject=Alpha%20Program%20Interest"
                  className="bg-white/20 text-[#0f172a] border border-[#0f172a]/10 px-10 py-4 rounded-xl font-semibold text-[15px] hover:bg-white/30 transition-colors"
                >
                  Email Us Directly
                </a>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-6 text-[#0f172a]/50 text-sm relative z-10">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> 15-day free access</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Direct founder support</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="max-w-[1280px] mx-auto px-8 flex items-center justify-between flex-wrap gap-4">
          <span className="font-display italic text-white text-[16px]">Intervue</span>
          <div className="flex items-center gap-6 text-white/20 text-[11px]">
            <a href="mailto:founders@interviewai.dev" className="hover:text-white/50 transition-colors">founders@interviewai.dev</a>
            <span>Built with Sarvam AI & Claude</span>
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
