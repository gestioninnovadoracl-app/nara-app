import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import Login from './pages/Login'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import History from './pages/History'
import Report from './pages/Report'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#fff' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #e8e8e8', borderTop: '2px solid #0a0a0a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/ventas" element={<PrivateRoute><Sales /></PrivateRoute>} />
          <Route path="/historial" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/reporte" element={<PrivateRoute><Report /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
