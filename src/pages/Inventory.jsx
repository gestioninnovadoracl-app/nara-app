import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import BottomNav from '../components/BottomNav'

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

function VariantRow({ variant, onDelete, onAddStock }) {
  const [adding, setAdding] = useState(false)
  const [extra, setExtra] = useState('')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f4f4f4' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {variant.color && <span style={{ fontSize: 11, background: '#f4f4f4', borderRadius: 4, padding: '2px 7px', color: '#555' }}>{variant.color}</span>}
          {variant.talla && <span style={{ fontSize: 11, background: '#f4f4f4', borderRadius: 4, padding: '2px 7px', color: '#555' }}>T. {variant.talla}</span>}
          <span style={{ fontSize: 11, color: '#888' }}>Stock: <b style={{ color: variant.stock > 0 ? '#2d6a4f' : '#c0392b' }}>{variant.stock}</b></span>
        </div>
      </div>
      {adding ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="number" min="1" value={extra} onChange={e => setExtra(e.target.value)}
            placeholder="0" style={{ width: 56, padding: '4px 8px', border: '1px solid #e8e8e8', borderRadius: 6, fontSize: 12 }} />
          <button onClick={() => { onAddStock(variant.id, Number(extra)); setAdding(false); setExtra('') }} style={{
            background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer'
          }}>+</button>
          <button onClick={() => setAdding(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setAdding(true)} style={{
            background: '#f4f4f4', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: '#555'
          }}>+ Stock</button>
          <button onClick={() => onDelete(variant.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, onDeleteVariant, onAddStock, onDeleteProduct, onEdit }) {
  const [open, setOpen] = useState(false)
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0)
  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid #e8e8e8' }} />
        ) : (
          <div style={{ width: 60, height: 60, background: '#f4f4f4', borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 3 }}>{product.name}</p>
          <p style={{ fontSize: 12, color: '#666' }}>S/ {Number(product.price).toFixed(2)} · Stock total: <b style={{ color: totalStock > 0 ? '#2d6a4f' : '#c0392b' }}>{totalStock}</b></p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(product)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={() => onDeleteProduct(product)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', padding: 4 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #f4f4f4' }}>
        <button onClick={() => setOpen(!open)} style={{
          width: '100%', background: 'none', border: 'none', padding: '8px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', fontSize: 11, color: '#888',
        }}>
          <span>{product.variants.length} variante{product.variants.length !== 1 ? 's' : ''}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {open && (
          <div style={{ padding: '0 14px 10px' }}>
            {product.variants.map(v => (
              <VariantRow key={v.id} variant={v}
                onDelete={(vid) => onDeleteVariant(product.id, vid)}
                onAddStock={(vid, qty) => onAddStock(product.id, vid, qty)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '')
  const [price, setPrice] = useState(initial?.price || '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || null)
  const [variants, setVariants] = useState(initial?.variants || [])
  const [color, setColor] = useState('')
  const [talla, setTalla] = useState('')
  const [stock, setStock] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()
  const cameraRef = useRef()
  const isEdit = !!initial

  async function handleFile(file) {
    if (!file) return
    const resized = await resizeImage(file)
    setImageUrl(resized)
  }

  function addVariant() {
    if (!stock) return
    setVariants(v => [...v, { id: Date.now().toString(), color, talla, stock: Number(stock) }])
    setColor(''); setTalla(''); setStock('')
  }

  function removeVariant(id) {
    setVariants(v => v.filter(x => x.id !== id))
  }

  async function handleSave() {
    if (!name || !price || variants.length === 0) return
    setSaving(true)
    await onSave({ name, price: Number(price), imageUrl: imageUrl || '', variants })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 24px 40px', width: '100%', maxWidth: 480, animation: 'slideUp 0.25s ease', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontWeight: 500, fontSize: 16 }}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>✕</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          {imageUrl ? (
            <div style={{ position: 'relative' }}>
              <img src={imageUrl} alt="preview" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10, border: '1px solid #e8e8e8' }} />
              <button onClick={() => setImageUrl(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => cameraRef.current.click()} style={{ flex: 1, background: '#f4f4f4', border: '1px dashed #ccc', borderRadius: 10, padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#888', fontSize: 12 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                Cámara
              </button>
              <button onClick={() => fileRef.current.click()} style={{ flex: 1, background: '#f4f4f4', border: '1px dashed #ccc', borderRadius: 10, padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#888', fontSize: 12 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Galería
              </button>
            </div>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <p className="field-label">Nombre del producto</p>
          <input className="field-input" placeholder="Ej: Blusa Verónica" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <p className="field-label">Precio (S/)</p>
          <input className="field-input" type="number" min="0" step="0.10" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
        </div>

        <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 10, color: '#0a0a0a' }}>Agregar variante</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <p className="field-label">Color</p>
              <select className="field-input" value={color} onChange={e => setColor(e.target.value)} style={{ appearance: 'none', cursor: 'pointer', fontSize: 13, padding: '8px 10px' }}>
                <option value="">Sin color</option>
                {COLORES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <p className="field-label">Talla</p>
              <select className="field-input" value={talla} onChange={e => setTalla(e.target.value)} style={{ appearance: 'none', cursor: 'pointer', fontSize: 13, padding: '8px 10px' }}>
                <option value="">Sin talla</option>
                {TALLAS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ width: 70 }}>
              <p className="field-label">Stock</p>
              <input className="field-input" type="number" min="0" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} style={{ padding: '8px 10px', fontSize: 13 }} />
            </div>
          </div>
          <button onClick={addVariant} disabled={!stock} style={{
            width: '100%', background: stock ? '#0a0a0a' : '#e8e8e8', color: stock ? '#fff' : '#aaa',
            border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 500, cursor: stock ? 'pointer' : 'default'
          }}>+ Agregar variante</button>
        </div>

        {variants.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>VARIANTES AGREGADAS</p>
            {variants.map(v => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f4f4f4' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {v.color && <span style={{ fontSize: 11, background: '#f4f4f4', borderRadius: 4, padding: '2px 7px' }}>{v.color}</span>}
                  {v.talla && <span style={{ fontSize: 11, background: '#f4f4f4', borderRadius: 4, padding: '2px 7px' }}>T. {v.talla}</span>}
                  <span style={{ fontSize: 11, color: '#888' }}>×{v.stock}</span>
                </div>
                <button onClick={() => removeVariant(v.id)} style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <button className="btn-primary" onClick={handleSave} disabled={saving || !name || !price || variants.length === 0}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </div>
  )
}

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)

  async function fetchProducts() {
    setLoading(true)
    const snap = await getDocs(collection(db, 'products'))
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    setProducts(all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  async function handleSave(data) {
    await addDoc(collection(db, 'products'), { ...data, createdAt: Timestamp.now() })
    fetchProducts()
  }

  async function handleEdit(data) {
    await updateDoc(doc(db, 'products', editProduct.id), { name: data.name, price: data.price, imageUrl: data.imageUrl, variants: data.variants })
    setEditProduct(null)
    fetchProducts()
  }

  async function handleDeleteVariant(productId, variantId) {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const newVariants = product.variants.filter(v => v.id !== variantId)
    await updateDoc(doc(db, 'products', productId), { variants: newVariants })
    fetchProducts()
  }

  async function handleAddStock(productId, variantId, qty) {
    const product = products.find(p => p.id === productId)
    if (!product || !qty) return
    const newVariants = product.variants.map(v => v.id === variantId ? { ...v, stock: v.stock + qty } : v)
    await updateDoc(doc(db, 'products', productId), { variants: newVariants })
    fetchProducts()
  }

  async function handleDeleteProduct(product) {
    if (!confirm(`¿Eliminar "${product.name}" y todas sus variantes?`)) return
    await deleteDoc(doc(db, 'products', product.id))
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
            <p style={{ fontSize: 13, color: '#aaa' }}>No hay productos en inventario</p>
            <p style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Agrega tu primer producto</p>
          </div>
        ) : (
          products.map(p => (
            <ProductCard key={p.id} product={p}
              onDeleteVariant={handleDeleteVariant}
              onAddStock={handleAddStock}
              onDeleteProduct={handleDeleteProduct}
              onEdit={(p) => setEditProduct(p)} />
          ))
        )}
      </div>

      <div style={{ padding: '12px 20px 4px' }}>
        <button className="btn-outline" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar producto
        </button>
      </div>

      <BottomNav />

      {showModal && <ProductModal onClose={() => setShowModal(false)} onSave={handleSave} />}
      {editProduct && <ProductModal initial={editProduct} onClose={() => setEditProduct(null)} onSave={handleEdit} />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: none; } }
      `}</style>
    </div>
  )
}
