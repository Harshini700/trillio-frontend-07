import { useState, useEffect } from 'react'
import { cardAPI, commentAPI } from '../../Services/api'
import { useAuth } from '../../Context/AuthContext'
import { useSocket } from '../../Context/SocketContext'
import { format, isPast } from 'date-fns'
import toast from 'react-hot-toast'

export default function CardModal({ card, boardId, onClose, onUpdate, onDelete }) {
  const { user }                    = useAuth()
  const socket                      = useSocket()
  const [comments, setComments]     = useState([])
  const [newComment, setNewComment] = useState('')
  const [uploading, setUploading]   = useState(false)
  const [editing, setEditing]       = useState(false)
  const [form, setForm]             = useState({
    title:       card.title,
    description: card.description || '',
    status:      card.status,
    dueDate:     card.dueDate ? format(new Date(card.dueDate), 'yyyy-MM-dd') : '',
  })

  const isOverdue = card.dueDate && isPast(new Date(card.dueDate)) && card.status !== 'done'

  const statusMap = {
    todo:       { label: 'To Do',       cls: 'badge-todo' },
    inprogress: { label: 'In Progress', cls: 'badge-inprogress' },
    done:       { label: 'Done',        cls: 'badge-done' },
  }

  useEffect(() => {
    commentAPI.getAll(card._id).then((res) => setComments(res.data)).catch(() => {})
  }, [card._id])

  useEffect(() => {
    if (!socket) return
    socket.on('comment:added',   (c) => { if (c.cardId === card._id) setComments((p) => [...p, c]) })
    socket.on('comment:deleted', ({ commentId }) => setComments((p) => p.filter((c) => c._id !== commentId)))
    return () => { socket.off('comment:added'); socket.off('comment:deleted') }
  }, [socket, card._id])

  const handleSave = async () => {
    try {
      const res = await cardAPI.update(card._id, { ...form, dueDate: form.dueDate || null })
      onUpdate(res.data)
      setEditing(false)
      toast.success('Card updated')
    } catch { toast.error('Failed to update') }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      await commentAPI.create({ text: newComment, cardId: card._id })
      setNewComment('')
    } catch { toast.error('Failed to add comment') }
  }

  const handleDeleteComment = async (id) => {
    try { await commentAPI.delete(id) }
    catch { toast.error('Failed to delete comment') }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await cardAPI.upload(card._id, fd)
      onUpdate(res.data)
      toast.success('File uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this card?')) return
    try {
      await cardAPI.delete(card._id)
      onDelete(card._id)
      onClose()
      toast.success('Card deleted')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mb-8">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex-1 pr-4">
            {editing
              ? <input className="input text-lg font-semibold" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              : <h2 className="text-lg font-semibold text-gray-900">{card.title}</h2>
            }
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusMap[card.status]?.cls}`}>
                {statusMap[card.status]?.label}
              </span>
              {isOverdue && <span className="badge-overdue">Overdue</span>}
              {card.dueDate && <span className="text-xs text-gray-500">Due: {format(new Date(card.dueDate), 'MMM dd, yyyy')}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 text-lg">✕</button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Edit / View */}
          {editing ? (
            <div className="space-y-3">
              <textarea className="input resize-none" rows={3} placeholder="Description..."
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <input type="date" className="input" value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className="btn-primary text-sm">Save</button>
                <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              {card.description && <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditing(true)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                <button onClick={handleDelete} className="btn-danger text-xs py-1.5 px-3">Delete</button>
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Attachments ({card.attachments?.length || 0})</h3>
              <label className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
                {uploading ? 'Uploading...' : 'Upload File'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            <div className="space-y-2">
              {card.attachments?.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-gray-500">📎</span>
                  <span className="text-xs text-gray-700 truncate">{a.filename}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Comments ({comments.length})</h3>
            <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
              <input className="input text-sm flex-1" placeholder="Write a comment..."
                value={newComment} onChange={(e) => setNewComment(e.target.value)} />
              <button type="submit" className="btn-primary text-sm px-3">Post</button>
            </form>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-3">
                  <div className="w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.createdBy?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-800">{c.createdBy?.name}</span>
                      <span className="text-xs text-gray-400">{format(new Date(c.createdAt), 'MMM dd, HH:mm')}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">{c.text}</p>
                  </div>
                  {c.createdBy?._id === user?._id && (
                    <button onClick={() => handleDeleteComment(c._id)} className="text-gray-300 hover:text-red-400 self-start mt-1">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}