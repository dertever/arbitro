import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { BADGES_DEF, RARITY_LABEL } from '../lib/data'

export default function Dashboard() {
  const { profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({ tests: 0, correct_pct: 0, situaciones: 0 })
  const [unlockedBadges, setUnlockedBadges] = useState([])
  const [recentSits, setRecentSits] = useState([])
  const [nextExam, setNextExam] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const name = profile?.full_name ?? 'Árbitro'
  const xp = profile?.xp ?? 0
  const level = Math.floor(xp / 500) + 1
  const xpInLevel = xp % 500
  const xpPct = Math.round((xpInLevel / 500) * 100)

  useEffect(() => {
    // Esperar a que el auth termine de cargar
    if (authLoading) return
    // Si no hay profile tras el auth, no hay nada que cargar
    if (!profile) { setDataLoading(false); return }

    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) { setLoadError(true); setDataLoading(false) }
    }, 8000)

    async function load() {
      try {
        const [
          { data: testData },
          { data: badgeData },
          { data: sitData },
          { data: sitAnswers },
          { data: examData },
        ] = await Promise.all([
          supabase.from('test_results').select('score, total').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(50),
          supabase.from('user_badges').select('badge_id, created_at').eq('user_id', profile.id),
          supabase.from('situations').select('id, title, rule_ref, difficulty').limit(6),
          supabase.from('situation_answers').select('id').eq('user_id', profile.id),
          supabase.from('exams').select('id, title, available_from, available_until, passing_score').eq('is_active', true).gte('available_until', new Date().toISOString()).order('available_from').limit(1),
        ])
        if (cancelled) return
        if (testData?.length) {
          const pct = Math.round(testData.reduce((a, t) => a + (t.score / t.total), 0) / testData.length * 100)
          setStats({ tests: testData.length, correct_pct: pct, situaciones: sitAnswers?.length ?? 0 })
        }
        if (badgeData) {
          setUnlockedBadges(
            badgeData
              .map(ub => ({ ...BADGES_DEF.find(b => b.id === ub.badge_id), unlocked_at: ub.created_at }))
              .filter(Boolean)
          )
        }
        if (sitData) setRecentSits(sitData)
        if (examData?.[0]) setNextExam(examData[0])
      } catch (e) {
        console.error('Dashboard load error:', e)
        if (!cancelled) setLoadError(true)
      } finally {
        clearTimeout(timeout)
        if (!cancelled) setDataLoading(false)
      }
    }
    load()
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [profile, authLoading])

  // ── ESTADOS DE CARGA ──────────────────────────────────────────────────────

  // Auth todavía resolviendo sesión
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
        <div className="spinner" />
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Verificando sesión...</p>
      </div>
    )
  }

  // Auth terminó pero profile es null → problema de Supabase/env vars
  if (!profile) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, maxWidth: 440, textAlign: 'center' }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 44, color: 'var(--orange)', display: 'block', marginBottom: 16 }} />
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, color: 'var(--navy)', marginBottom: 8 }}>
            No se pudo cargar el perfil
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 8 }}>
            Estás autenticado pero tu perfil no existe en la base de datos, o hay un error de conexión con Supabase.
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
            Comprueba en Vercel → Settings → Environment Variables que existen<br />
            <code style={{ background: 'var(--off)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>VITE_SUPABASE_URL</code> y{' '}
            <code style={{ background: 'var(--off)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>VITE_SUPABASE_ANON_KEY</code>
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-navy btn-sm" onClick={() => window.location.reload()}>
              <i className="ti ti-refresh" /> Reintentar
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => {
              import('../lib/supabase').then(({ supabase }) => supabase.auth.signOut().then(() => { window.location.href = '/login' }))
            }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Profile cargado, datos del dashboard cargando
  if (dataLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
        <div className="spinner" />
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Cargando tu panel...</p>
      </div>
    )
  }

  // Error en la carga de datos (timeout o excepción)
  if (loadError) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, maxWidth: 400, textAlign: 'center' }}>
          <i className="ti ti-wifi-off" style={{ fontSize: 44, color: 'var(--err)', display: 'block', marginBottom: 16 }} />
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, color: 'var(--navy)', marginBottom: 8 }}>Error de conexión</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
            No se pudieron cargar los datos del panel. Comprueba tu conexión a internet.
          </p>
          <button className="btn btn-navy btn-sm" onClick={() => window.location.reload()}>
            <i className="ti ti-refresh" /> Reintentar
          </button>
        </div>
      </div>
    )
  }

  // ── RENDER NORMAL ─────────────────────────────────────────────────────────

  const iconBgMap    = { navy: '#eef1f8', orange: 'var(--orange-soft)', green: 'var(--ok-bg)', gold: '#fefce8', silver: '#f8fafc' }
  const iconColorMap = { navy: 'var(--navy3)', orange: 'var(--orange2)', green: 'var(--ok)', gold: '#a16207', silver: 'var(--silver)' }

  return (
    <>
      <div className="ph">
        <h2>Bienvenido de nuevo</h2>
        <p>Continúa tu formación arbitral — aquí tienes tu resumen.</p>
      </div>

      {/* Alerta examen próximo */}
      {nextExam && (
        <div style={{ background: 'var(--orange-soft)', border: '1.5px solid var(--orange)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <i className="ti ti-calendar-event" style={{ fontSize: 24, color: 'var(--orange)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Examen disponible: {nextExam.title}</div>
            <div style={{ fontSize: 11, color: 'var(--orange2)' }}>
              Hasta el {new Date(nextExam.available_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} · Nota mínima: {nextExam.passing_score}%
            </div>
          </div>
          <Link to="/examenes" className="btn btn-orange btn-sm">
            <i className="ti ti-arrow-right" /> Ir al examen
          </Link>
        </div>
      )}

      {/* Hero */}
      <div className="hero">
        <div style={{ flex: 1 }}>
          <div className="hero-pre">Árbitro · Temporada 25/26</div>
          <div className="hero-name">{name}</div>
          <div className="xp-row">
            <div className="xp-track"><div className="xp-fill" style={{ width: `${xpPct}%` }} /></div>
            <span className="xp-label">{xpInLevel} / 500 XP · Nivel {level + 1}</span>
          </div>
        </div>
        <div className="level-box">
          <div className="level-n">{level}</div>
          <div className="level-t">Nivel</div>
        </div>
      </div>

      {/* Stats */}
      <div className="g4">
        <div className="sc"><div className="sc-label">XP acumulados</div><div className="sc-value orange">{xp.toLocaleString()}</div></div>
        <div className="sc"><div className="sc-label">Tests realizados</div><div className="sc-value">{stats.tests}</div></div>
        <div className="sc"><div className="sc-label">Acierto global</div><div className="sc-value">{stats.correct_pct}%</div></div>
        <div className="sc"><div className="sc-label">Insignias</div><div className="sc-value">{unlockedBadges.length}<span style={{ fontSize: 14, color: 'var(--muted)' }}>/{BADGES_DEF.length}</span></div></div>
      </div>

      <div className="g2">
        {/* Insignias */}
        <div className="card">
          <div className="card-title"><i className="ti ti-medal" />Últimas insignias</div>
          {unlockedBadges.length === 0 ? (
            <div className="empty-state">
              <i className="ti ti-medal" />
              <p>Completa tests para desbloquear insignias</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {unlockedBadges.slice(0, 4).map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: iconBgMap[b.cls] ?? '#eef1f8', color: iconColorMap[b.cls] ?? 'var(--navy3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${b.icon}`} style={{ fontSize: 16 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{b.sub}</div>
                  </div>
                  <span className={`pill pill-${b.rarity}`}>{RARITY_LABEL[b.rarity]}</span>
                </div>
              ))}
              <Link to="/insignias" className="btn btn-navy btn-sm" style={{ marginTop: 4 }}>
                <i className="ti ti-medal" /> Ver todas
              </Link>
            </div>
          )}
        </div>

        {/* Situaciones */}
        <div className="card">
          <div className="card-title"><i className="ti ti-video" />Situaciones de partido</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentSits.length === 0 ? (
              <div className="empty-state">
                <i className="ti ti-video" />
                <p>No hay situaciones disponibles aún</p>
              </div>
            ) : recentSits.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, background: 'var(--navy)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-player-play" style={{ fontSize: 15, color: 'var(--orange)', marginLeft: 2 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.rule_ref}</div>
                </div>
                <Link to={`/situaciones/${s.id}`} className="btn btn-outline btn-sm">Ver</Link>
              </div>
            ))}
            <Link to="/situaciones" className="btn btn-orange btn-sm" style={{ marginTop: 4 }}>
              <i className="ti ti-video" /> Ver todas
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-title"><i className="ti ti-bolt" />Práctica rápida</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/tests" className="btn btn-navy"><i className="ti ti-clipboard-check" /> Empezar test</Link>
          <Link to="/situaciones" className="btn btn-orange"><i className="ti ti-video" /> Resolver situación</Link>
          <Link to="/temario" className="btn btn-outline"><i className="ti ti-book" /> Repasar temario</Link>
          {nextExam && <Link to="/examenes" className="btn btn-outline" style={{ borderColor: 'var(--orange)', color: 'var(--orange)' }}><i className="ti ti-file-certificate" /> Examen oficial</Link>}
        </div>
      </div>
    </>
  )
}
