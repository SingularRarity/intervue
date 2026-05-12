import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, Edit2, Trash2, Loader2, X, FileText, Clock, BarChart3,
  ChevronRight, BookOpen, Search, Check, Users, Mic, Code2, Brain,
  Upload, Sparkles,
} from 'lucide-react'
import { interviewApi, questionsApi, jdApi } from '@/lib/api'
import { languages } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

const TYPE_ICONS: Record<string, React.ElementType> = {
  Technical: Code2,
  Behavioral: Brain,
  Mixed: BarChart3,
  CultureFit: Users,
  Screening: Mic,
}

const TYPE_COLORS: Record<string, string> = {
  Technical:   'bg-violet-100 text-violet-700',
  Behavioral:  'bg-blue-100 text-blue-700',
  Mixed:       'bg-primary-100 text-primary-700',
  CultureFit:  'bg-amber-100 text-amber-700',
  Screening:   'bg-emerald-100 text-emerald-700',
}

const DIFF_COLORS: Record<string, string> = {
  Easy:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard:   'bg-red-50 text-red-700 border-red-200',
  Expert: 'bg-purple-50 text-purple-700 border-purple-200',
}

const CATEGORIES = [
  'Adaptability','Career Goals','Communication','Conflict Resolution',
  'Culture Fit','Customer Service','Data & Analytics','Decision Making',
  'Ethics & Integrity','Innovation','Leadership','Motivation',
  'Problem Solving','Product Thinking','Strategy & Business',
  'Stress Management','Team Collaboration','Technical','Work Style',
]

const BLANK_FORM = {
  title: '',
  description: '',
  interview_type: 'Mixed',
  difficulty: 'Medium',
  duration_minutes: 30,
  language: 'en',
  topics: [] as string[],
  custom_questions: [] as { question: string; category: string }[],
}

export default function TemplatesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...BLANK_FORM })
  const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details')
  const [jdParsing, setJdParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Question bank state
  const [bankCategory, setBankCategory] = useState('')
  const [bankDifficulty, setBankDifficulty] = useState('')
  const [bankSearch, setBankSearch] = useState('')

  const { plan } = useAuthStore()
  const queryClient = useQueryClient()

  // Auto-open modal when ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      resetForm()
      setEditingId(null)
      setShowModal(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => interviewApi.getTemplates().then(r => r.data),
  })

  const effectiveBankDifficulty = (plan === 'free' && bankDifficulty && !['Easy', 'Medium'].includes(bankDifficulty))
    ? 'Medium'
    : bankDifficulty

  const { data: bankData, isFetching: bankFetching } = useQuery({
    queryKey: ['questions', bankCategory, effectiveBankDifficulty, bankSearch],
    queryFn: () => questionsApi.list({
      category: bankCategory || undefined,
      difficulty: effectiveBankDifficulty || undefined,
      q: bankSearch || undefined,
      limit: plan === 'free' ? 10 : 30,
    }).then(r => r.data),
    enabled: showModal && activeTab === 'questions',
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => interviewApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setShowModal(false)
      resetForm()
      toast.success('Template created')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create template'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => interviewApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setShowModal(false)
      setEditingId(null)
      resetForm()
      toast.success('Template updated')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update template'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interviewApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template deleted')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete template'),
  })

  const parseJdMutation = useMutation({
    mutationFn: (file: File) => jdApi.parseFile(file).then(r => r.data),
    onSuccess: (data: any) => {
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        description: data.summary || f.description,
        topics: data.topics?.length ? data.topics : f.topics,
        difficulty: plan === 'free' && !['Easy', 'Medium'].includes(data.difficulty) ? 'Medium' : (data.difficulty || f.difficulty),
        interview_type: plan === 'free' ? 'Screening' : (data.interview_type || f.interview_type),
        duration_minutes: plan === 'free' ? 10 : (data.duration_minutes || f.duration_minutes),
      }))
      toast.success('JD parsed — form auto-filled')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to parse JD'),
    onSettled: () => setJdParsing(false),
  })

  const handleJdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setJdParsing(true)
    parseJdMutation.mutate(file)
    e.target.value = ''
  }

  const resetForm = () => {
    setForm({
      ...BLANK_FORM,
      duration_minutes: plan === 'free' ? 10 : 30,
      interview_type: plan === 'free' ? 'Screening' : BLANK_FORM.interview_type,
    })
    setActiveTab('details')
    setBankCategory('')
    setBankDifficulty('')
    setBankSearch('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      custom_questions: form.custom_questions.map(q => ({ question: q.question, ideal_answer: '' })),
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (template: any) => {
    setForm({
      title: template.title,
      description: template.description || '',
      interview_type: template.interview_type,
      difficulty: template.difficulty,
      duration_minutes: plan === 'free' ? 10 : template.duration_minutes,
      interview_type: plan === 'free' ? 'Screening' : template.interview_type,
      difficulty: plan === 'free' && !['Easy', 'Medium'].includes(template.difficulty) ? 'Medium' : template.difficulty,
      language: template.language,
      topics: template.topics || [],
      custom_questions: (template.custom_questions || []).map((q: any) =>
        typeof q === 'string' ? { question: q, category: '' } : q
      ),
    })
    setEditingId(template.id)
    setActiveTab('details')
    setShowModal(true)
  }

  const openNew = () => {
    resetForm()
    setEditingId(null)
    setShowModal(true)
  }

  const FREE_QUESTION_LIMIT = 5

  const toggleBankQuestion = (q: { question: string; category: string }) => {
    const exists = form.custom_questions.some(cq => cq.question === q.question)
    if (exists) {
      setForm({ ...form, custom_questions: form.custom_questions.filter(cq => cq.question !== q.question) })
    } else {
      if (plan === 'free' && form.custom_questions.length >= FREE_QUESTION_LIMIT) {
        toast.error(`Free tier is limited to ${FREE_QUESTION_LIMIT} questions. Upgrade to add more.`)
        return
      }
      setForm({ ...form, custom_questions: [...form.custom_questions, q] })
    }
  }

  const addTopic = () => setForm({ ...form, topics: [...form.topics, ''] })
  const updateTopic = (i: number, v: string) => {
    const t = [...form.topics]; t[i] = v
    setForm({ ...form, topics: t })
  }
  const removeTopic = (i: number) => setForm({ ...form, topics: form.topics.filter((_, idx) => idx !== i) })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900 tracking-tight">Interview Templates</h1>
          <p className="text-dark-400 mt-0.5 text-sm">
            {templates?.length ?? 0} template{templates?.length !== 1 ? 's' : ''} · Powered by your question bank
          </p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Grid */}
      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {templates.map((template: any) => {
            const TypeIcon = TYPE_ICONS[template.interview_type] ?? FileText
            const typeColor = TYPE_COLORS[template.interview_type] ?? 'bg-dark-100 text-dark-600'
            const diffColor = DIFF_COLORS[template.difficulty] ?? 'bg-dark-50 text-dark-600 border-dark-200'
            return (
              <div
                key={template.id}
                className="card group flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleEdit(template)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${typeColor}`}>
                    <TypeIcon className="w-3 h-3" />
                    {template.interview_type}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(template) }}
                      className="p-1.5 text-dark-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Delete this template?')) deleteMutation.mutate(template.id)
                      }}
                      className="p-1.5 text-dark-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-dark-900 text-[15px] mb-1 leading-snug">{template.title}</h3>
                <p className="text-dark-400 text-[13px] mb-4 line-clamp-2 flex-1">
                  {template.description || 'No description'}
                </p>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${diffColor}`}>
                    {template.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-[12px] text-dark-500">
                    <Clock className="w-3.5 h-3.5" />
                    {template.duration_minutes} min
                  </span>
                  {template.custom_questions?.length > 0 && (
                    <span className="flex items-center gap-1 text-[12px] text-dark-500">
                      <BookOpen className="w-3.5 h-3.5" />
                      {template.custom_questions.length} seeded Q
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {template.topics?.slice(0, 4).map((topic: string) => (
                    <span key={topic} className="px-2 py-0.5 bg-dark-50 border border-dark-100 rounded text-[11px] text-dark-600">
                      {topic}
                    </span>
                  ))}
                  {template.topics?.length > 4 && (
                    <span className="px-2 py-0.5 bg-dark-50 border border-dark-100 rounded text-[11px] text-dark-400">
                      +{template.topics.length - 4}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-dark-100 flex items-center justify-between">
                  <span className="text-[11px] text-dark-400">
                    {languages.find(l => l.code === template.language)?.name || template.language}
                  </span>
                  <span className="text-[11px] text-primary-500 font-medium flex items-center gap-0.5">
                    Edit <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
            <FileText className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold text-dark-900 mb-2">No templates yet</h3>
          <p className="text-dark-400 text-sm mb-6 max-w-sm">
            Create your first interview template. Browse our question bank of curated HR questions to get started fast.
          </p>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-dark-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[17px] font-semibold text-dark-900">
                  {editingId ? 'Edit Template' : 'New Interview Template'}
                </h2>
                {form.custom_questions.length > 0 && (
                  <p className="text-[12px] text-primary-500 mt-0.5">
                    {form.custom_questions.length} question{form.custom_questions.length !== 1 ? 's' : ''} selected from bank
                  </p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-dark-700 p-1 rounded-lg hover:bg-dark-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-dark-100 shrink-0">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-3 text-[13px] font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'text-primary-600 border-b-2 border-primary-500'
                    : 'text-dark-500 hover:text-dark-700'
                }`}
              >
                Template Details
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`flex-1 py-3 text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'questions'
                    ? 'text-primary-600 border-b-2 border-primary-500'
                    : 'text-dark-500 hover:text-dark-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Question Bank
                {form.custom_questions.length > 0 && (
                  <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {form.custom_questions.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Details tab */}
              {activeTab === 'details' && (
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* JD Auto-fill */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 border border-dark-100 border-dashed">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.doc,.docx,.pdf"
                      onChange={handleJdUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={jdParsing}
                      className="flex items-center gap-2 btn-secondary text-sm disabled:opacity-50"
                    >
                      {jdParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {jdParsing ? 'Parsing JD...' : 'Upload JD'}
                    </button>
                    <span className="text-[12px] text-dark-400 flex-1">
                      Upload a JD to auto-fill · supports .docx, .pdf, .txt
                    </span>
                    {jdParsing && <Sparkles className="w-4 h-4 text-primary-400 animate-pulse" />}
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Role / Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Senior React Developer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="input-field min-h-[72px] resize-none"
                      placeholder="Brief description of the role and interview focus..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Interview Type</label>
                      {plan === 'free' ? (
                        <div className="input-field flex items-center justify-between cursor-not-allowed opacity-70">
                          <span className="text-dark-200">Screening</span>
                          <span className="text-[11px] text-primary-400 font-medium">Upgrade to unlock</span>
                        </div>
                      ) : (
                        <select
                          value={form.interview_type}
                          onChange={(e) => setForm({ ...form, interview_type: e.target.value })}
                          className="input-field"
                        >
                          <option value="Technical">Technical</option>
                          <option value="Behavioral">Behavioral</option>
                          <option value="Mixed">Mixed</option>
                          <option value="CultureFit">Culture Fit</option>
                          <option value="Screening">Screening</option>
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Difficulty</label>
                      <select
                        value={form.difficulty}
                        onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                        className="input-field"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        {plan !== 'free' && <option value="Hard">Hard</option>}
                        {plan !== 'free' && <option value="Expert">Expert</option>}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Duration (minutes)</label>
                      {plan === 'free' ? (
                        <div className="input-field flex items-center justify-between cursor-not-allowed opacity-70">
                          <span className="text-dark-200">10 min</span>
                          <span className="text-[11px] text-primary-400 font-medium">Upgrade to unlock</span>
                        </div>
                      ) : (
                        <select
                          value={form.duration_minutes}
                          onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                          className="input-field"
                        >
                          <option value={30}>30 min</option>
                          <option value={60}>60 min</option>
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Language</label>
                      <select
                        value={form.language}
                        onChange={(e) => setForm({ ...form, language: e.target.value })}
                        className="input-field"
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Topics / Skills</label>
                    <div className="space-y-2">
                      {form.topics.map((topic, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={topic}
                            onChange={(e) => updateTopic(index, e.target.value)}
                            className="input-field flex-1"
                            placeholder="e.g., React, System Design, SQL"
                          />
                          <button type="button" onClick={() => removeTopic(index)} className="p-2 text-dark-400 hover:text-red-400">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addTopic} className="text-primary-500 hover:text-primary-600 text-[13px] font-medium">
                        + Add topic
                      </button>
                    </div>
                  </div>

                  {/* Selected questions preview */}
                  {form.custom_questions.length > 0 && (
                    <div>
                      <label className="block text-[12px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">
                        Seeded Questions ({form.custom_questions.length})
                      </label>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {form.custom_questions.map((q, i) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 bg-primary-50 rounded-lg">
                            <span className="text-[12px] text-dark-700 flex-1 leading-snug">{q.question}</span>
                            <button
                              type="button"
                              onClick={() => toggleBankQuestion(q)}
                              className="text-dark-400 hover:text-red-400 shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('questions')}
                        className="text-[12px] text-primary-500 hover:text-primary-600 font-medium mt-1.5"
                      >
                        Browse more →
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="btn-primary flex items-center gap-2"
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {editingId ? 'Update' : 'Create'} Template
                    </button>
                  </div>
                </form>
              )}

              {/* Question Bank tab */}
              {activeTab === 'questions' && (
                <div className="p-6 space-y-4">
                  <p className="text-[13px] text-dark-500">
                    Select questions to seed the AI. The interviewer will use these as a starting point and ask intelligent follow-ups.
                  </p>

                  {/* Filters */}
                  <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[160px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400" />
                      <input
                        type="text"
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        placeholder="Search questions..."
                        className="input-field pl-8 text-[13px]"
                      />
                    </div>
                    <select
                      value={bankCategory}
                      onChange={(e) => setBankCategory(e.target.value)}
                      className="input-field text-[13px] min-w-[150px]"
                    >
                      <option value="">All categories</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                      value={bankDifficulty}
                      onChange={(e) => setBankDifficulty(e.target.value)}
                      className="input-field text-[13px]"
                    >
                      <option value="">Any difficulty</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      {plan !== 'free' && <option value="Hard">Hard</option>}
                      {plan !== 'free' && <option value="Expert">Expert</option>}
                    </select>
                  </div>

                  {/* Results */}
                  {bankFetching ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {bankData?.questions?.length === 0 && (
                        <p className="text-center text-dark-400 text-sm py-8">No questions match your filters.</p>
                      )}
                      {bankData?.questions?.map((q: any, i: number) => {
                        const selected = form.custom_questions.some(cq => cq.question === q.question)
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleBankQuestion({ question: q.question, category: q.category })}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                              selected
                                ? 'border-primary-300 bg-primary-50'
                                : 'border-dark-100 hover:border-dark-200 hover:bg-dark-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                selected ? 'bg-primary-500 border-primary-500' : 'border-dark-200'
                              }`}>
                                {selected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-[13px] text-dark-800 leading-snug mb-1.5">{q.question}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wide text-dark-400 bg-dark-50 border border-dark-100 rounded px-1.5 py-0.5">
                                    {q.category}
                                  </span>
                                  <span className={`text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border ${DIFF_COLORS[q.difficulty] ?? ''}`}>
                                    {q.difficulty}
                                  </span>
                                  <span className="text-[10px] text-dark-400">{q.source_type}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-dark-100">
                    <p className="text-[12px] text-dark-400">
                      {form.custom_questions.length} selected
                      {plan === 'free' && (
                        <span className="ml-1 text-primary-400">
                          ({FREE_QUESTION_LIMIT - form.custom_questions.length} remaining on free tier)
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      Done — back to details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
