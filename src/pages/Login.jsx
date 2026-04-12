import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

const APP_USER = import.meta.env.VITE_APP_USER
const APP_EMAIL = import.meta.env.VITE_APP_EMAIL
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD

export default function Login() {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (user.trim().toLowerCase() !== APP_USER.trim().toLowerCase()) {
      setError('Usuario o contraseña incorrectos')
      return
    }

    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, APP_EMAIL, pass)
      navigate('/')
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ justifyContent: 'center', padding: '48px 32px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48 }}>
        <img src={logo} alt="NARA" style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 12 }} />
        <p style={{ fontSize: 12, color: '#999', letterSpacing: 2, textTransform: 'uppercase' }}>tienda</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <p className="field-label">Usuario</p>
          <input
            className="field-input"
            type="text"
            placeholder="tu usuario"
            value={user}
            onChange={e => setUser(e.target.value)}
            required
            autoComplete="username"
            autoCapitalize="none"
          />
        </div>
        <div>
          <p className="field-label">Contraseña</p>
          <input
            className="field-input"
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={e => setPass(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
