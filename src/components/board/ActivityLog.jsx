import { useState, useEffect } from 'react'
import { activityAPI } from '../../Services/api'
import { formatDistanceToNow } from 'date-fns'
import { useSocket } from '../../Context/SocketContext'

export default function ActivityLog({ boardId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading]       = useState(true)
  const socket                      = useSocket()

  const fetchActivities = () =>
    activityAPI.getAll(boardId).then((res) => setActivities(res.data))

  useEffect(() => {
    fetchActivities().finally(() => setLoading(false))
  }, [boardId])

  useEffect(() => {
    if (!socket) return
    socket.on('card:created',   fetchActivities)
    socket.on('card:updated',   fetchActivities)
    socket.on('card:deleted',   fetchActivities)
    socket.on('comment:added',  fetchActivities)
    return () => {
      socket.off('card:created',  fetchActivities)
      socket.off('card:updated',  fetchActivities)
      socket.off('card:deleted',  fetchActivities)
      socket.off('comment:added', fetchActivities)
    }
  }, [socket, boardId])

  const getIcon = (action) => {
    if (action.includes('created card'))  return '🟢'
    if (action.includes('moved'))         return '🔀'
    if (action.includes('deleted'))       return '🗑️'
    if (action.includes('comment'))       return '💬'
    if (action.includes('uploaded'))      return '📎'
    if (action.includes('updated'))       return '✏️'
    if (action.includes('added'))         return '👤'
    return '📌'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        Activity Log
        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{activities.length}</span>
      </h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">No activity yet</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((a) => (
            <div key={a._id} className="flex gap-3 text-xs">
              <span className="text-base flex-shrink-0 mt-0.5">{getIcon(a.action)}</span>
              <div>
                <span className="font-semibold text-gray-800">{a.userId?.name} </span>
                <span className="text-gray-600">{a.action}</span>
                <p className="text-gray-400 mt-0.5">
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}