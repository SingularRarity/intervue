import { Link } from 'react-router-dom'
import { Mic, Brain, BarChart3, Shield, Zap, Globe, ArrowRight, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Mic,
      title: 'Voice-Powered Interviews',
      description: 'Conduct natural voice interviews in 10+ Indian languages using Sarvam AI. Candidates speak, AI listens and responds.',
    },
    {
      icon: Brain,
      title: 'Claude-Powered Intelligence',
      description: 'Advanced question generation and candidate evaluation powered by Anthropic Claude. Context-aware follow-ups.',
    },
    {
      icon: BarChart3,
      title: 'Deep Analytics',
      description: 'Comprehensive scoring across technical, communication, and problem-solving dimensions with actionable insights.',
    },
    {
      icon: Shield,
      title: 'Multi-Tenant & Secure',
      description: 'Each company brings their own API keys. Complete data isolation between tenants. Enterprise-grade security.',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get detailed interview reports with scores, strengths, weaknesses, and hiring recommendations within seconds.',
    },
    {
      icon: Globe,
      title: 'Indian Languages',
      description: 'Support for Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam and more.',
    },
  ]

  const stats = [
    { value: '10+', label: 'Indian Languages' },
    { value: '<5 min', label: 'Setup Time' },
    { value: '95%', label: 'Accuracy Rate' },
    { value: '0', label: 'Hiring Bias' },
  ]

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Navbar */}
      <nav className="border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">InterviewAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-dark-300 hover:text-white font-medium transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-600/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600/10 border border-primary-600/20 rounded-full text-primary-400 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              Now with Sarvam AI Voice Integration
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Screen Candidates Smarter with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                AI Voice Interviews
              </span>
            </h1>
            <p className="text-xl text-dark-400 mb-10 max-w-2xl mx-auto">
              Paste a resume or job description. Our AI conducts a natural voice interview 
              and delivers instant scoring, strengths, weaknesses, and a hiring recommendation.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="w-5 h-5 inline ml-2" />
              </Link>
              <a href="#features" className="btn-secondary text-lg px-8 py-4">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-dark-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-dark-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need for Smart Hiring
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              A complete AI interview platform designed for Indian startups and enterprises
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="card group">
                <div className="w-12 h-12 bg-primary-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-dark-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-dark-400 text-lg">From setup to hire recommendation in 4 simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Create Template', desc: 'Define role, skills, and difficulty level' },
              { step: '02', title: 'Add Candidate', desc: 'Upload resume or paste candidate details' },
              { step: '03', title: 'AI Interview', desc: 'Candidate speaks naturally with AI interviewer' },
              { step: '04', title: 'Get Results', desc: 'Instant scoring and hiring recommendation' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary-600/10 border border-primary-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-400">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-dark-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass-panel p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-dark-400 text-lg mb-8">
              Join startups in Bangalore, Hyderabad, Chennai, and Gurgaon already using InterviewAI 
              to screen candidates faster and fairer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Get Started Free
              </Link>
              <div className="flex items-center gap-2 text-dark-400">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">InterviewAI</span>
            </div>
            <p className="text-dark-500 text-sm">
              Built with Sarvam AI & Claude. For Indian startups.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
