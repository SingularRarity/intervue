import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Radio, Shield, Globe, Zap, Brain, BarChart3, Quote } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] font-sans selection:bg-primary-500/30">
      {/* Nav */}
      <header className="bg-[#0f172a]/95 backdrop-blur-md sticky top-0 z-50 border-b border-white/10">
        <nav className="flex justify-between items-center px-8 h-16 w-full max-w-[1280px] mx-auto">
          <div className="flex items-center gap-8">
            <span className="font-display italic text-white text-xl tracking-tight">InterviewAI</span>
            <div className="hidden md:flex gap-6">
              <a href="#features" className="font-display text-primary-400 border-b border-primary-500 pb-0.5 text-sm">Solutions</a>
              <a href="#" className="font-display text-white/70 hover:text-white transition-colors text-sm">Pricing</a>
              <a href="#" className="font-display text-white/70 hover:text-white transition-colors text-sm">About</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-white/70 hover:text-white text-sm transition-colors">Sign In</Link>
            <Link to="/register" className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px">
              Get Started
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
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Now in Enterprise Early Access</span>
              </div>

              <h1 className="font-display text-[56px] md:text-[64px] text-white leading-[1.05] tracking-tight">
                Hiring at Scale,<br />
                <em className="text-primary-400 not-italic">Engineered with Precision.</em>
              </h1>

              <p className="text-white/55 text-[17px] leading-relaxed max-w-lg">
                Move beyond manual screening. InterviewAI leverages advanced neural architecture to identify top talent with 99.4% accuracy, reducing your time-to-hire by weeks.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-xl font-semibold text-[15px] transition-all hover:-translate-y-px"
                >
                  Request a Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-8 py-3.5 rounded-xl font-semibold text-[15px] border border-white/10 transition-all"
                >
                  View Methodology
                </a>
              </div>
            </div>

            {/* Product preview card */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/15 to-purple-500/15 blur-2xl opacity-60 rounded-2xl" />
                <div className="relative border border-white/10 bg-white/5 backdrop-blur-xl p-6 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-4">
                    {[1, 2, 3].map((i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/15" />)}
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[{ label: 'Candidates', val: '2,847' }, { label: 'Avg Score', val: '87.4' }, { label: 'Hired', val: '312' }].map((s) => (
                        <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1">{s.label}</p>
                          <p className="text-white font-semibold text-xl font-mono">{s.val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Score Distribution</p>
                      <div className="flex items-end gap-1 h-20">
                        {[30, 45, 65, 80, 95, 75, 85, 60, 90, 70].map((h, i) => (
                          <div key={i} className="flex-1 bg-primary-500/30 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    {['Helena K.', 'Julian M.', 'Sarah T.'].map((name, i) => (
                      <div key={name} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-[9px] font-bold">
                            {name.split(' ').map(w => w[0]).join('')}
                          </div>
                          <span className="text-white/70 text-xs">{name}</span>
                        </div>
                        <span className="text-primary-400 text-xs font-mono">{[98.4, 84.2, 71.8][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features bento */}
        <section id="features" className="py-24 px-8 max-w-[1280px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-[40px] text-white tracking-tight mb-3">Engineered for Enterprise</h2>
            <p className="text-white/40 max-w-xl mx-auto text-[15px] leading-relaxed">
              Infrastructure built for the world's most demanding recruiting teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-7 flex flex-col justify-between relative overflow-hidden group">
              <div className="z-10">
                <Brain className="w-8 h-8 text-primary-500 mb-5" />
                <h3 className="font-display text-2xl text-white mb-2">AI-Powered Screening</h3>
                <p className="text-white/50 text-[14px] leading-relaxed max-w-md">
                  Our proprietary model understands context, nuances in career growth, and latent technical potential — not just keywords.
                </p>
              </div>
              <div className="mt-8 flex gap-1 items-end h-24">
                {[40, 55, 35, 70, 85, 65, 90, 75, 95, 80].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary-500/25 group-hover:bg-primary-500/35 rounded-t-sm transition-colors" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-primary-500/10 to-transparent pointer-events-none" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <Shield className="w-8 h-8 text-white mb-5" />
                <h3 className="font-display text-2xl text-white mb-2">Enterprise Security</h3>
                <p className="text-white/50 text-[14px] leading-relaxed">SOC2 Type II compliant with end-to-end encryption. Your data never leaves your private cloud instance.</p>
              </div>
              <ul className="mt-5 space-y-2">
                {['GDPR Ready', 'Single Sign-On', 'Zero Trust Network'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-white/40 text-[11px] font-bold uppercase tracking-wider">
                    <CheckCircle className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-7">
              <Globe className="w-8 h-8 text-white/50 mb-5" />
              <h3 className="font-display text-2xl text-white mb-2">Global Scale</h3>
              <p className="text-white/40 text-[14px]">Supports 40+ languages including 10+ Indian regional languages for market-native hiring.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-7">
              <BarChart3 className="w-8 h-8 text-white/50 mb-5" />
              <h3 className="font-display text-2xl text-white mb-2">Deep Analytics</h3>
              <p className="text-white/40 text-[14px]">Comprehensive scoring across technical, communication, and problem-solving with actionable bias reporting.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-7 flex items-center gap-6">
              <div className="grid grid-cols-2 gap-2 shrink-0">
                {['ATS', 'HRIS', 'CRM', 'Slack'].map((t) => (
                  <div key={t} className="w-11 h-11 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-[10px] font-bold">{t}</div>
                ))}
              </div>
              <div>
                <h3 className="font-display text-xl text-white mb-1">Seamless Integrations</h3>
                <p className="text-white/40 text-[13px]">Connect with your existing tech stack in minutes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="py-10 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-[1280px] mx-auto px-8">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-8">
              Trusted by high-growth engineering teams
            </p>
            <div className="flex flex-wrap justify-center gap-12 opacity-25">
              {['Zomato', 'Ola', 'Swiggy', 'PolicyBazaar', 'Meesho'].map((name) => (
                <span key={name} className="text-white font-bold text-xl tracking-tight">{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-24 px-8 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-14 items-center">
            <div className="lg:col-span-2">
              <div className="bg-white/5 border border-white/10 rounded-xl h-80 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 rounded-full bg-white/10 mx-auto" />
                  <p className="text-white/20 text-[10px] uppercase tracking-widest">Executive Portrait</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 flex flex-col gap-6">
              <Quote className="w-10 h-10 text-primary-500" />
              <blockquote className="font-display text-[32px] text-white italic leading-tight">
                "InterviewAI didn't just speed up our hiring — it fundamentally improved the quality of our engineering culture by removing bias and identifying potential we would have missed."
              </blockquote>
              <div>
                <p className="text-white font-semibold">Marcus Thorne</p>
                <p className="text-white/40 text-sm">VP Engineering, DataStride</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA — emerald block */}
        <section className="py-20 px-8 mb-20">
          <div className="max-w-[1280px] mx-auto">
            <div
              className="relative overflow-hidden bg-primary-500 rounded-3xl p-16 flex flex-col items-center text-center gap-6"
            >
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px,transparent 1px)', backgroundSize: '20px 20px' }}
              />
              <h2 className="font-display text-[48px] text-[#0f172a] font-bold relative z-10 leading-tight">
                Ready to engineer<br />your future team?
              </h2>
              <p className="text-[#0f172a]/60 text-[17px] max-w-xl relative z-10 leading-relaxed">
                Join 500+ global enterprises using InterviewAI to scale their precision hiring.
              </p>
              <div className="flex flex-wrap gap-4 relative z-10">
                <Link
                  to="/register"
                  className="bg-[#0f172a] text-white px-10 py-4 rounded-xl font-semibold text-[15px] hover:scale-105 transition-transform"
                >
                  Request a Demo
                </Link>
                <a
                  href="#"
                  className="bg-white/20 text-[#0f172a] border border-[#0f172a]/10 px-10 py-4 rounded-xl font-semibold text-[15px] hover:bg-white/30 transition-colors"
                >
                  Talk to Sales
                </a>
              </div>
              <div className="flex items-center gap-2 text-[#0f172a]/50 text-sm relative z-10">
                <Zap className="w-4 h-4" />
                No credit card required · 14-day free trial
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="max-w-[1280px] mx-auto px-8 flex items-center justify-between">
          <span className="font-display italic text-white text-[16px]">InterviewAI</span>
          <p className="text-white/20 text-[11px] uppercase tracking-widest">Built with Sarvam AI & Claude. For Indian startups.</p>
        </div>
      </footer>
    </div>
  )
}
