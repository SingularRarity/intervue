import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, MessageCircle, Users, Briefcase, FileText, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/lib/store'

type Step = 'community' | 'discovery' | 'team' | 'terms' | 'done'

const STEPS: Step[] = ['community', 'discovery', 'team', 'terms', 'done']

const STEP_LABELS: Record<Step, string> = {
  community: 'Community',
  discovery: 'Discovery',
  team: 'Your Team',
  terms: 'Terms',
  done: 'All Set',
}

const DISCOVERY_OPTIONS = [
  'LinkedIn / social media',
  'Google / web search',
  'A colleague recommended it',
  'HR community / forum',
  'YC / startup community',
  'Other',
]

const TEAM_SIZE_OPTIONS = ['1 (just me)', '2–5', '6–20', '21–50', '50+']
const HIRING_VOLUME_OPTIONS = ['1–5 hires/month', '6–20 hires/month', '21–50 hires/month', '50+ hires/month']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { tenant } = useAuthStore()

  const [step, setStep] = useState<Step>('community')
  const [discovery, setDiscovery] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [hiringVolume, setHiringVolume] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)

  const stepIndex = STEPS.indexOf(step)

  const next = () => {
    const nextStep = STEPS[stepIndex + 1]
    if (nextStep) setStep(nextStep)
  }

  const finish = () => {
    if (tenant?.id) localStorage.setItem(`onboarding_done_${tenant.id}`, '1')
    navigate('/dashboard')
  }

  const companyName = tenant?.company_name ?? 'there'

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center px-4 py-12">
      {/* Progress bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center gap-2 mb-3">
          {STEPS.filter(s => s !== 'done').map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i < stepIndex ? 'bg-primary-500' : i === stepIndex ? 'bg-primary-400' : 'bg-dark-200'
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] text-dark-400 uppercase tracking-wider font-medium text-center">
          {STEP_LABELS[step]}
        </p>
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-dark-100 overflow-hidden">
        {/* Community step */}
        {step === 'community' && (
          <div className="p-8">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-6">
              <MessageCircle className="w-6 h-6 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-dark-900 mb-2">
              Welcome, {companyName}!
            </h1>
            <p className="text-dark-500 mb-6 leading-relaxed">
              Join our early-access community. Get product updates, share feedback, and connect with other HR teams shaping the future of hiring.
            </p>

            <div className="space-y-3 mb-8">
              <a
                href="https://discord.gg/9wbpzut9s"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 w-full p-4 rounded-xl border border-dark-100 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.07.11 18.086.12 18.096a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-semibold text-dark-900 group-hover:text-primary-600 transition-colors">Join Discord</p>
                  <p className="text-[12px] text-dark-400">Community discussions, tips, updates</p>
                </div>
                <ArrowRight className="w-4 h-4 text-dark-300 group-hover:text-primary-500 transition-colors" />
              </a>

              <a
                href="https://chat.whatsapp.com/Gtyhl4P1R0sLrpyueiBMXN"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 w-full p-4 rounded-xl border border-dark-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-semibold text-dark-900 group-hover:text-emerald-700 transition-colors">Join WhatsApp</p>
                  <p className="text-[12px] text-dark-400">Quick support, direct team access</p>
                </div>
                <ArrowRight className="w-4 h-4 text-dark-300 group-hover:text-emerald-500 transition-colors" />
              </a>
            </div>

            <button onClick={next} className="btn-primary w-full flex items-center justify-center gap-2">
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={next} className="w-full text-center mt-3 text-[12px] text-dark-400 hover:text-dark-600 transition-colors">
              Skip for now
            </button>
          </div>
        )}

        {/* Discovery step */}
        {step === 'discovery' && (
          <div className="p-8">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-dark-900 mb-2">How did you find us?</h1>
            <p className="text-dark-500 mb-6">This helps us improve how we reach teams like yours.</p>

            <div className="space-y-2 mb-8">
              {DISCOVERY_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setDiscovery(option)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-[13px] font-medium transition-all ${
                    discovery === option
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-dark-100 text-dark-700 hover:border-dark-200 hover:bg-dark-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <button
              onClick={next}
              disabled={!discovery}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Team step */}
        {step === 'team' && (
          <div className="p-8">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-dark-900 mb-2">Tell us about your team</h1>
            <p className="text-dark-500 mb-6">We'll tailor your experience to your hiring scale.</p>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-2">Recruiter team size</label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTeamSize(opt)}
                      className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${
                        teamSize === opt
                          ? 'border-primary-400 bg-primary-50 text-primary-700'
                          : 'border-dark-100 text-dark-600 hover:border-dark-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-2">Monthly hiring volume</label>
                <div className="flex flex-wrap gap-2">
                  {HIRING_VOLUME_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setHiringVolume(opt)}
                      className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${
                        hiringVolume === opt
                          ? 'border-primary-400 bg-primary-50 text-primary-700'
                          : 'border-dark-100 text-dark-600 hover:border-dark-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={next}
              disabled={!teamSize || !hiringVolume}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Terms step */}
        {step === 'terms' && (
          <div className="p-8">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-6">
              <FileText className="w-6 h-6 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-dark-900 mb-2">Before you dive in</h1>
            <p className="text-dark-500 mb-6">Review and accept our terms to activate your account.</p>

            <div className="bg-dark-50 rounded-xl p-5 mb-6 space-y-3 text-[13px] text-dark-600 leading-relaxed">
              <p><strong className="text-dark-900">Alpha software notice:</strong> Intervue is in active development. Features may change, and occasional downtime is expected. We do not recommend using it as your sole interview pipeline yet.</p>
              <p><strong className="text-dark-900">Data usage:</strong> Interview transcripts and candidate data are stored encrypted on our servers. We do not sell or share your data with third parties.</p>
              <p><strong className="text-dark-900">API keys:</strong> Your API keys (if provided) are encrypted at rest and used solely for conducting interviews on your behalf.</p>
            </div>

            <div className="space-y-3 mb-8">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    agreedToTerms ? 'bg-primary-500 border-primary-500' : 'border-dark-200 group-hover:border-primary-300'
                  }`}
                >
                  {agreedToTerms && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="text-[13px] text-dark-700">
                  I agree to the{' '}
                  <a href="https://singularraritylabs.com" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and understand this is alpha software
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  onClick={() => setAgreedToPrivacy(!agreedToPrivacy)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    agreedToPrivacy ? 'bg-primary-500 border-primary-500' : 'border-dark-200 group-hover:border-primary-300'
                  }`}
                >
                  {agreedToPrivacy && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="text-[13px] text-dark-700">
                  I agree to the{' '}
                  <a href="https://singularraritylabs.com" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
                    Privacy Policy
                  </a>{' '}
                  and consent to data processing as described above
                </span>
              </label>
            </div>

            <button
              onClick={next}
              disabled={!agreedToTerms || !agreedToPrivacy}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Accept & Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Done step */}
        {step === 'done' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Briefcase className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-dark-900 mb-2">You're all set!</h1>
            <p className="text-dark-500 mb-8 leading-relaxed">
              Your Intervue workspace is ready. Create your first interview template and start screening candidates in minutes.
            </p>

            <div className="space-y-3 text-left mb-8">
              {[
                'Create an interview template',
                'Add your first candidate',
                'Share the interview link',
                'Review AI-scored results',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">{i + 1}</span>
                  </div>
                  <span className="text-[13px] text-dark-700">{item}</span>
                </div>
              ))}
            </div>

            <button onClick={finish} className="btn-primary w-full flex items-center justify-center gap-2">
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Logo footer */}
      <div className="mt-8 flex items-center gap-1.5 text-dark-400 text-[12px]">
        <span className="font-display italic text-dark-600 text-[15px]">Intervue</span>
        <span>·</span>
        <a href="https://singularraritylabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-dark-600 transition-colors">
          SingularRarity Labs
        </a>
      </div>
    </div>
  )
}
