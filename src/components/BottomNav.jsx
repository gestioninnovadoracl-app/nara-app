import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/', label: 'Inventario', icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0a0a0a' : '#b0b0b0'} strokeWidth="1.8">
      <rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="2" y1="9" x2="20" y2="9"/><line x1="2" y1="15" x2="20" y2="15"/>
    </svg>
  )},
  { path: '/ventas', label: 'Ventas', icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0a0a0a' : '#b0b0b0'} strokeWidth="1.8">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
    </svg>
  )},
  { path: '/historial', label: 'Historial', icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0a0a0a' : '#b0b0b0'} strokeWidth="1.8">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'sticky', bottom: 0, background: '#fff',
      borderTop: '1px solid #e8e8e8', display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(t => {
        const active = pathname === t.path
        return (
          <button key={t.path} onClick={() => navigate(t.path)} style={{
            flex: 1, background: 'none', border: 'none', padding: '10px 0 8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            cursor: 'pointer',
          }}>
            {t.icon(active)}
            <span style={{ fontSize: 10, color: active ? '#0a0a0a' : '#b0b0b0', fontWeight: active ? 500 : 400 }}>
              {t.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
