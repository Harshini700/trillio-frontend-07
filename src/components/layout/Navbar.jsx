import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { notificationAPI } from '../../Services/api'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function Navbar() {
  const { user, logout }            = useAuth()
  const socket                      = useSocket()
  const navigate                    = useNavigate()
  const [notifs, setNotifs]         = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [showMenu, setShowMenu]     = useState(false)

  const unread = notifs.filter((n) => !n.isRead).length

  useEffect(() => {
    notificationAPI.getAll().then((res) => setNotifs(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!socket) return
    socket.on('notification:new', (notif) => {
      setNotifs((prev) => [notif, ...prev])
      toast(`🔔 ${notif.message}`, { duration: 4000 })
    })
    return () => socket.off('notification:new')
  }, [socket])

  const handleMarkAll = async () => {
    await notificationAPI.markAll()
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-primary-500 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-50">
      <Link to="/dashboard" className="text-xl font-bold tracking-tight">Trillio</Link>

      <div className="flex items-center gap-3 relative">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowMenu(false) }}
            className="relative p-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">Notifications</span>
                {unread > 0 && (
                  <button onClick={handleMarkAll} className="text-xs text-primary-500 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No notifications</p>
                ) : (
                  notifs.map((n) => (
                    <div key={n._id} className={`px-4 py-3 border-b border-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`}>
                      <p className="text-sm text-gray-800">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => { setShowMenu(!showMenu); setShowNotifs(false) }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <div className="w-7 h-7 bg-white text-primary-500 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}