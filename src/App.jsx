import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Login     from './pages/Login'
import Register  from './pages/Register'
import Dashboard from './pages/Dashboard'
import Board     from './pages/Board'

const PrivateRoute = ({ children }) => {
  const { user } = useAuth()
  console.log('PrivateRoute user:', user) 
  return user ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { user } = useAuth()
  return !user ? children : <Navigate to="/dashboard" replace />
}

const AppRoutes = () => (
  <Routes>
    <Route path="/"          element={<Navigate to="/dashboard" replace />} />
    <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register"  element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    <Route path="/board/:id" element={<PrivateRoute><Board /></PrivateRoute>} />
  </Routes>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}