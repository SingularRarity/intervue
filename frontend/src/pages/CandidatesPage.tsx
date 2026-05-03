import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, X, User, Mail, Phone, Briefcase, Star, Mic } from 'lucide-react'
import { Link } from 'react-router-dom'
import { interviewApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function CandidatesPage() {
  const [showModal, setShowModal] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    resume_text: '',
    skills: [] as string[],
    experience_years: '',
    current_role: '',
    notes: '',
  })
  const [skillInput, setSkillInput] = useState('')

  const queryClient = useQueryClient()

  const { data: candidates, isLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => interviewApi.getCandidates().then(r => r.data),
  })

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => interviewApi.getTemplates().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => interviewApi.createCandidate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      setShowModal(false)
      resetForm()
      toast.success('Candidate added successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add candidate'),
  })

  const sessionMutation = useMutation({
    mutationFn: (data: any) => interviewApi.createSession(data),
    onSuccess: (res) => {
      setShowSessionModal(false)
      setSelectedCandidate(null)
      toast.success('Interview session created!')
      window.open(`/interview/${res.data.id}`, '_blank')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create session'),
  })

  const resetForm = () => {
    setForm({
      name: '', email: '', phone: '', resume_text: '',
      skills: [], experience_years: '', current_role: '', notes: '',
    })
    setSkillInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      experience_years: form.experience_years ? parseFloat(form.experience_years) : null,
    })
  }

  const addSkill = () => {
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      setForm({ ...form, skills: [...form.skills, skillInput.trim()] })
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setForm({ ...form, skills: form.skills.filter(s => s !== skill) })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-900">Candidates</h1>
          <p className="text-dark-400 mt-1">Manage candidates and start interviews</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Candidate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates?.map((candidate: any) => (
          <div key={candidate.id} className="card group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary-600/10 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-primary-400" />
              </div>
              <button
                onClick={() => {
                  if (confirm('Delete this candidate?')) {
                    // delete logic
                  }
                }}
                className="p-2 text-dark-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-lg font-semibold text-dark-900 mb-1">{candidate.name}</h3>
            <p className="text-dark-400 text-sm mb-4">{candidate.current_role || 'No role specified'}</p>

            <div className="space-y-2 text-sm text-dark-400 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {candidate.email}
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {candidate.phone}
                </div>
              )}
              {candidate.experience_years !== null && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {candidate.experience_years} years experience
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {candidate.skills?.slice(0, 5).map((skill: string) => (
                <span key={skill} className="px-2 py-1 bg-dark-100 rounded-md text-xs text-dark-700">
                  {skill}
                </span>
              ))}
              {candidate.skills?.length > 5 && (
                <span className="px-2 py-1 bg-dark-100 rounded-md text-xs text-dark-600">
                  +{candidate.skills.length - 5}
                </span>
              )}
            </div>

            <button
              onClick={() => { setSelectedCandidate(candidate); setShowSessionModal(true); }}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Start Interview
            </button>
          </div>
        ))}
      </div>

      {candidates?.length === 0 && (
        <div className="text-center py-16">
          <User className="w-16 h-16 text-dark-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark-900 mb-2">No candidates yet</h3>
          <p className="text-dark-400 mb-6">Add your first candidate to start conducting interviews</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Candidate
          </button>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Candidate</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-field"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Experience (years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.experience_years}
                    onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                    className="input-field"
                    placeholder="3.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Current Role</label>
                <input
                  type="text"
                  value={form.current_role}
                  onChange={(e) => setForm({ ...form, current_role: e.target.value })}
                  className="input-field"
                  placeholder="Senior Frontend Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Skills</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="input-field flex-1"
                    placeholder="Type skill and press Enter"
                  />
                  <button type="button" onClick={addSkill} className="btn-secondary">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-600/10 border border-primary-600/20 rounded-lg text-sm text-primary-400">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-primary-300">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Resume Text</label>
                <textarea
                  value={form.resume_text}
                  onChange={(e) => setForm({ ...form, resume_text: e.target.value })}
                  className="input-field min-h-[120px]"
                  placeholder="Paste resume content here for AI analysis..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input-field min-h-[80px]"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex items-center gap-2">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Interview Modal */}
      {showSessionModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-dark-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Start Interview</h2>
              <button onClick={() => setShowSessionModal(false)} className="text-dark-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-dark-300">
                Starting interview for <span className="text-white font-medium">{selectedCandidate.name}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Select Interview Template</label>
                <select
                  id="template-select"
                  className="input-field"
                >
                  <option value="">Choose a template...</option>
                  {templates?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  const select = document.getElementById('template-select') as HTMLSelectElement
                  if (!select.value) {
                    toast.error('Please select a template')
                    return
                  }
                  sessionMutation.mutate({
                    template_id: select.value,
                    candidate_id: selectedCandidate.id,
                  })
                }}
                disabled={sessionMutation.isPending}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {sessionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                Start Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
