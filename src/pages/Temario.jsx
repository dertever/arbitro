import { useState } from 'react'
import { Link } from 'react-router-dom'
import { REGLAS, REGLAS_DETAIL } from '../lib/data'

export default function Temario() {
  const [open, setOpen] = useState(null)

  function toggle(n) { setOpen(open === n ? null : n) }

  return (
    <>
      <div className="ph"><h2>Las 17 Reglas del Juego</h2><p>Teoría actualizada, puntos clave y vídeos explicativos para cada regla.</p></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {REGLAS.map(r => {
          const detail = REGLAS_DETAIL[r.n]
          const isOpen = open === r.n
          return (
            <div key={r.n} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                onClick={() => toggle(r.n)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', cursor: 'pointer' }}
              >
                <div style={{ width: 40, height: 40, background: 'var(--navy)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: 'var(--orange)', flexShrink: 0 }}>
                  {r.n}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.tag}</div>
                </div>
                <i className={`ti ti-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 17, color: 'var(--light)', transition: 'transform 0.2s' }} />
              </div>

              {isOpen && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
                  {detail ? (
                    <>
                      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65, margin: '14px 0 12px' }}>{detail.desc}</p>

                      {/* Video placeholder */}
                      <div style={{ background: 'var(--navy)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, background: 'var(--orange)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="ti ti-player-play" style={{ fontSize: 15, color: 'white' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 1 }}>Regla {r.n} — {r.name}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Vídeo oficial del comité · Añadir URL desde Admin</div>
                        </div>
                      </div>

                      {/* Key points */}
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--light)', marginBottom: 8 }}>Puntos clave para el examen</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                        {detail.puntos.map((p, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 13, color: 'var(--text)' }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--orange)', marginTop: 6, flexShrink: 0 }} />
                            {p}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--muted)', margin: '14px 0 12px', lineHeight: 1.65 }}>
                      Contenido de la Regla {r.n} — {r.name}. El administrador puede añadir descripción, vídeo y puntos clave desde el panel de admin.
                    </p>
                  )}
                  <Link to="/tests" state={{ rule: r.n }} className="btn btn-navy btn-sm">
                    <i className="ti ti-clipboard-check" /> Practicar Regla {r.n}
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
