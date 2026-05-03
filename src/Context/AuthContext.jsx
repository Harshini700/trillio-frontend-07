import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const getInitialUser = () => {
  try {
    const token = localStorage.getItem('token')
    const user  = localStorage.getItem('user')
    if (token && user) return JSON.parse(user)
  } catch {}
  return null
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser)

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export { AuthContext }