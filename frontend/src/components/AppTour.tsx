import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

interface TourStep {
  target: string
  title: string
  body: string
  position: 'right' | 'bottom' | 'top'
}

const STEPS: TourStep[] = [
  {
    target: '[data-tour="nav-interviews"]',
    title: 'Interview Templates',
    body: 'Start here. Create a template for any role — upload a JD and AI auto-fills the title, topics, difficulty, and interview type in seconds.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-candidates"]',
    title: 'Candidates',
    body: 'Add candidates, paste their resume for AI parsing, then click "Start Interview" to launch an AI-powered session against any template.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-dashboard"]',
    title: 'Dashboard',
    body: 'Your command centre — recent interview sessions, completion rates, average scores, and your candidate pipeline at a glance.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-analytics"]',
    title: 'Analytics',
    body: 'Drill into session-level data: scores over time, top assessed skills, and candidate comparison across roles.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-team"]',
    title: 'Team',
    body: 'Invite your hiring managers and recruiters. Each gets role-based access — admin, reviewer, or viewer.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-settings"]',
    title: 'Settings & API Keys',
    body: 'On paid plans, bring your own Claude and Sarvam AI keys for full control. Free plan uses platform keys — no setup needed.',
    position: 'right',
  },
]

const PAD = 8
const TOOLTIP_W = 288

export const TOUR_DONE_KEY = (id: string) => `tour_done_${id}`

interface Rect { top: number; left: number; width: number; height: number }

function useElementRect(selector: string, step: number) {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    const measure = () => {
      const el = document.querySelector(selector)
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [selector, step])

  return rect
}

function tooltipPosition(rect: Rect, pos: TourStep['position']) {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const GAP = 14

  if (pos === 'right') {
    return {
      top: Math.max(16, cy - 100),
      left: rect.left + rect.width + GAP,
    }
  }
  if (pos === 'bottom') {
    return {
      top: rect.top + rect.height + GAP,
      left: Math.max(16, cx - TOOLTIP_W / 2),
    }
  }
  // top
  return {
    top: rect.top - GAP - 200,
    left: Math.max(16, cx - TOOLTIP_W / 2),
  }
}

interface Props {
  tenantId: string
  onDone: () => void
}

export default function AppTour({ tenantId, onDone }: Props) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const rect = useElementRect(current.target, step)

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_DONE_KEY(tenantId), '1')
    onDone()
  }, [tenantId, onDone])

  // Keyboard navigation
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      if (e.key === 'ArrowRight' && step < STEPS.length - 1) setStep(s => s + 1)
      if (e.key === 'ArrowLeft' && step > 0) setStep(s => s - 1)
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [step, finish])

  if (!rect) return null

  const tPos = tooltipPosition(rect, current.position)
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Arrow direction
  const arrowRight = current.position === 'right'

  return createPortal(
    <>
      {/* Backdrop with spotlight cutout */}
      <svg
        className="fixed inset-0 z-[9990] pointer-events-none"
        width={vw}
        height={vh}
        style={{ display: 'block' }}
      >
        <defs>
          <mask id="spotlight">
            <rect width={vw} height={vh} fill="white" />
            <rect
              x={rect.left - PAD}
              y={rect.top - PAD}
              width={rect.width + PAD * 2}
              height={rect.height + PAD * 2}
              rx={10}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width={vw}
          height={vh}
          fill="rgba(15,17,26,0.62)"
          mask="url(#spotlight)"
        />
        {/* Spotlight ring */}
        <rect
          x={rect.left - PAD}
          y={rect.top - PAD}
          width={rect.width + PAD * 2}
          height={rect.height + PAD * 2}
          rx={10}
          fill="none"
          stroke="rgba(99,102,241,0.6)"
          strokeWidth={2}
        />
      </svg>

      {/* Click-blocker (prevents clicking behind overlay) */}
      <div
        className="fixed inset-0 z-[9991]"
        onClick={finish}
        style={{ cursor: 'default' }}
      />

      {/* Tooltip card */}
      <div
        className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-dark-100 overflow-hidden"
        style={{ width: TOOLTIP_W, top: tPos.top, left: tPos.left }}
        onClick={e => e.stopPropagation()}
      >
        {/* Arrow */}
        {arrowRight && (
          <div
            className="absolute w-3 h-3 bg-white border-l border-b border-dark-100 rotate-45"
            style={{ left: -7, top: 100 }}
          />
        )}

        {/* Progress bar */}
        <div className="h-1 bg-dark-100">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary-500">
              Step {step + 1} of {STEPS.length}
            </span>
            <button
              onClick={finish}
              className="text-dark-300 hover:text-dark-600 transition-colors -mt-0.5 -mr-0.5 p-1 rounded-md hover:bg-dark-50"
              title="Skip tour (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h3 className="font-semibold text-dark-900 text-[16px] mb-2 leading-tight">
            {current.title}
          </h3>
          <p className="text-dark-500 text-[13px] leading-relaxed mb-5">
            {current.body}
          </p>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === step ? 'w-5 bg-primary-500' : 'w-1.5 bg-dark-200 hover:bg-dark-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 text-[12px] font-medium text-dark-500 hover:text-dark-800 px-3 py-2 rounded-xl border border-dark-200 hover:border-dark-300 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : finish()}
              className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-xl transition-colors"
            >
              {step < STEPS.length - 1 ? (
                <>Next <ChevronRight className="w-3.5 h-3.5" /></>
              ) : (
                "Let's go!"
              )}
            </button>
          </div>

          <p className="text-center text-[10px] text-dark-300 mt-3">
            ← → arrow keys · Esc to skip
          </p>
        </div>
      </div>
    </>,
    document.body
  )
}
