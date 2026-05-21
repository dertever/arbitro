import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { BADGES_DEF, RARITY_LABEL, RARITY_COLOR } from '../lib/data'

const CATS = ['todas', 'tests', 'reglas', 'situaciones', 'constancia', 'ranking']
const CLS_BG    = { navy: '#eef1f8', orange: 'var(--orange-soft)', green: 'var(--ok-bg)', gold: '#fefce8', silver: '#f8fafc' }
const CLS_COLOR = { navy: 'var(--navy3)', orange: 'var(--orange2)', green: 'var(--ok)', gold: '#a16207', silver: 'var(--silver)' }

export default function Insignias() {
  const { profile } = useAuth()
  const [unlocked, setUnlocked] = useState([])
  const [progress, setProgress] = useState({})
  const [cat, setCat] = useState('todas')
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!profile) return
    supabase.from('user_badges').select('badge_id, created_at, is_new').eq('user_id', profile.id).then(({ data }) => {
      if (data) setUnlocked(data)
    })
    // Could load progress per badge from DB; using static for now
    const prog = {}
    BADGES_DEF.forEach(b => { prog[b.id] = Math.floor(Math.random() * (b.total + 1)) })
    setProgress(prog)
  }, [profile])

  const unlockedIds = new Set(unlocked.map(u => u.badge_id))
  const isNew = id => unlocked.find(u => u.badge_id === id)?.is_new

  const filtered = cat === 'todas' ? BADGES_DEF : BADGES_DEF.filter(b => b.cat === cat)
  const detail = active ? BADGES_DEF.find(b => b.id === active) : null

  return (
    <>
      <div className="ph">
        <h2>Insignias y logros</h2>
        <p>{unlockedIds.size} obtenidas de {BADGES_DEF.length} — sigue practicando para desbloquearlas todas.</p>
      </div>

      {/* Detail panel */}
      {detail && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: CLS_BG[detail.cls], color: CLS_COLOR[detail.cls], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2.5px solid ${RARITY_COLOR[detail.rarity]}33` }}>
            <i className={`ti ${detail.icon}`} style={{ fontSize: 36 }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>{detail.name}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>{detail.desc}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 8, background: 'var(--off)', borderRadius: 99, border: '1px solid var(--border)' }}>
                <div style={{ height: 6, background: 'var(--orange)', borderRadius: 99, margin: 1, width: `${Math.min(100, Math.round((progress[detail.id] ?? 0) / detail.total * 100))}%` }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'DM Mono, monospace', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                {progress[detail.id] ?? 0}/{detail.total}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`pill pill-${detail.rarity}`}>{RARITY_LABEL[detail.rarity]}</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--orange)', fontWeight: 500 }}>+{detail.xp} XP al desbloquear</span>
              <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setActive(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding: '5px 12px', borderRadius: 99, border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: cat === c ? 'var(--navy)' : 'white', color: cat === c ? 'white' : 'var(--muted)', transition: 'all 0.15s' }}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
        {filtered.filter(b => unlockedIds.has(b.id)).length} desbloqueadas · {filtered.filter(b => !unlockedIds.has(b.id)).length} pendientes
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
        {filtered.map(b => {
          const done = unlockedIds.has(b.id)
          const prog = progress[b.id] ?? 0
          const pct = Math.min(100, Math.round(prog / b.total * 100))
          return (
            <div
              key={b.id}
              onClick={() => setActive(active === b.id ? null : b.id)}
              style={{
                background: 'white',
                border: `${active === b.id ? 2 : 1}px solid ${active === b.id ? 'var(--orange)' : 'var(--border)'}`,
                borderRadius: 'var(--r2)',
                padding: '16px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                opacity: done ? 1 : 0.5,
                filter: done ? 'none' : 'grayscale(0.8)',
                position: 'relative',
                transition: 'all 0.18s',
              }}
            >
              {isNew(b.id) && done && (
                <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--orange)', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, letterSpacing: 0.5 }}>NUEVA</div>
              )}
              <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CLS_BG[b.cls], color: CLS_COLOR[b.cls], border: `2.5px solid ${RARITY_COLOR[b.rarity]}44`, position: 'relative' }}>
                <i className={`ti ${b.icon}`} style={{ fontSize: 24 }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2, lineHeight: 1.2 }}>{b.name}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>{b.sub}</div>
              {done
                ? <span className={`pill pill-${b.rarity}`} style={{ fontSize: 9 }}>{RARITY_LABEL[b.rarity]}</span>
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 9, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' }}>{prog}/{b.total}</div>
              }
            </div>
          )
        })}
      </div>
    </>
  )
}
