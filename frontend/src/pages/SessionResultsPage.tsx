import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, Star, Award, TrendingUp, TrendingDown, 
  MessageSquare, ThumbsUp, ThumbsDown, Loader2, Send 
} from 'lucide-react'
import { interviewApi } from '@/lib/api'
import { getScoreColor, getScoreBg } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SessionResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState(3)
  const [override, setOverride] = useState('')

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['session-results', sessionId],
    queryFn: () => interviewApi.getSessionResults(sessionId!).then(r => r.data),
    enabled: !!sessionId,
  })

  const feedbackMutation = useMutation({
    mutationFn: (data: any) => interviewApi.submitFeedback(sessionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-results', sessionId] })
      setFeedback('')
      setOverride('')
      toast.success('Feedback submitted')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to submit feedback'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  const report = data?.analysis
  const session = data?.session

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-dark-900">Interview Results</h1>
          <p className="text-dark-400">{session?.candidate_name} - {session?.template_title}</p>
        </div>
      </div>

      {/* Overall Score */}
      {report && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-dark-900">Overall Assessment</h2>
            <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${getScoreBg(report.overall_score)} ${getScoreColor(report.overall_score)}`}>
              {report.recommendation}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ScoreCard label="Overall" score={report.overall_score} icon={Award} />
            <ScoreCard label="Technical" score={report.technical_score} icon={TrendingUp} />
            <ScoreCard label="Communication" score={report.communication_score} icon={MessageSquare} />
            <ScoreCard label="Problem Solving" score={report.problem_solving_score} icon={Star} />
          </div>
        </div>
      )}

      {/* Skill Assessments */}
      {report?.skill_assessments?.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-6">Skill Assessments</h2>
          <div className="space-y-4">
            {report.skill_assessments.map((skill: any, index: number) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-dark-300">{skill.skill}</div>
                <div className="flex-1 h-2 bg-dark-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      skill.score >= 80 ? 'bg-emerald-500' :
                      skill.score >= 60 ? 'bg-amber-500' :
                      skill.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className={`font-bold ${getScoreColor(skill.score)}`}>{skill.score.toFixed(0)}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg ${
                  skill.level === 'Expert' ? 'bg-emerald-500/10 text-emerald-400' :
                  skill.level === 'Proficient' ? 'bg-primary-500/10 text-primary-400' :
                  skill.level === 'Developing' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {skill.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-dark-900">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {report.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-dark-300">
                  <span className="text-emerald-400 mt-1">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsDown className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-dark-900">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2">
              {report.weaknesses.map((w: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-dark-300">
                  <span className="text-red-400 mt-1">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Detailed Feedback */}
      {report?.detailed_feedback && (
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Detailed Feedback</h2>
          <div className="prose prose-invert max-w-none">
            {report.detailed_feedback.split('\n\n').map((paragraph: string, i: number) => (
              <p key={i} className="text-dark-300 leading-relaxed mb-4">{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      {session?.transcript && (
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Interview Transcript</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {session.transcript.map((msg: any, i: number) => (
              <div key={i} className={`p-3 rounded-xl ${
                msg.role === 'interviewer' ? 'bg-dark-100 border border-dark-200' : 'bg-primary-50'
              }`}>
                <span className={`text-xs font-medium ${
                  msg.role === 'interviewer' ? 'text-primary-400' : 'text-emerald-400'
                }`}>
                  {msg.role === 'interviewer' ? 'AI Interviewer' : 'Candidate'}
                </span>
                <p className="text-dark-300 text-sm mt-1">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Feedback */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">Your Review</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Override AI Recommendation</label>
            <select
              value={override}
              onChange={(e) => setOverride(e.target.value)}
              className="input-field"
            >
              <option value="">Use AI recommendation</option>
              <option value="Strong Hire">Strong Hire</option>
              <option value="Hire">Hire</option>
              <option value="Maybe">Maybe</option>
              <option value="No Hire">No Hire</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-lg transition-colors ${
                    star <= rating ? 'text-amber-400 bg-amber-500/10' : 'text-dark-600 hover:text-dark-400'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Notes</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="input-field min-h-[100px]"
              placeholder="Add your observations and notes..."
            />
          </div>

          <button
            onClick={() => feedbackMutation.mutate({
              reviewer_notes: feedback,
              human_override: override || null,
              rating,
            })}
            disabled={feedbackMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {feedbackMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Review
          </button>
        </div>
      </div>
    </div>
  )
}

function ScoreCard({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  return (
    <div className="text-center p-4 bg-dark-50 border border-dark-200 rounded-xl">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${getScoreColor(score)}`} />
      <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score.toFixed(0)}</div>
      <div className="text-sm text-dark-400 mt-1">{label}</div>
    </div>
  )
}
