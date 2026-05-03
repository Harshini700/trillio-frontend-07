import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { boardAPI, cardAPI } from '../Services/api'
import { useSocket } from '../Context/SocketContext'
import { format, isPast } from 'date-fns'
import Navbar          from '../components/layout/Navbar'
import KanbanBoard     from '../components/board/KanbanBoard'
import ActivityLog     from '../components/board/ActivityLog'
import AddMemberModal  from '../components/board/AddMemberModal'
import CardModal       from '../components/card/CardModal'
import CreateCardModal from '../components/card/CreateCardModal'
import toast from 'react-hot-toast'

// ── Custom Table View ─────────────────────────────────────
function TableView({ cards, onCardClick }) {
  const [sortField, setSortField] = useState('title')
  const [sortDir, setSortDir]     = useState('asc')
  const [search, setSearch]       = useState('')

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = cards
    .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let valA = a[sortField] || ''
      let valB = b[sortField] || ''
      if (sortField === 'assignedTo') {
        valA = a.assignedTo?.name || ''
        valB = b.assignedTo?.name || ''
      }
      if (sortField === 'dueDate') {
        valA = a.dueDate ? new Date(a.dueDate) : 0
        valB = b.dueDate ? new Date(b.dueDate) : 0
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ?  1 : -1
      return 0
    })

  const SortIcon = ({ field }) => (
    <span className="ml-1 text-gray-400 text-xs">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  const statusBadge = (status) => {
    const map = {
      todo:       { label: 'To Do',       cls: 'bg-gray-100 text-gray-700' },
      inprogress: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
      done:       { label: 'Done',        cls: 'bg-green-100 text-green-700' },
    }
    const s = map[status] || map.todo
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.cls}`}>
        {s.label}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

      {/* Search bar */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full
              focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {filtered.length} of {cards.length} cards
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left">
              <th onClick={() => handleSort('title')}
                className="px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900 select-none">
                Title <SortIcon field="title" />
              </th>
              <th onClick={() => handleSort('status')}
                className="px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900 select-none w-36">
                Status <SortIcon field="status" />
              </th>
              <th onClick={() => handleSort('assignedTo')}
                className="px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900 select-none w-40">
                Assigned To <SortIcon field="assignedTo" />
              </th>
              <th onClick={() => handleSort('dueDate')}
                className="px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900 select-none w-36">
                Due Date <SortIcon field="dueDate" />
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 w-28">
                Files
              </th>
              <th onClick={() => handleSort('createdAt')}
                className="px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900 select-none w-32">
                Created <SortIcon field="createdAt" />
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-gray-400 text-sm">
                  {search ? `No cards match "${search}"` : 'No cards yet — click + Add Card to create one'}
                </td>
              </tr>
            ) : (
              filtered.map((card, i) => {
                const isOverdue = card.dueDate &&
                  isPast(new Date(card.dueDate)) &&
                  card.status !== 'done'

                return (
                  <tr
                    key={card._id}
                    onClick={() => onCardClick(card)}
                    className={`border-b border-gray-100 cursor-pointer
                      hover:bg-blue-50 transition-colors
                      ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                  >
                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 leading-snug">
                        {card.title}
                      </div>
                      {card.description && (
                        <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {card.description}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {statusBadge(card.status)}
                    </td>

                    {/* Assigned To */}
                    <td className="px-4 py-3">
                      {card.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600
                            flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {card.assignedTo?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-700 truncate">
                            {card.assignedTo?.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Unassigned</span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3">
                      {card.dueDate ? (
                        <div className={`text-xs font-medium flex items-center gap-1
                          ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                          {isOverdue && <span>⚠️</span>}
                          {format(new Date(card.dueDate), 'MMM dd, yyyy')}
                          {isOverdue && (
                            <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full ml-1">
                              Overdue
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Attachments */}
                    <td className="px-4 py-3">
                      {card.attachments?.length > 0 ? (
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          📎 {card.attachments.length} file{card.attachments.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {format(new Date(card.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50
          flex items-center justify-between text-xs text-gray-400">
          <span>Click any row to open card details</span>
          <span>{filtered.length} cards shown</span>
        </div>
      )}
    </div>
  )
}

// ── Main Board Page ───────────────────────────────────────
export default function Board() {
  const { id: boardId }           = useParams()
  const navigate                  = useNavigate()
  const socket                    = useSocket()

  const [board, setBoard]         = useState(null)
  const [cards, setCards]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('kanban')
  const [showActivity, setShowActivity]   = useState(false)
  const [selectedCard, setSelectedCard]   = useState(null)
  const [showCreate, setShowCreate]       = useState(false)
  const [createStatus, setCreateStatus]   = useState('todo')
  const [showAddMember, setShowAddMember] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          boardAPI.getOne(boardId),
          cardAPI.getAll(boardId),
        ])
        setBoard(bRes.data)
        setCards(cRes.data)
      } catch (err) {
        toast.error('Failed to load board')
        if (err.response?.status === 403) navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [boardId])

  useEffect(() => {
    if (!socket) return
    socket.emit('board:join', boardId)
    socket.on('card:created',      (card)       => setCards((p) => [...p, card]))
    socket.on('card:updated',      (card)       => setCards((p) => p.map((c) => c._id === card._id ? card : c)))
    socket.on('card:deleted',      ({ cardId }) => setCards((p) => p.filter((c) => c._id !== cardId)))
    socket.on('cards:reordered',   (updated)    => setCards(updated))
    socket.on('board:updated',     (b)          => setBoard(b))
    socket.on('board:memberAdded', ({ board })  => setBoard(board))
    return () => {
      socket.emit('board:leave', boardId)
      socket.off('card:created')
      socket.off('card:updated')
      socket.off('card:deleted')
      socket.off('cards:reordered')
      socket.off('board:updated')
      socket.off('board:memberAdded')
    }
  }, [socket, boardId])

  const handleCreateCard  = (status = 'todo') => { setCreateStatus(status); setShowCreate(true) }
  const handleCardCreated = (card)    => setCards((p) => [...p, card])
  const handleCardUpdate  = (updated) => {
    setCards((p) => p.map((c) => c._id === updated._id ? updated : c))
    setSelectedCard(updated)
  }
  const handleCardDelete  = (cardId)  => {
    setCards((p) => p.filter((c) => c._id !== cardId))
    setSelectedCard(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!board) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Board Header */}
      <div
        className="px-4 py-4"
        style={{ backgroundColor: board.background + '22', borderBottom: `3px solid ${board.background}` }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700 text-lg font-bold px-2">
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{board.title}</h1>
              {board.description && (
                <p className="text-sm text-gray-500">{board.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Member avatars */}
            <div className="flex -space-x-2 mr-1">
              {board.members?.slice(0, 4).map((m) => (
                <div key={m._id} title={m.user?.name}
                  className="w-7 h-7 rounded-full bg-primary-100 text-primary-600
                    border-2 border-white flex items-center justify-center text-xs font-bold">
                  {m.user?.name?.charAt(0).toUpperCase()}
                </div>
              ))}
              {board.members?.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white
                  flex items-center justify-center text-xs text-gray-600 font-medium">
                  +{board.members.length - 4}
                </div>
              )}
            </div>

            <button onClick={() => setShowAddMember(true)}
              className="btn-secondary text-sm py-1.5 px-3">
              + Add Member
            </button>

            {/* View Toggle */}
            <div className="flex bg-white border border-gray-200 rounded-lg p-1 gap-1">
              {[
                { id: 'kanban', label: '📋 Kanban' },
                { id: 'table',  label: '📊 Table'  },
              ].map((v) => (
                <button key={v.id} onClick={() => setView(v.id)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all
                    ${view === v.id
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-500 hover:bg-gray-50'}`}>
                  {v.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowActivity(!showActivity)}
              className={`btn-secondary text-sm py-1.5 px-3
                ${showActivity ? 'bg-primary-50 border-primary-200 text-primary-600' : ''}`}>
              Activity
            </button>

            <button
              onClick={() => handleCreateCard('todo')}
              className="btn-primary text-sm py-1.5 px-3">
              + Add Card
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {view === 'kanban' ? (
              <KanbanBoard
                cards={cards}
                setCards={setCards}
                boardId={boardId}
                onCardClick={setSelectedCard}
                onCreateCard={handleCreateCard}
              />
            ) : (
              <TableView
                cards={cards}
                onCardClick={setSelectedCard}
              />
            )}
          </div>

          {showActivity && (
            <div className="w-72 flex-shrink-0">
              <ActivityLog boardId={boardId} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardId={boardId}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
      {showCreate && (
        <CreateCardModal
          boardId={boardId}
          defaultStatus={createStatus}
          onClose={() => setShowCreate(false)}
          onCreated={handleCardCreated}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          boardId={boardId}
          onClose={() => setShowAddMember(false)}
          onAdded={(b) => setBoard(b)}
        />
      )}
    </div>
  )
}