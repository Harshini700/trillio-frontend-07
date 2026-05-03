import { useState } from 'react'
import { cardAPI } from '../../Services/api'
import toast from 'react-hot-toast'

export default function CreateCardModal({ boardId, defaultStatus, onClose, onCreated }) {
  const [form, setForm]         = useState({ title: '', description: '', status: defaultStatus || 'todo', dueDate: '' })
  const [loading, setLoading]   = useState(false)
  const [aiLoading, setAiLoad]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    setLoading(true)
    try {
      const res = await cardAPI.create({ ...form, boardId: boardId, dueDate: form.dueDate || null })
      onCreated(res.data)
      toast.success('Card created!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create card')
    } finally {
      setLoading(false)
    }
  }

 const generateAI = async () => {
  if (!form.title.trim()) return toast.error('Enter a title first')

  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) return toast.error('Add VITE_GEMINI_API_KEY to .env')

  setAiLoad(true)
  try {
   const res = await fetch(
   `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Write a short 2-3 sentence task description for a project management card titled: "${form.title}". Be practical and action-oriented. Only return the description, nothing else.`
            }]
          }],
          generationConfig: {
            temperature:     0.7,
            maxOutputTokens: 150,
          }
        }),
      }
    )

    const data = await res.json()
    console.log('Gemini response:', data)

    if (data.error) {
      toast.error(`AI Error: ${data.error.message}`)
      return
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (text) {
      setForm((p) => ({ ...p, description: text.trim() }))
      toast.success('AI description generated!')
    } else {
      toast.error('AI returned empty response')
    }
  } catch (err) {
    console.error('AI error:', err)
    toast.error('AI generation failed')
  } finally {
    setAiLoad(false)
  }
}

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Add Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input className="input" placeholder="What needs to be done?" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <button type="button" onClick={generateAI} disabled={aiLoading}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 disabled:opacity-50">
                {aiLoading ? 'Generating...' : '✨ AI Generate'}
              </button>
            </div>
            <textarea className="input resize-none" rows={3} placeholder="Describe this task..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" className="input" value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}