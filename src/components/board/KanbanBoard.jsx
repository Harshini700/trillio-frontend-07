import { useState } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cardAPI } from '../../Services/api'
import { isPast } from 'date-fns'
import toast from 'react-hot-toast'

const COLUMNS = [
  { id: 'todo',       label: 'To Do',       dot: 'bg-gray-400' },
  { id: 'inprogress', label: 'In Progress',  dot: 'bg-blue-400' },
  { id: 'done',       label: 'Done',         dot: 'bg-green-400' },
]

function SortableCard({ card, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card._id })
  const isOverdue = card.dueDate && isPast(new Date(card.dueDate)) && card.status !== 'done'

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes} {...listeners}
      onClick={() => onClick(card)}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all"
    >
      <p className="text-sm font-medium text-gray-800">{card.title}</p>
      {card.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>}
      <div className="flex items-center justify-between mt-2 gap-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          {isOverdue && <span className="badge-overdue">Overdue</span>}
          {card.dueDate && !isOverdue && (
            <span className="text-xs text-gray-400">
              📅 {new Date(card.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {card.attachments?.length > 0 && <span className="text-xs text-gray-400">📎 {card.attachments.length}</span>}
        </div>
        {card.assignedTo && (
          <div className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
            {card.assignedTo?.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ cards, setCards, boardId, onCardClick, onCreateCard }) {
  const [activeCard, setActiveCard] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const getByStatus = (status) => cards.filter((c) => c.status === status)

  const handleDragStart = (e) => setActiveCard(cards.find((c) => c._id === e.active.id))

  const handleDragEnd = async ({ active, over }) => {
    setActiveCard(null)
    if (!over) return

    const dragged    = cards.find((c) => c._id === active.id)
    if (!dragged) return

    const overCol    = COLUMNS.find((col) => col.id === over.id)
    const overCard   = cards.find((c) => c._id === over.id)
    const newStatus  = overCol ? overCol.id : overCard?.status
    if (!newStatus) return

    let updated = [...cards]
    if (dragged.status === newStatus && !overCol) {
      const col      = updated.filter((c) => c.status === newStatus)
      const oldIdx   = col.findIndex((c) => c._id === active.id)
      const newIdx   = col.findIndex((c) => c._id === over.id)
      const reordered = arrayMove(col, oldIdx, newIdx).map((c, i) => ({ ...c, order: i }))
      updated = updated.map((c) => reordered.find((r) => r._id === c._id) || c)
    } else {
      updated = updated.map((c) => c._id === active.id ? { ...c, status: newStatus } : c)
    }

    setCards(updated)
    try {
      await cardAPI.reorder(updated.map((c, i) => ({ _id: c._id, order: i, status: c.status })))
    } catch {
      toast.error('Failed to save order')
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {COLUMNS.map((col) => {
          const colCards = getByStatus(col.id)
          return (
            <div key={col.id} className="flex-shrink-0 w-72">
              <div className="bg-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                    <span className="bg-white text-gray-500 text-xs font-medium px-1.5 py-0.5 rounded-full border border-gray-200">
                      {colCards.length}
                    </span>
                  </div>
                  <button
                    onClick={() => onCreateCard(col.id)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg p-1 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <SortableContext items={colCards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 min-h-[80px]">
                    {colCards.map((card) => (
                      <SortableCard key={card._id} card={card} onClick={onCardClick} />
                    ))}
                  </div>
                </SortableContext>
                <button
                  onClick={() => onCreateCard(col.id)}
                  className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg p-2 transition-all flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add card
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <DragOverlay>
        {activeCard && (
          <div className="bg-white rounded-lg p-3 shadow-xl border border-primary-300 w-72 rotate-2">
            <p className="text-sm font-medium text-gray-800">{activeCard.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}