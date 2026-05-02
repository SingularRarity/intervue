import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Loader2, X, FileText, Clock, BarChart3 } from 'lucide-react'
import { interviewApi } from '@/lib/api'
import { languages } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function TemplatesPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    interview_type: 'Mixed',
    difficulty: 'Medium',
    duration_minutes: 30,
    language: 'en',
    topics: [] as string[],
    custom_questions: [] as any[],
  })

  const queryClient = useQueryClient()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => interviewApi.getTemplates().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => interviewApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setShowModal(false)
      resetForm()
      toast.success('Template created successfully')
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
      toast.success('Template updated successfully')
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

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      interview_type: 'Mixed',
      difficulty: 'Medium',
      duration_minutes: 30,
      language: 'en',
      topics: [],
      custom_questions: [],
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleEdit = (template: any) => {
    setForm({
      title: template.title,
      description: template.description || '',
      interview_type: template.interview_type,
      difficulty: template.difficulty,
      duration_minutes: template.duration_minutes,
      language: template.language,
      topics: template.topics || [],
      custom_questions: template.custom_questions || [],
    })
    setEditingId(template.id)
    setShowModal(true)
  }

  const addTopic = () => {
    setForm({ ...form, topics: [...form.topics, ''] })
  }

  const updateTopic = (index: number, value: string) => {
    const newTopics = [...form.topics]
    newTopics[index] = value
    setForm({ ...form, topics: newTopics })
  }

  const removeTopic = (index: number) => {
    setForm({ ...form, topics: form.topics.filter((_, i) => i !== index) })
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
          <h1 className="text-3xl font-bold text-white">Interview Templates</h1>
          <p className="text-dark-400 mt-1">Create and manage your interview templates</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((template: any) => (
          <div key={template.id} className="card group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary-600/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-400" />
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-600/10 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this template?')) {
                      deleteMutation.mutate(template.id)
                    }
                  }}
                  className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">{template.title}</h3>
            <p className="text-dark-400 text-sm mb-4 line-clamp-2">{template.description || 'No description'}</p>

            <div className="flex items-center gap-4 text-sm text-dark-500 mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {template.duration_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                {template.difficulty}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="badge-info">{template.interview_type}</span>
              <span className="badge-info">{languages.find(l => l.code === template.language)?.name || template.language}</span>
              {template.topics?.slice(0, 3).map((topic: string) => (
                <span key={topic} className="px-2 py-1 bg-dark-800 rounded-md text-xs text-dark-400">
                  {topic}
                </span>
              ))}
              {template.topics?.length > 3 && (
                <span className="px-2 py-1 bg-dark-800 rounded-md text-xs text-dark-500">
                  +{template.topics.length - 3}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {templates?.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-dark-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No templates yet</h3>
          <p className="text-dark-400 mb-6">Create your first interview template to get started</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary"
          >
            Create Template
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit Template' : 'New Interview Template'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Title *</label>
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
                <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field min-h-[80px]"
                  placeholder="Brief description of the role and interview focus..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Interview Type</label>
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="input-field"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                    className="input-field"
                    min={5}
                    max={120}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Language</label>
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
                <label className="block text-sm font-medium text-dark-300 mb-2">Topics</label>
                <div className="space-y-2">
                  {form.topics.map((topic, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => updateTopic(index, e.target.value)}
                        className="input-field flex-1"
                        placeholder="e.g., React, System Design"
                      />
                      <button
                        type="button"
                        onClick={() => removeTopic(index)}
                        className="p-2 text-dark-500 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTopic}
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                  >
                    + Add Topic
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
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
          </div>
        </div>
      )}
    </div>
  )
}
