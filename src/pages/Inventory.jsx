import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import BottomNav from '../components/BottomNav'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function resizeImage(file, maxSize = 600) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize }
        else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única']
const COLORES = ['Blanco', 'Negro', 'Gris', 'Azul', 'Rojo', 'Verde', 'Amarillo', 'Rosado', 'Beige', 'Morado', 'Naranjo', 'Celeste', 'Otro']

function ProductCard({ product, onDelete }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12,
      padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start',
      animation: 'fadeIn 0.2s ease',
    }}>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} style={{
          width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0,
          border: '1px solid #e8e8e8',
        }} />
      ) : (
        <div style={{
          width: 64, height: 64, background: '#f4f4f4', borderRadius: 8,
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{product.name}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
          {product.color && (
            <span style={{ fontSize: 11, background: '#f4f4f4', borderRadius: 4, padding: '2px 7px', color: '#555' }}>
              {product.color}
            </span>
          )}
          {product.talla && (
            <span style={{ fontSize: 11, background: '#f4f4f4', borderRadius: 4, padding: '2px 7px', color: '#555' }}>
              Talla {product.talla}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#666' }}>Stock: <b style={{ color: '#0a0a0a' }}>{product.stock}</b></span>
          <span style={{ fontSize: 12, color: '#666' }}>Precio: <b style={{ color: '#0a0a0a' }}>S/ {Number(product.price).toFixed(2)}</b></span>
        </div>
      </div>
      <button onClick={() => onDelete(product.id)} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ccc',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  )
}

function AddProductModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [stock, setStock] = useState('')
  const [price, setPrice] = useState('')
  const [color, setColor] = useState('')
  const [talla, setTalla] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()
  const cameraRef = useRef()

  async function handleFile(file) {
    if (!file) return
    const resized = await resizeImage(file)
    setImageUrl(resized)
  }

  async function handleSave() {
    if (!name || !stock || !price) return
    setSaving(true)
    await onSave({ name, stock: Number(stock), price: Number(price), color, talla, imageUrl: imageUrl || '', date: today() })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 24px 40px',
        width: '100%', maxWidth: 480, animation: 'slideUp 0.25s ease',
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontWeight: 500, fontSize: 16 }}>Nuevo producto</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          {imageUrl ? (
            <div style={{ position: 'relative' }}>
              <img src={imageUrl} alt="preview" style={{
                width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid #e8e8e8',
              }} />
              <button onClick={() => setImageUrl(null)} style={{
                position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)',
                color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28,
                cursor: 'pointer', fontSize: 14,
              }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => cameraRef.current.click()} style={{
                flex: 1, background: '#f4f4f4', border: '1px dashed #ccc', borderRadius: 10,
                padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, cursor: 'pointer', color: '#888', fontSize: 12,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Cámara
              </button>
              <button onClick={() => fileRef.current.click()} style={{
                flex: 1, background: '#f4f4f4', border: '1px dashed #ccc', borderRadius: 10,
                padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, cursor: 'pointer', color: '#888', fontSize: 12,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Galería
              </button>
            </div>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <p className="field-label">Nombre del producto</p>
          <input className="field-input" placeholder="Ej: Polera, Pantalón, Vestido..." value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <p className="field-label">Color</p>
            <select className="field-input" value={color} onChange={e => setColor(e.target.value)}
              style={{ appearance: 'none', cursor: 'pointer' }}>
              <option value="">Sin color</option>
              {COLORES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <p className="field-label">Talla</p>
            <select className="field-input" value={talla} onChange={e => setTalla(e.target.value)}
              style={{ appearance: 'none', cursor: 'pointer' }}>
              <option value="">Sin talla</option>
              {TALLAS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <p className="field-label">Stock (unidades)</p>
            <input className="field-input" type="number" min="0" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <p className="field-label">Precio (S/)</p>
            <input className="field-input" type="number" min="0" step="0.10" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving || !name || !stock || !price}>
          {saving ? 'Guardando...' : 'Agregar producto'}
        </button>
      </div>
    </div>
  )
}

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function fetchProducts() {
    setLoading(true)
    const snap = await getDocs(collection(db, 'products'))
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    setProducts(all.filter(p => p.stock > 0).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  async function handleSave(data) {
    await addDoc(collection(db, 'products'), { ...data, createdAt: Timestamp.now() })
    fetchProducts()
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este producto?')) return
    await deleteDoc(doc(db, 'products', id))
    fetchProducts()
  }

  return (
    <div className="page">
      <div style={{ padding: '20px 20px 8px', borderBottom: '1px solid #f0f0f0' }}>
        <p style={{ fontSize: 11, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Inventario</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Cargando...</p>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <p style={{ fontSize: 13, color: '#aaa' }}>No hay productos cargados hoy</p>
            <p style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Agrega tu primer producto</p>
          </div>
        ) : (
          products.map(p => <ProductCard key={p.id} product={p} onDelete={handleDelete} />)
        )}
      </div>

      <div style={{ padding: '12px 20px 4px' }}>
        <button className="btn-outline" onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar producto
        </button>
      </div>

      <BottomNav />

      {showModal && <AddProductModal onClose={() => setShowModal(false)} onSave={handleSave} />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: none; } }
      `}</style>
    </div>
  )
}
