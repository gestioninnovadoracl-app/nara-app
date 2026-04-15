import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, doc, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import BottomNav from '../components/BottomNav'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function DiscountModal({ product, variant, qty, onConfirm, onClose }) {
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 24px 40px', width: '100%', maxWidth: 480, animation: 'slideUp 0.25s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontWeight: 500, fontSize: 16 }}>Confirmar venta</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>✕</button>
        </div>

        <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ fontWeight: 500, fontSize: 13 }}>{product.name}</p>
          <div style={{ display: 'flex', gap: 6, margin: '4px 0' }}>
            {variant.color && <span style={{ fontSize: 11, background: '#e8e8e8', borderRadius: 4, padding: '1px 7px' }}>{variant.color}</span>}
            {variant.talla && <span style={{ fontSize: 11, background: '#e8e8e8', borderRadius: 4, padding: '1px 7px' }}>T. {variant.talla}</span>}
          </div>
          <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {qty} unidad{qty > 1 ? 'es' : ''} × S/ {Number(product.price).toFixed(2)} = <b style={{ color: '#0a0a0a' }}>S/ {Number(baseTotal).toFixed(2)}</b>
          </p>
        </div>

        <p style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>¿Aplicar descuento?</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setHasDiscount(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${hasDiscount === false ? '#0a0a0a' : '#e8e8e8'}`, background: hasDiscount === false ? '#0a0a0a' : '#fff', color: hasDiscount === false ? '#fff' : '#0a0a0a', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>No, precio normal</button>
          <button onClick={() => setHasDiscount(true)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${hasDiscount === true ? '#0a0a0a' : '#e8e8e8'}`, background: hasDiscount === true ? '#0a0a0a' : '#fff', color: hasDiscount === true ? '#fff' : '#0a0a0a', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Sí, con descuento</button>
        </div>

        {hasDiscount && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setDiscountType('soles')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${discountType === 'soles' ? '#0a0a0a' : '#e8e8e8'}`, background: discountType === 'soles' ? '#f4f4f4' : '#fff', fontWeight: discountType === 'soles' ? 500 : 400, fontSize: 13, cursor: 'pointer', color: '#0a0a0a' }}>S/ Soles</button>
              <button onClick={() => setDiscountType('percent')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${discountType === 'percent' ? '#0a0a0a' : '#e8e8e8'}`, background: discountType === 'percent' ? '#f4f4f4' : '#fff', fontWeight: discountType === 'percent' ? 500 : 400, fontSize: 13, cursor: 'pointer', color: '#0a0a0a' }}>% Porcentaje</button>
            </div>
            <p className="field-label">{discountType === 'soles' ? 'Descuento en soles (por unidad)' : 'Descuento en porcentaje'}</p>
            <input className="field-input" type="number" min="0" step="0.10" placeholder={discountType === 'soles' ? '0.00' : '0'} value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
          </div>
        )}

        {hasDiscount !== null && (
          <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 4 }}>
              <span>Precio original</span><span>S/ {Number(product.price).toFixed(2)}</span>
            </div>
            {hasDiscount && discountValue && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#c0392b', marginBottom: 4 }}>
                <span>Descuento</span><span>- S/ {Number(discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500, color: '#0a0a0a', borderTop: '1px solid #e8e8e8', paddingTop: 6, marginTop: 4 }}>
              <span>Total × {qty}</span>
              <span style={{ color: '#2d6a4f' }}>S/ {Number(finalTotal).toFixed(2)}</span>
            </div>
          </div>
        )}

        <button className="btn-primary" disabled={hasDiscount === null || (hasDiscount && !discountValue)}
          onClick={() => onConfirm({ finalPrice, finalTotal, hasDiscount: !!hasDiscount, discountType: hasDiscount ? discountType : null, discountValue: hasDiscount ? Number(discountValue) : 0, discountAmount: hasDiscount ? discountAmount : 0 })}>
          Registrar · S/ {Number(finalTotal).toFixed(2)}
        </button>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: none; } }`}</style>
    </div>
  )
}

export default function Sales() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null)
  const [quantities, setQuantities] = useState({})

  async function fetchData() {
    setLoading(true)
    const psnap = await getDocs(collection(db, 'products'))
    const prods = psnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.variants?.some(v => v.stock > 0))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    setProducts(prods)
    const sq = query(collection(db, 'sales'), where('date', '==', today()))
    const ssnap = await getDocs(sq)
    setSales(ssnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function variantKey(productId, variantId) { return `${productId}_${variantId}` }

  function setQty(productId, variantId, val, maxStock) {
    const key = variantKey(productId, variantId)
    const v = Math.max(0, Math.min(maxStock, val))
    setQuantities(q => ({ ...q, [key]: v }))
  }

  async function handleConfirm(discountData) {
    if (!modal) return
    const { product, variant } = modal
    const key = variantKey(product.id, variant.id)
    const qty = quantities[key] || 0
    setSaving(true)
    setModal(null)

    const item = {
      productId: product.id, variantId: variant.id,
      name: product.name, color: variant.color || '', talla: variant.talla || '',
      qty, originalPrice: product.price,
      finalPrice: discountData.finalPrice, subtotal: discountData.finalTotal,
      hasDiscount: discountData.hasDiscount, discountType: discountData.discountType,
      discountValue: discountData.discountValue, discountAmount: discountData.discountAmount,
    }

    await addDoc(collection(db, 'sales'), { date: today(), items: [item], total: discountData.finalTotal, createdAt: Timestamp.now() })

    const newVariants = product.variants.map(v => v.id === variant.id ? { ...v, stock: v.stock - qty } : v)
    await updateDoc(doc(db, 'products', product.id), { variants: newVariants })

    setQuantities(q => { const n = { ...q }; delete n[key]; return n })
    await fetchData()
    setSaving(false)
  }

  const totalToday = sales.reduce((s, x) => s + x.total, 0)
  const unitsToday = sales.reduce((s, x) => s + x.items.reduce((a, i) => a + i.qty, 0), 0)

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
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 40 }}>No hay productos con stock disponible</p>
        ) : (
          <>
            <p style={{ fontSize: 11, color: '#aaa', marginBottom: 12, letterSpacing: 0.5 }}>SELECCIONA PRODUCTO Y VARIANTE</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {products.map(p => (
                <div key={p.id} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f4f4f4' }}>
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #e8e8e8' }} />}
                    <div>
                      <p style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>S/ {Number(p.price).toFixed(2)}</p>
                    </div>
                  </div>
                  {p.variants.filter(v => v.stock > 0).map(v => {
                    const key = variantKey(p.id, v.id)
                    const qty = quantities[key] || 0
                    return (
                      <div key={v.id} style={{ padding: '10px 14px', borderBottom: '1px solid #f9f9f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 2 }}>
                            {v.color && <span style={{ fontSize: 10, background: '#f4f4f4', borderRadius: 4, padding: '1px 6px', color: '#555' }}>{v.color}</span>}
                            {v.talla && <span style={{ fontSize: 10, background: '#f4f4f4', borderRadius: 4, padding: '1px 6px', color: '#555' }}>T. {v.talla}</span>}
                          </div>
                          <p style={{ fontSize: 11, color: '#888' }}>Stock: {v.stock}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button disabled={qty === 0} onClick={() => setQty(p.id, v.id, qty - 1, v.stock)} style={{ width: 26, height: 26, borderRadius: '50%', background: qty > 0 ? '#0a0a0a' : '#f4f4f4', border: 'none', color: qty > 0 ? '#fff' : '#ccc', fontSize: 14, cursor: qty > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 500, minWidth: 18, textAlign: 'center' }}>{qty}</span>
                          <button disabled={qty >= v.stock} onClick={() => setQty(p.id, v.id, qty + 1, v.stock)} style={{ width: 26, height: 26, borderRadius: '50%', background: qty < v.stock ? '#0a0a0a' : '#f4f4f4', border: 'none', color: qty < v.stock ? '#fff' : '#ccc', fontSize: 14, cursor: qty < v.stock ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          {qty > 0 && (
                            <button onClick={() => setModal({ product: p, variant: v })} style={{ background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                              Vender →
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {sales.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8, letterSpacing: 0.5 }}>VENTAS DE HOY</p>
                <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 12, padding: 12 }}>
                  {sales.map((s, i) => (
                    <div key={s.id} style={{ marginBottom: i < sales.length - 1 ? 8 : 0, paddingBottom: i < sales.length - 1 ? 8 : 0, borderBottom: i < sales.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#888' }}>{new Date(s.createdAt?.toDate()).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#2d6a4f' }}>S/ {Number(s.total).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {s.items.map((item, j) => (
                          <span key={j} style={{ background: '#e8f5e9', color: '#2d6a4f', borderRadius: 4, padding: '2px 7px', fontSize: 10 }}>
                            {item.name} {item.color && `· ${item.color}`} {item.talla && `· T.${item.talla}`} ×{item.qty}
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
                <span style={{ fontSize: 11, color: '#666' }}>{unitsToday} unid.</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 500, color: '#fff', fontFamily: 'var(--font-display)' }}>S/ {Number(totalToday).toFixed(2)}</p>
            </div>
          </>
        )}
      </div>

      <BottomNav />

      {modal && (
        <DiscountModal
          product={modal.product} variant={modal.variant}
          qty={quantities[variantKey(modal.product.id, modal.variant.id)] || 0}
          onConfirm={handleConfirm}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
