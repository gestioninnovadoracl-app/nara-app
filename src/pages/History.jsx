import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../firebase/config'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

function groupByDate(sales) {
  const map = {}
  for (const s of sales) {
    if (!map[s.date]) map[s.date] = { date: s.date, total: 0, units: 0, sales: [] }
    map[s.date].total += s.total
    map[s.date].units += s.items.reduce((a, i) => a + i.qty, 0)
    map[s.date].sales.push(s)
  }
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const date = new Date(y, m - 1, d)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  if (dateStr === todayStr) return 'Hoy'
  return date.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function History() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetch() {
      const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const sales = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setGroups(groupByDate(sales))
      setLoading(false)
    }
    fetch()
  }, [])

  const currentMonth = new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
  const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`
  const monthGroups = groups.filter(g => g.date.startsWith(monthStr))
  const monthTotal = monthGroups.reduce((s, g) => s + g.total, 0)
  const monthUnits = monthGroups.reduce((s, g) => s + g.units, 0)

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="page">
      <div style={{ padding: '20px 20px 8px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: 11, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Historial</p>
          <h1 style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Ventas</h1>
        </div>
        <button onClick={handleLogout} style={{
          background: 'none', border: '1px solid #e8e8e8', borderRadius: 8,
          padding: '6px 12px', fontSize: 11, color: '#888', cursor: 'pointer',
        }}>Salir</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Cargando...</p>
        ) : (
          <>
            <div style={{
              background: '#0a0a0a', borderRadius: 14, padding: 16, marginBottom: 20,
            }}>
              <p style={{ fontSize: 11, color: '#555', marginBottom: 6, textTransform: 'capitalize' }}>{currentMonth}</p>
              <p style={{ fontSize: 28, fontWeight: 500, color: '#fff', fontFamily: 'var(--font-display)' }}>
                S/ {Number(monthTotal).toFixed(2)}
              </p>
              <p style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{monthUnits} unidades · {monthGroups.length} días con ventas</p>
            </div>

            {groups.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 20 }}>Sin ventas registradas aún</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {groups.map(g => (
                  <div key={g.date}>
                    <button onClick={() => setExpanded(expanded === g.date ? null : g.date)} style={{
                      width: '100%', background: '#fff', border: '1px solid #e8e8e8',
                      borderRadius: expanded === g.date ? '12px 12px 0 0' : 12,
                      padding: '12px 14px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', cursor: 'pointer', textAlign: 'left',
                    }}>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: 13 }}>{formatDate(g.date)}</p>
                        <p style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{g.units} unidades · {g.sales.length} ventas</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 500, fontSize: 14, color: '#2d6a4f' }}>S/ {Number(g.total).toFixed(2)}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"
                          style={{ transform: expanded === g.date ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </button>
                    {expanded === g.date && (
                      <div style={{
                        background: '#fafafa', border: '1px solid #e8e8e8', borderTop: 'none',
                        borderRadius: '0 0 12px 12px', padding: '10px 14px',
                      }}>
                        {g.sales.map((s, i) => (
                          <div key={s.id} style={{
                            paddingBottom: i < g.sales.length - 1 ? 8 : 0,
                            marginBottom: i < g.sales.length - 1 ? 8 : 0,
                            borderBottom: i < g.sales.length - 1 ? '1px solid #efefef' : 'none',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: '#888' }}>
                                {new Date(s.createdAt?.toDate()).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 500, color: '#2d6a4f' }}>S/ {Number(s.total).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {s.items.map((item, j) => (
                                <span key={j} style={{
                                  background: '#e8f5e9', color: '#2d6a4f',
                                  borderRadius: 4, padding: '2px 7px', fontSize: 10,
                                }}>
                                  {item.name} ×{item.qty} · S/{Number(item.subtotal).toFixed(2)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
