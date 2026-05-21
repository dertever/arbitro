import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

const DIFF_LABEL = { easy: 'Básico', med: 'Medio', hard: 'Difícil' }
const DIFF_CLS   = { easy: 'diff-easy', med: 'diff-med', hard: 'diff-hard' }

export default function Situaciones() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const toast = useToast()
  const [situations, setSituations] = useState([])
  const [active, setActive] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(null)
  const [timerW, setTimerW] = useState(100)
  const timerRef = useRef(null)

  useEffect(() => {
    supabase.from('situations').select('*').order('created_at').then(({ data }) => {
      if (data) setSituations(data)
    })
  }, [])

  useEffect(() => {
    if (id && situations.length) {
      const sit = situations.find(s => s.id === id || s.id === parseInt(id))
      if (sit) openSituation(sit)
    }
  }, [id, situations])

  function openSituation(sit) {
    setActive(sit)
    setAnswered(false)
    setSelected(null)
    setTimerW(100)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimerW(w => {
        if (w <= 0) { clearInterval(timerRef.current); return 0 }
        return w - 0.5
      })
    }, 200)
  }

  async function answer(idx) {
    if (answered) return
    clearInterval(timerRef.current)
    setSelected(idx)
    setAnswered(true)
    const isCorrect = idx === active.correct_option
    const xpEarned = isCorrect ? 50 : 10
    if (profile) {
      await supabase.from('situation_answers').insert({ user_id: profile.id, situation_id: active.id, selected_option: idx, is_correct: isCorrect })
      await supabase.from('profiles').update({ xp: (profile.xp ?? 0) + xpEarned }).eq('id', profile.id)
    }
    toast(isCorrect ? `¡Correcto! +${xpEarned} XP` : `Incorrecto. +${xpEarned} XP por participar`, isCorrect ? 'success' : 'error')
  }

  function nextSituation() {
    const idx = situations.findIndex(s => s.id === active.id)
    const next = situations[(idx + 1) % situations.length]
    navigate(`/situaciones/${next.id}`)
    openSituation(next)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  // Embed video URL (YouTube/Drive/Cloudinary)
  function renderVideo(url) {
    if (!url) return (
      <div style={{ background: 'var(--navy)', height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Situación de partido</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: 'white', textAlign: 'center', padding: '0 40px', lineHeight: 1.4 }}>
          {active?.scene_text}
        </div>
        {active?.scene_sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '0 40px' }}>{active.scene_sub}</div>}
        <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, background: 'var(--orange)', width: `${timerW}%`, transition: 'width 0.2s linear', borderRadius: '0 0 0 0' }} />
      </div>
    )
    let embedUrl = url
    if (url.includes('youtube.com/watch')) embedUrl = url.replace('watch?v=', 'embed/')
    else if (url.includes('youtu.be/')) embedUrl = url.replace('youtu.be/', 'www.youtube.com/embed/')
    else if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.match(/\/d\/([^/]+)/)?.[1]
      embedUrl = `https://drive.google.com/file/d/${fileId}/preview`
    }
    return (
      <div style={{ position: 'relative' }}>
        <iframe src={embedUrl} width="100%" height="220" frameBorder="0" allowFullScreen style={{ display: 'block' }} title="Situación de partido" />
        <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, background: 'var(--orange)', width: `${timerW}%`, transition: 'width 0.2s linear' }} />
      </div>
    )
  }

  return (
    <>
      <div className="ph"><h2>Situaciones de partido</h2><p>Observa cada jugada y decide como árbitro. Tu criterio se afina con la práctica.</p></div>

      {active && (
        <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
          {/* Video / Scene */}
          <div style={{ position: 'relative' }}>
            {renderVideo(active.video_url)}
          </div>

          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', background: 'var(--navy)', color: 'white', padding: '3px 9px', borderRadius: 5 }}>{active.rule_ref}</span>
              <span className={`diff ${DIFF_CLS[active.difficulty]}`}>{DIFF_LABEL[active.difficulty]}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, lineHeight: 1.4 }}>{active.question}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {(active.options || []).map((opt, i) => {
                let border = 'var(--border)', bg = 'white', color = 'var(--text)'
                if (answered) {
                  if (i === active.correct_option) { border = 'var(--ok)'; bg = 'var(--ok-bg)'; color = '#15803d' }
                  else if (selected === i) { border = 'var(--err)'; bg = 'var(--err-bg)'; color = 'var(--err)' }
                } else if (selected === i) { border = 'var(--orange)'; bg = 'var(--orange-soft)'; color = 'var(--orange2)' }
                const optText = typeof opt === 'string' ? opt : opt.text
                const optIcon = typeof opt === 'object' ? opt.icon : null
                return (
                  <div
                    key={i}
                    onClick={() => answer(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', border: `1.5px solid ${border}`, borderRadius: 'var(--r)', cursor: answered ? 'default' : 'pointer', background: bg, color, fontSize: 13, fontWeight: 500, transition: 'all 0.15s', textAlign: 'left' }}
                  >
                    {optIcon && <i className={`ti ${optIcon}`} style={{ fontSize: 18, flexShrink: 0 }} />}
                    {optText}
                  </div>
                )
              })}
            </div>

            {answered && (
              <div style={{ background: 'var(--off)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: selected === active.correct_option ? 'var(--ok)' : 'var(--err)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className={`ti ${selected === active.correct_option ? 'ti-circle-check' : 'ti-circle-x'}`} />
                  {selected === active.correct_option ? 'Correcto — bien señalado' : 'Incorrecto — revisión'}
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{active.explanation}</p>
                {active.rule_ref && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--navy)', color: 'white', padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, marginTop: 8 }}>
                    <i className="ti ti-book" style={{ fontSize: 13 }} />{active.rule_ref}
                  </span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => { setActive(null); navigate('/situaciones') }}>← Volver</button>
              {answered && <button className="btn btn-navy" onClick={nextSituation}><i className="ti ti-arrow-right" /> Siguiente situación</button>}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {!active && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="btn btn-orange" onClick={() => { const s = situations.find(x => !x.done); if (s) { navigate(`/situaciones/${s.id}`); openSituation(s) } }}>
              <i className="ti ti-bolt" /> Próxima sin resolver
            </button>
          </div>
          {situations.length === 0
            ? <div className="empty-state"><i className="ti ti-video" /><p>No hay situaciones disponibles aún. El administrador las añadirá pronto.</p></div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                {situations.map(s => (
                  <div key={s.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.18s' }}
                    onClick={() => { navigate(`/situaciones/${s.id}`); openSituation(s) }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--orange)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ background: 'var(--navy)', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <div style={{ width: 40, height: 40, background: 'var(--orange)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-player-play" style={{ fontSize: 18, color: 'white', marginLeft: 2 }} />
                      </div>
                      <span className={`diff ${DIFF_CLS[s.difficulty]}`} style={{ position: 'absolute', top: 8, left: 8 }}>{DIFF_LABEL[s.difficulty]}</span>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 4 }}>{s.rule_ref}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 3 }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </>
      )}
    </>
  )
}
