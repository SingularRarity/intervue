import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Code2, Send, ChevronLeft } from 'lucide-react'
import api from '@/lib/api'

interface CodingChallenge {
  title: string
  description: string
  examples: Array<{ input: string; output: string }>
  constraints: string[]
  starter_code?: Record<string, string>
}

const LANGUAGES = ['python', 'javascript', 'typescript', 'java', 'rust', 'go', 'cpp']

export default function CodeAssessmentPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState<CodingChallenge | null>(null)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get(`/sessions/${sessionId}/coding`)
      .then((res) => {
        const c = res.data.challenge as CodingChallenge | null
        setChallenge(c)
        if (c?.starter_code?.[language]) setCode(c.starter_code[language])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    if (challenge?.starter_code?.[lang]) setCode(challenge.starter_code[lang])
    else setCode('')
  }

  const submitCode = async () => {
    if (!code.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/sessions/${sessionId}/coding/submit`, { language, code })
      setSubmitted(true)
    } catch {
      // handle error
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-dark-400">Loading challenge...</div>

  if (!challenge) {
    return (
      <div className="text-center py-20">
        <Code2 className="w-12 h-12 text-dark-600 mx-auto mb-4" />
        <p className="text-dark-400">No coding challenge configured for this session.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary-400 hover:underline text-sm">
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <div className="bg-dark-900 border-b border-dark-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-dark-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Code2 className="w-5 h-5 text-primary-400" />
        <span className="text-white font-semibold">Coding Assessment</span>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="ml-auto bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 flex">
        {/* Problem Panel */}
        <div className="w-96 flex-shrink-0 bg-dark-900 border-r border-dark-800 p-6 overflow-y-auto">
          <h2 className="text-white font-bold text-lg mb-3">{challenge.title}</h2>
          <p className="text-dark-300 text-sm mb-4 whitespace-pre-wrap">{challenge.description}</p>

          {challenge.examples.length > 0 && (
            <div className="mb-4">
              <p className="text-dark-400 text-xs font-semibold uppercase tracking-wide mb-2">Examples</p>
              {challenge.examples.map((ex, i) => (
                <div key={i} className="bg-dark-800 rounded-lg p-3 mb-2 text-xs font-mono">
                  <p className="text-dark-300">Input: <span className="text-white">{ex.input}</span></p>
                  <p className="text-dark-300">Output: <span className="text-white">{ex.output}</span></p>
                </div>
              ))}
            </div>
          )}

          {challenge.constraints.length > 0 && (
            <div>
              <p className="text-dark-400 text-xs font-semibold uppercase tracking-wide mb-2">Constraints</p>
              <ul className="space-y-1">
                {challenge.constraints.map((c, i) => (
                  <li key={i} className="text-dark-300 text-xs">• {c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-dark-950 text-green-300 font-mono text-sm p-6 resize-none focus:outline-none"
            placeholder={`Write your ${language} solution here...`}
            disabled={submitted}
          />
          <div className="bg-dark-900 border-t border-dark-800 px-6 py-4 flex items-center justify-between">
            {submitted ? (
              <span className="text-green-400 font-medium">Solution submitted!</span>
            ) : (
              <span className="text-dark-500 text-sm">{code.split('\n').length} lines</span>
            )}
            {!submitted && (
              <button
                onClick={submitCode}
                disabled={submitting || !code.trim()}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Solution'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
