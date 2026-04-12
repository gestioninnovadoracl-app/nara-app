import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, doc, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import BottomNav from '../components/BottomNav'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function Sales() {
  const [products, setProducts] = useState([])
  const [quantities, setQuantities] = useState({})
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  async function fetchData() {
    setLoading(true)
    const pq = query(collection(db, 'products'), where('date', '==', today()))
    const psnap = await getDocs(pq)
    const prods = psnap.docs.map(d => ({ id: d.id, ...d.data() }))
    setProducts(prods)

    const sq = query(collection(db, 'sales'), where('date', '==', today()))
    const ssnap = await getDocs(sq)
    setSales(ssnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function setQty(id, val) {
    const p = products.find(p => p.id === id)
    const max = p ? p.stock : 0
    const v = Math.max(0, Math.min(max, val))
    setQuantities(q => ({ ...q, [id]: v }))
  }

  const hasItems = Object.values(quantities).some(v => v > 0)

  const totalToday = sales.reduce((sum, s) => sum + s.total, 0)
  const unitsToday = sales.reduce((sum, s) => sum + s.items.reduce((a, i) => a + i.qty, 0), 0)

  async function handleRegister() {
    const items = products
      .filter(p => quantities[p.id] > 0)
      .map(p => ({ productId: p.id, name: p.name, qty: quantities[p.id], price: p.price, subtotal: quantities[p.id] * p.price }))

    if (!items.length) return
    setSaving(true)

    const total = items.reduce((s, i) => s + i.subtotal, 0)
    await addDoc(collection(db, 'sales'), {
      date: today(), items, total, createdAt: Timestamp.now(),
    })

    for (const item of items) {
      const p = products.find(p => p.id === item.productId)
      if (p) {
        await updateDoc(doc(db, 'products', item.productId), { stock: p.stock - item.qty })
      }
    }

    setQuantities({})
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
    await fetchData()
    setSaving(false)
  }

  const pendingTotal = products.reduce((s, p) => s + (quantities[p.id] || 0) * p.price, 0)

  return (
    <div className="page">
      <div style={{ padding: '20px 20px 8px', borderBottom: '1px solid #f0f0f0' }}>
        <p style={{ fontSize: 11, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Ventas</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Cargando...</p>
        ) : products.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            No hay productos en inventario hoy
          </p>
        ) : (
          <>
            <p style={{ fontSize: 11, color: '#aaa', marginBottom: 12, letterSpacing: 0.5 }}>SELECCIONA PRODUCTOS VENDIDOS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {products.map(p => {
                const qty = quantities[p.id] || 0
                const noStock = p.stock === 0
                return (
                  <div key={p.id} style={{
                    background: '#fff', border: `1px solid ${qty > 0 ? '#0a0a0a' : '#e8e8e8'}`,
                    borderRadius: 12, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    opacity: noStock ? 0.4 : 1,
                    transition: 'border-color 0.15s',
                  }}>
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt={p.name} style={{
                        width: 44, height: 44, objectFit: 'cover', borderRadius: 7, flexShrink: 0,
                        border: '1px solid #e8e8e8',
                      }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>
                        Stock: {p.stock} · S/ {Number(p.price).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <button disabled={noStock || qty === 0} onClick={() => setQty(p.id, qty - 1)} style={{
                        width: 28, height: 28, borderRadius: '50%', background: qty > 0 ? '#0a0a0a' : '#f4f4f4',
                        border: 'none', color: qty > 0 ? '#fff' : '#ccc', fontSize: 16, cursor: qty > 0 ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>−</button>
                      <span style={{ fontSize: 15, fontWeight: 500, minWidth: 20, textAlign: 'center' }}>{qty}</span>
                      <button disabled={noStock || qty >= p.stock} onClick={() => setQty(p.id, qty + 1)} style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: (!noStock && qty < p.stock) ? '#0a0a0a' : '#f4f4f4',
                        border: 'none', color: (!noStock && qty < p.stock) ? '#fff' : '#ccc',
                        fontSize: 16, cursor: (!noStock && qty < p.stock) ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>+</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {sales.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8, letterSpacing: 0.5 }}>VENTAS REGISTRADAS HOY</p>
                <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 12, padding: 12 }}>
                  {sales.map((s, i) => (
                    <div key={s.id} style={{ marginBottom: i < sales.length - 1 ? 8 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
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
                            {item.name} ×{item.qty}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              background: '#0a0a0a', borderRadius: 14, padding: 16, marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#666' }}>Total recaudado hoy</span>
                <span style={{ fontSize: 11, color: '#666' }}>{unitsToday} unid. vendidas</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 500, color: '#fff', fontFamily: 'var(--font-display)' }}>
                S/ {Number(totalToday).toFixed(2)}
              </p>
            </div>
          </>
        )}
      </div>

      {hasItems && (
        <div style={{ padding: '0 20px 8px' }}>
          <button className="btn-primary" onClick={handleRegister} disabled={saving} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {saving ? 'Registrando...' : success ? '✓ Registrado' : `Registrar venta · S/ ${Number(pendingTotal).toFixed(2)}`}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
