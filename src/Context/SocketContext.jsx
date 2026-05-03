import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { user }  = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    // Only connect when user is logged in
    if (!user || !user._id) return

    //  Don't create duplicate connections
    if (socketRef.current?.connected) return

    socketRef.current = io(
      import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
      {
        transports: ['websocket'],
        autoConnect: true,
      }
    )

    socketRef.current.emit('user:join', user._id)

    socketRef.current.on('connect', () =>
      console.log(' Socket connected:', socketRef.current.id)
    )

    socketRef.current.on('connect_error', (err) =>
      console.warn('Socket error:', err.message)
    )

    //  Cleanup on logout
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [user?._id]) //  only re-run when user._id changes

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)