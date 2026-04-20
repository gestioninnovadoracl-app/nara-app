import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import BottomNav from '../components/BottomNav'

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(now.setDate(diff))
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  return { from: fmtDate(mon), to: fmtDate(sun) }
}

function getMonthRange() {
  const now = new Date()
  const from = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
  const last = new Date(now.getFullYear(), now.getMonth()+1, 0)
  return { from, to: fmtDate(last) }
}

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function fmtDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function Report() {
  const [filter, setFilter] = useState('month')
  const [fromDate, setFromDate] = useState(getMonthRange().from)
  const [toDate, setToDate] = useState(getMonthRange().to)
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchSales(from, to) {
    setLoading(true)
    const q = query(collection(db, 'sales'), where('date', '>=', from), where('date', '<=', to))
    const snap = await getDocs(q)
    setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { fetchSales(fromDate, toDate) }, [fromDate, toDate])

  function applyFilter(type) {
    setFilter(type)
    if (type === 'month') {
      const r = getMonthRange()
      setFromDate(r.from); setToDate(r.to)
    } else if (type === 'week') {
      const r = getWeekRange()
      setFromDate(r.from); setToDate(r.to)
    }
  }

  const ranking = (() => {
    const map = {}
    for (const sale of sales) {
      for (const item of sale.items || []) {
        const key = item.name
        if (!map[key]) map[key] = { name: item.name, units: 0, total: 0, variants: new Set() }
        map[key].units += item.qty
        map[key].total += item.subtotal || (item.qty * (item.finalPrice || item.originalPrice || 0))
        if (item.color || item.talla) {
          map[key].variants.add([item.color, item.talla ? `T.${item.talla}` : ''].filter(Boolean).join(' '))
        }
      }
    }
    return Object.values(map)
      .sort((a, b) => b.units - a.units)
      .map(x => ({ ...x, variants: [...x.variants] }))
  })()

  const totalUnits = ranking.reduce((s, x) => s + x.units, 0)
  const totalAmount = sales.reduce((s, x) => s + x.total, 0)
  const maxUnits = ranking[0]?.units || 1

  const monthName = new Date(fromDate + 'T12:00:00').toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })

  return (
    <div className="page">
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <p style={{ fontSize: 11, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Reporte</p>
        <h1 style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Más vendidas</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[['month', 'Este mes'], ['week', 'Esta semana'], ['range', 'Rango']].map(([val, label]) => (
            <button key={val} onClick={() => applyFilter(val)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
              border: `1px solid ${filter === val ? '#0a0a0a' : '#e8e8e8'}`,
              background: filter === val ? '#0a0a0a' : '#fff',
              color: filter === val ? '#fff' : '#666',
              fontWeight: filter === val ? 500 : 400,
            }}>{label}</button>
          ))}
        </div>

        {filter === 'range' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              style={{ flex: 1, padding: '7px 10px', border: '1px solid #e8e8e8', borderRadius: 8, fontSize: 12, background: '#f9f9f9' }} />
            <span style={{ fontSize: 11, color: '#aaa' }}>a</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              style={{ flex: 1, padding: '7px 10px', border: '1px solid #e8e8e8', borderRadius: 8, fontSize: 12, background: '#f9f9f9' }} />
          </div>
        )}

        <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>
              {filter === 'range' ? `${fmtDisplay(fromDate)} — ${fmtDisplay(toDate)}` : filter === 'month' ? monthName : 'Esta semana'}
            </p>
            <p style={{ fontSize: 16, fontWeight: 500, color: '#0a0a0a' }}>{totalUnits} unidades</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>Total recaudado</p>
            <p style={{ fontSize: 16, fontWeight: 500, color: '#2d6a4f' }}>S/ {Number(totalAmount).toFixed(2)}</p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Cargando...</p>
        ) : ranking.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Sin ventas en este período</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ranking.map((item, i) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < ranking.length - 1 ? '1px solid #f4f4f4' : 'none' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600,
                  background: i === 0 ? '#0a0a0a' : '#f4f4f4',
                  color: i === 0 ? '#fff' : '#888',
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{item.name}</p>
                  {item.variants.length > 0 && (
                    <p style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>{item.variants.slice(0, 3).join(' · ')}{item.variants.length > 3 ? ` +${item.variants.length - 3}` : ''}</p>
                  )}
                  <div style={{ background: '#f4f4f4', borderRadius: 3, height: 5, width: '100%' }}>
                    <div style={{ height: 5, borderRadius: 3, background: i === 0 ? '#0a0a0a' : '#b0b0b0', width: `${(item.units / maxUnits) * 100}%`, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <p style={{ fontWeight: 500, fontSize: 13, color: '#0a0a0a' }}>{item.units} u.</p>
                  <p style={{ fontSize: 10, color: '#aaa' }}>S/ {Number(item.total).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
