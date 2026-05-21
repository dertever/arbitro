// Ranking.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export function Ranking() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, xp, role').order('xp', { ascending: false }).limit(50).then(({ data }) => {
      if (data) setUsers(data)
    })
  }, [])

  const medal = ['#f5c518', '#94a3b8', '#cd7f32']

  return (
    <>
      <div className="ph"><h2>Ranking global</h2><p>Clasificación por XP acumulados — temporada 25/26.</p></div>
      <div className="card" style={{ padding: 0 }}>
        {users.length === 0 ? (
          <div className="empty-state"><i className="ti ti-trophy" /><p>No hay árbitros en el ranking aún.</p></div>
        ) : (
          <div>
            {users.map((u, i) => {
              const isMe = u.id === profile?.id
              const initials = u.full_name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?'
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px', borderBottom: '1px solid var(--border)', background: isMe ? 'var(--orange-soft)' : 'white' }}>
                  {i < 3
                    ? <div style={{ width: 28, height: 28, borderRadius: '50%', background: medal[i], display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-trophy" style={{ fontSize: 13, color: 'white' }} /></div>
                    : <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500, width: 28, textAlign: 'center', color: 'var(--light)' }}>{i + 1}</span>
                  }
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? 'var(--orange)' : 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'white', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: isMe ? 600 : 400 }}>
                    {u.full_name}{isMe && <span style={{ fontSize: 10, color: 'var(--orange)', fontWeight: 700, marginLeft: 6 }}>· Tú</span>}
                  </span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500, background: 'var(--navy)', color: 'white', padding: '3px 8px', borderRadius: 6 }}>
                    {(u.xp ?? 0).toLocaleString()} XP
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// Misiones.jsx
export function Misiones() {
  const missions = [
    { icon: 'ti-trophy', cls: 'o', name: 'Maestro del reglamento', sub: 'Supera los 17 tests de reglas', p: 9, t: 17, xp: 500, badge: 'maestro17' },
    { icon: 'ti-flame',  cls: 'n', name: 'Racha de 7 días',        sub: 'Practica 7 días seguidos',       p: 4, t: 7,  xp: 200, badge: 'racha7' },
    { icon: 'ti-star',   cls: 'g', name: 'Perfeccionista',          sub: 'Obtén 100% en 5 tests',          p: 2, t: 5,  xp: 350, badge: 'examen_10' },
    { icon: 'ti-clock',  cls: 'o', name: 'Madrugador',              sub: 'Completa un test antes de las 9h', p: 0, t: 1, xp: 100, badge: 'madrugador' },
    { icon: 'ti-crown',  cls: 'n', name: 'El mejor',                sub: 'Ocupa el #1 del ranking 7 días', p: 3, t: 7, xp: 1000, badge: 'podio' },
    { icon: 'ti-refresh',cls: 'g', name: 'Constancia',              sub: '30 tests en un mes',             p: 12, t: 30, xp: 300, badge: 'mes_completo' },
    { icon: 'ti-eye',    cls: 'o', name: 'Ojo de halcón',           sub: '5 situaciones correctas',        p: 3, t: 5, xp: 300, badge: 'ojo_halcon' },
    { icon: 'ti-award',  cls: 'g', name: 'Veterano',                sub: '100 tests completados',          p: 47, t: 100, xp: 1000, badge: 'veterano' },
  ]
  const bgCls = { o: 'var(--orange-soft)', n: '#eef2ff', g: 'var(--ok-bg)' }
  const colorCls = { o: 'var(--orange2)', n: 'var(--navy3)', g: 'var(--ok)' }
  return (
    <>
      <div className="ph"><h2>Misiones y retos</h2><p>Completa objetivos para ganar XP y desbloquear insignias.</p></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {missions.map((m, i) => (
          <div key={i} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: bgCls[m.cls], color: colorCls[m.cls], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                <i className={`ti ${m.icon}`} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 7 }}>{m.sub}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="prog-bar" style={{ flex: 1 }}><div className="prog-fill" style={{ width: `${Math.round(m.p / m.t * 100)}%` }} /></div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>{m.p}/{m.t}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 500, color: 'var(--orange)' }}>+{m.xp}</div>
                <div style={{ fontSize: 10, color: 'var(--light)', letterSpacing: 1 }}>XP</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
