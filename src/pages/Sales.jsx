import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, doc, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import BottomNav from '../components/BottomNav'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function DiscountModal({ product, qty, onConfirm, onClose }) {
  const [hasDiscount, setHasDiscount] = useState(null)
  const [discountType, setDiscountType] = useState('soles')
  const [discountValue, setDiscountValue] = useState('')

  const baseTotal = product.price * qty
  let finalPrice = product.price
  let finalTotal = baseTotal
  let discountAmount = 0

  if (hasDiscount && discountValue) {
    if (discountType === 'soles') {
      discountAmount = Number(discountValue)
      finalPrice = product.price - discountAmount
    } else {
      discountAmount = product.price * (Number(discountValue) / 100)
      finalPrice = product.price * (1 - Number(discountValue) / 100)
    }
    finalTotal = finalPrice * qty
  }

  finalPrice = Math.max(0, finalPrice)
  finalTotal = Math.max(0, finalTotal)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 24px 40px',
        width: '100%', maxWidth: 480, animation: 'slideUp 0.25s ease',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontWeight: 500, fontSize: 16 }}>Confirmar venta</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>✕</button>
        </div>

        <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ fontWeight: 500, fontSize: 13 }}>{product.name}</p>
          {(product.color || product.talla) && (
            <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {[product.color, product.talla ? `Talla ${product.talla}` : ''].filter(Boolean).join(' · ')}
            </p>
          )}
          <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {qty} unidad{qty > 1 ? 'es' : ''} × S/ {Number(product.price).toFixed(2)} = <b style={{ color: '#0a0a0a' }}>S/ {Number(baseTotal).toFixed(2)}</b>
          </p>
        </div>

        <p style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>¿Aplicar descuento?</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setHasDiscount(false)} style={{
            flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${hasDiscount === false ? '#0a0a0a' : '#e8e8e8'}`,
            background: hasDiscount === false ? '#0a0a0a' : '#fff',
            color: hasDiscount === false ? '#fff' : '#0a0a0a',
            fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}>No, precio normal</button>
          <button onClick={() => setHasDiscount(true)} style={{
            flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${hasDiscount === true ? '#0a0a0a' : '#e8e8e8'}`,
            background: hasDiscount === true ? '#0a0a0a' : '#fff',
            color: hasDiscount === true ? '#fff' : '#0a0a0a',
            fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}>Sí, con descuento</button>
        </div>

        {hasDiscount && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Tipo de descuento</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setDiscountType('soles')} style={{
                flex: 1, padding: '8px', borderRadius: 8,
                border: `1px solid ${discountType === 'soles' ? '#0a0a0a' : '#e8e8e8'}`,
                background: discountType === 'soles' ? '#f4f4f4' : '#fff',
                fontWeight: discountType === 'soles' ? 500 : 400,
                fontSize: 13, cursor: 'pointer', color: '#0a0a0a',
              }}>S/ Soles</button>
              <button onClick={() => setDiscountType('percent')} style={{
                flex: 1, padding: '8px', borderRadius: 8,
                border: `1px solid ${discountType === 'percent' ? '#0a0a0a' : '#e8e8e8'}`,
                background: discountType === 'percent' ? '#f4f4f4' : '#fff',
                fontWeight: discountType === 'percent' ? 500 : 400,
                fontSize: 13, cursor: 'pointer', color: '#0a0a0a',
              }}>% Porcentaje</button>
            </div>
            <p className="field-label">
              {discountType === 'soles' ? 'Descuento en soles (por unidad)' : 'Descuento en porcentaje'}
            </p>
            <input
              className="field-input"
              type="number"
              min="0"
              step="0.10"
              placeholder={discountType === 'soles' ? '0.00' : '0'}
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
            />
          </div>
        )}

        {hasDiscount !== null && (
          <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 4 }}>
              <span>Precio original</span>
              <span>S/ {Number(product.price).toFixed(2)}</span>
            </div>
            {hasDiscount && discountValue && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#c0392b', marginBottom: 4 }}>
                <span>Descuento</span>
                <span>- S/ {Number(discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500, color: '#0a0a0a', borderTop: '1px solid #e8e8e8', paddingTop: 6, marginTop: 4 }}>
              <span>Precio final × {qty}</span>
              <span style={{ color: '#2d6a4f' }}>S/ {Number(finalTotal).toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          disabled={hasDiscount === null || (hasDiscount && !discountValue)}
          onClick={() => onConfirm({
            finalPrice,
            finalTotal,
            hasDiscount: !!hasDiscount,
            discountType: hasDiscount ? discountType : null,
            discountValue: hasDiscount ? Number(discountValue) : 0,
            discountAmount: hasDiscount ? discountAmount : 0,
          })}
        >
          Registrar venta · S/ {Number(finalTotal).toFixed(2)}
        </button>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: none; } }`}</style>
    </div>
  )
}

export default function Sales() {
  const [products, setProducts] = useState([])
  const [quantities, setQuantities] = useState({})
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [modalProduct, setModalProduct] = useState(null)

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

  const totalToday = sales.reduce((sum, s) => sum + s.total, 0)
  const unitsToday = sales.reduce((sum, s) => sum + s.items.reduce((a, i) => a + i.qty, 0), 0)

  async function handleConfirm(product, discountData) {
    const qty = quantities[product.id] || 0
    if (!qty) return
    setSaving(true)
    setModalProduct(null)

    const item = {
      productId: product.id,
      name: product.name,
      color: product.color || '',
      talla: product.talla || '',
      qty,
      originalPrice: product.price,
      finalPrice: discountData.finalPrice,
      subtotal: discountData.finalTotal,
      hasDiscount: discountData.hasDiscount,
      discountType: discountData.discountType,
      discountValue: discountData.discountValue,
      discountAmount: discountData.discountAmount,
    }

    await addDoc(collection(db, 'sales'), {
      date: today(), items: [item], total: discountData.finalTotal, createdAt: Timestamp.now(),
    })

    await updateDoc(doc(db, 'products', product.id), { stock: product.stock - qty })

    setQuantities(q => ({ ...q, [product.id]: 0 }))
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
    await fetchData()
    setSaving(false)
  }

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
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 40 }}>No hay productos en inventario hoy</p>
        ) : (
          <>
            <p style={{ fontSize: 11, color: '#aaa', marginBottom: 12, letterSpacing: 0.5 }}>SELECCIONA CANTIDAD Y REGISTRA</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {products.map(p => {
                const qty = quantities[p.id] || 0
                const noStock = p.stock === 0
                return (
                  <div key={p.id} style={{
                    background: '#fff', border: `1px solid ${qty > 0 ? '#0a0a0a' : '#e8e8e8'}`,
                    borderRadius: 12, padding: '12px 14px',
                    opacity: noStock ? 0.4 : 1, transition: 'border-color 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.name} style={{
                          width: 44, height: 44, objectFit: 'cover', borderRadius: 7, flexShrink: 0,
                          border: '1px solid #e8e8e8',
                        }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{p.name}</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {p.color && <span style={{ fontSize: 10, background: '#f4f4f4', borderRadius: 4, padding: '1px 6px', color: '#555' }}>{p.color}</span>}
                          {p.talla && <span style={{ fontSize: 10, background: '#f4f4f4', borderRadius: 4, padding: '1px 6px', color: '#555' }}>T. {p.talla}</span>}
                          <span style={{ fontSize: 10, color: '#888' }}>Stock: {p.stock} · S/ {Number(p.price).toFixed(2)}</span>
                        </div>
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
                    {qty > 0 && (
                      <button onClick={() => setModalProduct(p)} style={{
                        width: '100%', marginTop: 10, background: '#0a0a0a', color: '#fff',
                        border: 'none', borderRadius: 8, padding: '8px', fontSize: 12,
                        fontWeight: 500, cursor: 'pointer',
                      }}>
                        Registrar {qty} unidad{qty > 1 ? 'es' : ''} →
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {sales.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8, letterSpacing: 0.5 }}>VENTAS REGISTRADAS HOY</p>
                <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 12, padding: 12 }}>
                  {sales.map((s, i) => (
                    <div key={s.id} style={{ marginBottom: i < sales.length - 1 ? 8 : 0, paddingBottom: i < sales.length - 1 ? 8 : 0, borderBottom: i < sales.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#888' }}>
                          {new Date(s.createdAt?.toDate()).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#2d6a4f' }}>S/ {Number(s.total).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {s.items.map((item, j) => (
                          <span key={j} style={{ background: '#e8f5e9', color: '#2d6a4f', borderRadius: 4, padding: '2px 7px', fontSize: 10 }}>
                            {item.name} ×{item.qty}
                            {item.hasDiscount && <span style={{ color: '#c0392b' }}> -{item.discountType === 'percent' ? `${item.discountValue}%` : `S/${Number(item.discountAmount).toFixed(2)}`}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: '#0a0a0a', borderRadius: 14, padding: 16, marginBottom: 16 }}>
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

      <BottomNav />

      {modalProduct && (
        <DiscountModal
          product={modalProduct}
          qty={quantities[modalProduct.id] || 0}
          onConfirm={(data) => handleConfirm(modalProduct, data)}
          onClose={() => setModalProduct(null)}
        />
      )}
    </div>
  )
}
