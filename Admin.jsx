import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import { REGLAS } from '../lib/data'

// ── HELPERS ──────────────────────────────────────────────────────────────────
const STATUS_CLS   = { active: 'status-active', pending: 'status-pending', blocked: 'status-blocked' }
const STATUS_LABEL = { active: 'Activo', pending: 'Pendiente', blocked: 'Bloqueado' }
const DIFF_LABEL   = { easy: 'Básico', med: 'Medio', hard: 'Difícil' }

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── TABS CONFIG ───────────────────────────────────────────────────────────────
const TABS = [
  { to: '/admin',            label: 'Resumen',      icon: 'ti-layout-dashboard', end: true },
  { to: '/admin/usuarios',   label: 'Usuarios',     icon: 'ti-users' },
  { to: '/admin/preguntas',  label: 'Preguntas',    icon: 'ti-database' },
  { to: '/admin/examenes',   label: 'Exámenes',     icon: 'ti-file-certificate' },
  { to: '/admin/situaciones',label: 'Situaciones',  icon: 'ti-video' },
  { to: '/admin/simulacros', label: 'Simulacros',   icon: 'ti-player-play' },
  { to: '/admin/temario',    label: 'Temario',      icon: 'ti-book' },
]

// ── ROOT ADMIN ────────────────────────────────────────────────────────────────
export default function Admin() {
  return (
    <>
      <div className="ph">
        <h2>Panel de administración</h2>
        <p>Gestión completa de árbitros, contenido y exámenes.</p>
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1.5px solid var(--border)', paddingBottom: 0, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={({ isActive }) => ({
              padding: '7px 13px', borderRadius: '8px 8px 0 0',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: 'transparent', color: isActive ? 'var(--navy)' : 'var(--muted)',
              borderBottom: isActive ? '2.5px solid var(--navy)' : '2.5px solid transparent',
              transition: 'all 0.15s', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap',
            })}
          >
            <i className={`ti ${tab.icon}`} />{tab.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<AdminResumen />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
        <Route path="usuarios/:id" element={<AdminUsuarioDetalle />} />
        <Route path="preguntas" element={<AdminPreguntas />} />
        <Route path="examenes" element={<AdminExamenes />} />
        <Route path="situaciones" element={<AdminSituaciones />} />
        <Route path="simulacros" element={<AdminSimulacros />} />
        <Route path="temario" element={<AdminTemario />} />
      </Routes>
    </>
  )
}

// ── 1. RESUMEN ────────────────────────────────────────────────────────────────
function AdminResumen() {
  const [stats, setStats] = useState(null)
  const [topUsers, setTopUsers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { data: profiles },
        { data: tests },
        { data: questions },
        { data: situations },
        { data: recentTests },
      ] = await Promise.all([
        supabase.from('profiles').select('id, status, xp, full_name, created_at').order('xp', { ascending: false }),
        supabase.from('test_results').select('id, score, total, created_at, user_id'),
        supabase.from('questions').select('id', { count: 'exact', head: true }),
        supabase.from('situations').select('id', { count: 'exact', head: true }),
        supabase.from('test_results').select('score, total, created_at, user_id, profiles(full_name)').order('created_at', { ascending: false }).limit(8),
      ])

      const total = profiles?.length ?? 0
      const active = profiles?.filter(p => p.status === 'active').length ?? 0
      const pending = profiles?.filter(p => p.status === 'pending').length ?? 0
      const today = new Date(); today.setHours(0,0,0,0)
      const testsHoy = tests?.filter(t => new Date(t.created_at) >= today).length ?? 0
      const avgScore = tests?.length
        ? Math.round(tests.reduce((a, t) => a + (t.score / t.total * 100), 0) / tests.length)
        : 0

      setStats({ total, active, pending, testsHoy, totalTests: tests?.length ?? 0, avgScore, totalQuestions: questions?.length ?? 0, totalSituaciones: situations?.length ?? 0 })
      setTopUsers((profiles ?? []).slice(0, 5))
      setRecentActivity(recentTests ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="spinner" />

  return (
    <>
      {/* KPIs */}
      <div className="g4" style={{ marginBottom: 20 }}>
        <div className="sc">
          <div className="sc-label">Árbitros totales</div>
          <div className="sc-value">{stats.total}</div>
          <div className="sc-sub" style={{ color: 'var(--ok)' }}>{stats.active} activos</div>
        </div>
        <div className="sc">
          <div className="sc-label">Pendientes</div>
          <div className="sc-value orange">{stats.pending}</div>
          <div className="sc-sub">en espera de aprobación</div>
        </div>
        <div className="sc">
          <div className="sc-label">Tests hoy</div>
          <div className="sc-value">{stats.testsHoy}</div>
          <div className="sc-sub">{stats.totalTests} en total</div>
        </div>
        <div className="sc">
          <div className="sc-label">Nota media global</div>
          <div className="sc-value">{stats.avgScore}%</div>
          <div className="sc-sub">{stats.totalQuestions} preguntas · {stats.totalSituaciones} situaciones</div>
        </div>
      </div>

      <div className="g2">
        {/* Top árbitros */}
        <div className="card">
          <div className="card-title"><i className="ti ti-trophy" />Top árbitros por XP</div>
          <table className="data-table">
            <thead><tr><th>#</th><th>Nombre</th><th>XP</th><th>Estado</th></tr></thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{u.full_name ?? '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--orange)', fontWeight: 600 }}>{(u.xp ?? 0).toLocaleString()}</td>
                  <td><span className={`status ${STATUS_CLS[u.status ?? 'pending']}`}>{STATUS_LABEL[u.status ?? 'pending']}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actividad reciente */}
        <div className="card">
          <div className="card-title"><i className="ti ti-activity" />Actividad reciente</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentActivity.map(t => {
              const pct = Math.round(t.score / t.total * 100)
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: pct >= 70 ? 'var(--ok-bg)' : 'var(--err-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${pct >= 70 ? 'ti-check' : 'ti-x'}`} style={{ fontSize: 14, color: pct >= 70 ? 'var(--ok)' : 'var(--err)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{t.profiles?.full_name ?? 'Usuario'}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDateTime(t.created_at)}</div>
                  </div>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 600, color: pct >= 70 ? 'var(--ok)' : 'var(--err)' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

// ── 2. USUARIOS ───────────────────────────────────────────────────────────────
function AdminUsuarios() {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, test_results(id, score, total, created_at)')
      .order('created_at', { ascending: false })
    if (data) {
      const enriched = data.map(u => {
        const tests = u.test_results ?? []
        const avg = tests.length ? Math.round(tests.reduce((a, t) => a + (t.score / t.total * 100), 0) / tests.length) : null
        const last = tests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        return { ...u, totalTests: tests.length, avgScore: avg, lastActivity: last?.created_at ?? null }
      })
      setUsers(enriched)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function approve(id) {
    await supabase.from('profiles').update({ status: 'active' }).eq('id', id)
    toast('Usuario aprobado ✓', 'success'); load()
  }
  async function block(id) {
    await supabase.from('profiles').update({ status: 'blocked' }).eq('id', id)
    toast('Usuario bloqueado'); load()
  }
  async function unblock(id) {
    await supabase.from('profiles').update({ status: 'active' }).eq('id', id)
    toast('Usuario reactivado', 'success'); load()
  }
  async function setAdmin(id) {
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', id)
    toast('Rol actualizado', 'success'); load()
  }
  async function removeAdmin(id) {
    await supabase.from('profiles').update({ role: 'user' }).eq('id', id)
    toast('Rol actualizado'); load()
  }

  const filtered = users
    .filter(u => filter === 'all' || u.status === filter)
    .filter(u => !search || (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) || (u.email ?? '').toLowerCase().includes(search.toLowerCase()))

  const counts = { all: users.length, pending: users.filter(u => u.status === 'pending').length, active: users.filter(u => u.status === 'active').length, blocked: users.filter(u => u.status === 'blocked').length }

  return (
    <>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['all','Todos'], ['pending','Pendientes'], ['active','Activos'], ['blocked','Bloqueados']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`btn btn-sm ${filter === v ? 'btn-navy' : 'btn-outline'}`}>
            {l} <span style={{ fontSize: 10, opacity: 0.7 }}>({counts[v]})</span>
          </button>
        ))}
        <input
          className="form-input"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', width: 220, fontSize: 12 }}
        />
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Rol</th>
                <th>XP</th>
                <th>Tests</th>
                <th>Nota media</th>
                <th>Última actividad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Sin resultados</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/usuarios/${u.id}`)}>
                  <td style={{ fontWeight: 500 }}>{u.full_name ?? '—'}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{u.email ?? '—'}</td>
                  <td><span className={`status ${STATUS_CLS[u.status ?? 'pending']}`}>{STATUS_LABEL[u.status ?? 'pending']}</span></td>
                  <td><span style={{ fontSize: 11, color: u.role === 'admin' ? 'var(--orange)' : 'var(--muted)', fontWeight: u.role === 'admin' ? 700 : 400 }}>{u.role ?? 'user'}</span></td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{u.xp ?? 0}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{u.totalTests}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: u.avgScore >= 70 ? 'var(--ok)' : u.avgScore !== null ? 'var(--err)' : 'var(--muted)' }}>
                    {u.avgScore !== null ? `${u.avgScore}%` : '—'}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(u.lastActivity)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {u.status === 'pending' && <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }} onClick={() => approve(u.id)}>Aprobar</button>}
                      {u.status === 'active' && <button className="btn btn-outline btn-sm" onClick={() => block(u.id)}>Bloquear</button>}
                      {u.status === 'blocked' && <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }} onClick={() => unblock(u.id)}>Reactivar</button>}
                      {u.role !== 'admin' ? <button className="btn btn-outline btn-sm" onClick={() => setAdmin(u.id)}>→ Admin</button>
                        : <button className="btn btn-outline btn-sm" onClick={() => removeAdmin(u.id)}>→ User</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

// ── 2b. DETALLE USUARIO ───────────────────────────────────────────────────────
function AdminUsuarioDetalle() {
  const { id } = { id: window.location.pathname.split('/').pop() }
  const [user, setUser] = useState(null)
  const [tests, setTests] = useState([])
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const { profile: adminProfile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const [{ data: u }, { data: t }, { data: n }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('test_results').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('admin_notes').select('*, profiles(full_name)').eq('user_id', id).order('created_at', { ascending: false }),
      ])
      setUser(u); setTests(t ?? []); setNotes(n ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  async function addNote() {
    if (!newNote.trim()) return
    const { error } = await supabase.from('admin_notes').insert({ user_id: id, admin_id: adminProfile.id, note: newNote })
    if (error) return toast(error.message, 'error')
    toast('Nota guardada', 'success')
    setNewNote('')
    const { data } = await supabase.from('admin_notes').select('*, profiles(full_name)').eq('user_id', id).order('created_at', { ascending: false })
    setNotes(data ?? [])
  }

  async function deleteNote(nid) {
    await supabase.from('admin_notes').delete().eq('id', nid)
    setNotes(n => n.filter(x => x.id !== nid))
    toast('Nota eliminada')
  }

  if (loading) return <div className="spinner" />
  if (!user) return <div>Usuario no encontrado</div>

  const avg = tests.length ? Math.round(tests.reduce((a, t) => a + (t.score / t.total * 100), 0) / tests.length) : null

  return (
    <>
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/usuarios')} style={{ marginBottom: 20 }}>
        <i className="ti ti-arrow-left" /> Volver
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Perfil */}
        <div className="card">
          <div className="card-title"><i className="ti ti-user" />Perfil</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Nombre', user.full_name ?? '—'], ['Email', user.email ?? '—'], ['Estado', STATUS_LABEL[user.status ?? 'pending']], ['Rol', user.role ?? 'user'], ['XP', (user.xp ?? 0).toLocaleString()], ['Registrado', fmtDate(user.created_at)]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="card">
          <div className="card-title"><i className="ti ti-chart-bar" />Estadísticas</div>
          <div className="g2" style={{ marginBottom: 0 }}>
            <div className="sc" style={{ padding: 12 }}><div className="sc-label">Tests</div><div className="sc-value" style={{ fontSize: 24 }}>{tests.length}</div></div>
            <div className="sc" style={{ padding: 12 }}><div className="sc-label">Nota media</div><div className="sc-value orange" style={{ fontSize: 24 }}>{avg !== null ? `${avg}%` : '—'}</div></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Historial de notas (últimos {tests.length} tests)</div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 40 }}>
              {tests.slice(0, 20).reverse().map((t, i) => {
                const pct = Math.round(t.score / t.total * 100)
                return <div key={i} title={`${pct}%`} style={{ flex: 1, minWidth: 6, height: `${Math.max(pct, 5)}%`, background: pct >= 70 ? 'var(--ok)' : 'var(--err)', borderRadius: 2, opacity: 0.8 }} />
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Notas admin */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title"><i className="ti ti-notes" />Notas internas (solo visible para admins)</div>
        <div style={{ marginBottom: 12 }}>
          <textarea
            className="form-textarea"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Añade una nota sobre este árbitro..."
            style={{ minHeight: 70, marginBottom: 8 }}
          />
          <button className="btn btn-navy btn-sm" onClick={addNote} disabled={!newNote.trim()}>
            <i className="ti ti-plus" /> Añadir nota
          </button>
        </div>
        {notes.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 0' }}>Sin notas</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notes.map(n => (
              <div key={n.id} style={{ background: 'var(--off)', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                    {n.profiles?.full_name ?? 'Admin'} · {fmtDateTime(n.created_at)}
                  </div>
                  <div style={{ fontSize: 13 }}>{n.note}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteNote(n.id)} style={{ alignSelf: 'flex-start', padding: '3px 7px' }}>
                  <i className="ti ti-trash" style={{ fontSize: 12 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial tests */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px 0' }}>
          <div className="card-title" style={{ marginBottom: 0 }}><i className="ti ti-clipboard-check" />Historial de tests</div>
        </div>
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Regla</th><th>Nota</th><th>Resultado</th></tr></thead>
          <tbody>
            {tests.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Sin tests registrados</td></tr>}
            {tests.map(t => {
              const pct = Math.round(t.score / t.total * 100)
              return (
                <tr key={t.id}>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDateTime(t.created_at)}</td>
                  <td style={{ fontSize: 12 }}>{t.rule_number ? `Regla ${t.rule_number}` : 'Aleatorio'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, color: pct >= 70 ? 'var(--ok)' : 'var(--err)' }}>{pct}%</td>
                  <td style={{ fontSize: 12 }}>{t.score}/{t.total}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── 3. PREGUNTAS ──────────────────────────────────────────────────────────────
function AdminPreguntas() {
  const [questions, setQuestions] = useState([])
  const [filterRule, setFilterRule] = useState('all')
  const [form, setForm] = useState({ rule_number: 1, question: '', options: ['', '', '', ''], correct_option: 0, explanation: '' })
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [showCsv, setShowCsv] = useState(false)
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('questions').select('*').order('rule_number').limit(500)
    if (data) setQuestions(data)
  }

  async function save() {
    if (!form.question.trim()) return toast('La pregunta no puede estar vacía', 'error')
    if (form.options.some(o => !o.trim())) return toast('Rellena todas las opciones', 'error')
    const payload = {
      rule_number: parseInt(form.rule_number),
      question: form.question,
      options: form.options,
      correct_option: parseInt(form.correct_option),
      explanation: form.explanation,
    }
    const { error } = editId
      ? await supabase.from('questions').update(payload).eq('id', editId)
      : await supabase.from('questions').insert(payload)
    if (error) return toast(error.message, 'error')
    toast(editId ? 'Pregunta actualizada' : 'Pregunta guardada', 'success')
    setShowForm(false); setEditId(null)
    setForm({ rule_number: 1, question: '', options: ['', '', '', ''], correct_option: 0, explanation: '' })
    load()
  }

  function startEdit(q) {
    setForm({ rule_number: q.rule_number, question: q.question, options: q.options, correct_option: q.correct_option, explanation: q.explanation ?? '' })
    setEditId(q.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function importCSV() {
    const lines = csvText.trim().split('\n').slice(1)
    let count = 0; let errors = 0
    for (const line of lines) {
      const parts = line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map(s => s.replace(/^"|"$/g, '').trim()) ?? []
      const [rule, question, a, b, c, d, correct, explanation] = parts
      if (!question) continue
      const { error } = await supabase.from('questions').insert({
        rule_number: parseInt(rule) || 1, question,
        options: [a ?? '', b ?? '', c ?? '', d ?? ''],
        correct_option: parseInt(correct) || 0,
        explanation: explanation ?? '',
      })
      error ? errors++ : count++
    }
    toast(`${count} importadas${errors ? ` · ${errors} errores` : ''}`, errors ? 'error' : 'success')
    setCsvText(''); setShowCsv(false); load()
  }

  async function deleteQ(id) {
    if (!confirm('¿Eliminar esta pregunta?')) return
    await supabase.from('questions').delete().eq('id', id)
    toast('Pregunta eliminada'); load()
  }

  const filtered = filterRule === 'all' ? questions : questions.filter(q => q.rule_number === parseInt(filterRule))

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{questions.length} preguntas</span>
        <select className="form-select" value={filterRule} onChange={e => setFilterRule(e.target.value)} style={{ width: 180, fontSize: 12 }}>
          <option value="all">Todas las reglas</option>
          {REGLAS.map(r => <option key={r.n} value={r.n}>Regla {r.n} — {r.name}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => { setShowCsv(!showCsv); setShowForm(false) }}>
            <i className="ti ti-upload" /> Importar CSV
          </button>
          <button className="btn btn-navy btn-sm" onClick={() => { setShowForm(!showForm); setShowCsv(false); setEditId(null); setForm({ rule_number: 1, question: '', options: ['', '', '', ''], correct_option: 0, explanation: '' }) }}>
            <i className="ti ti-plus" /> Nueva pregunta
          </button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><i className="ti ti-edit" />{editId ? 'Editar pregunta' : 'Nueva pregunta'}</div>
          <div className="g2">
            <div className="form-group">
              <label className="form-label">Regla</label>
              <select className="form-select" value={form.rule_number} onChange={e => setForm({ ...form, rule_number: e.target.value })}>
                {REGLAS.map(r => <option key={r.n} value={r.n}>Regla {r.n} — {r.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Respuesta correcta</label>
              <select className="form-select" value={form.correct_option} onChange={e => setForm({ ...form, correct_option: e.target.value })}>
                {[0,1,2,3].map(i => <option key={i} value={i}>Opción {['A','B','C','D'][i]}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Pregunta</label>
            <textarea className="form-textarea" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="¿Qué distancia debe guardar la barrera...?" />
          </div>
          {form.options.map((opt, i) => (
            <div className="form-group" key={i}>
              <label className="form-label">
                Opción {['A','B','C','D'][i]}
                {i === parseInt(form.correct_option) && <span style={{ marginLeft: 6, color: 'var(--ok)', fontSize: 11 }}>✓ Correcta</span>}
              </label>
              <input className="form-input" value={opt} onChange={e => { const ops = [...form.options]; ops[i] = e.target.value; setForm({ ...form, options: ops }) }} placeholder={`Opción ${['A','B','C','D'][i]}`} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Explicación (opcional)</label>
            <textarea className="form-textarea" value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} placeholder="Según la Regla X..." />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-orange" onClick={save}><i className="ti ti-check" /> {editId ? 'Actualizar' : 'Guardar'}</button>
            <button className="btn btn-outline" onClick={() => { setShowForm(false); setEditId(null) }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* CSV import */}
      {showCsv && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><i className="ti ti-upload" />Importar desde CSV</div>
          <div style={{ background: 'var(--navy)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
            <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#7dd3fc', lineHeight: 1.9 }}>
              regla,pregunta,opcion_a,opcion_b,opcion_c,opcion_d,correcta,explicacion<br />
              12,"¿Qué distancia...","9.15 m","7 m","10 m","5 m",0,"La barrera debe..."
            </code>
          </div>
          <textarea className="form-textarea" value={csvText} onChange={e => setCsvText(e.target.value)} placeholder="Pega el CSV aquí..." style={{ marginBottom: 8, minHeight: 120 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-navy btn-sm" onClick={importCSV} disabled={!csvText.trim()}><i className="ti ti-upload" /> Importar</button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowCsv(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>Regla</th><th>Pregunta</th><th>Correcta</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Sin preguntas</td></tr>}
            {filtered.map(q => (
              <tr key={q.id}>
                <td><span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, background: 'var(--navy)', color: 'white', padding: '2px 7px', borderRadius: 5 }}>R{q.rule_number}</span></td>
                <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{q.question}</td>
                <td style={{ fontSize: 12, color: 'var(--ok)' }}>{(q.options ?? [])[q.correct_option]?.slice(0, 40)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => startEdit(q)}><i className="ti ti-edit" /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteQ(q.id)}><i className="ti ti-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── 4. EXÁMENES OFICIALES ─────────────────────────────────────────────────────
function AdminExamenes() {
  const [exams, setExams] = useState([])
  const [questions, setQuestions] = useState([])
  const [examQuestions, setExamQuestions] = useState({}) // examId -> [questionIds]
  const [showForm, setShowForm] = useState(false)
  const [expandedExam, setExpandedExam] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', time_limit_minutes: 60, passing_score: 70, available_from: '', available_until: '' })
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(null)
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: e }, { data: q }] = await Promise.all([
      supabase.from('exams').select('*, exam_questions(question_id)').order('created_at', { ascending: false }),
      supabase.from('questions').select('id, rule_number, question').order('rule_number'),
    ])
    if (e) {
      setExams(e)
      const map = {}
      e.forEach(ex => { map[ex.id] = (ex.exam_questions ?? []).map(eq => eq.question_id) })
      setExamQuestions(map)
    }
    if (q) setQuestions(q)
  }

  async function saveExam() {
    if (!form.title.trim()) return toast('El título es obligatorio', 'error')
    const { error, data } = await supabase.from('exams').insert({
      title: form.title, description: form.description,
      time_limit_minutes: parseInt(form.time_limit_minutes),
      passing_score: parseInt(form.passing_score),
      available_from: form.available_from || null,
      available_until: form.available_until || null,
      is_active: false,
    }).select().single()
    if (error) return toast(error.message, 'error')
    toast('Examen creado', 'success')
    setShowForm(false)
    setForm({ title: '', description: '', time_limit_minutes: 60, passing_score: 70, available_from: '', available_until: '' })
    load()
    setExpandedExam(data.id)
  }

  async function toggleActive(exam) {
    await supabase.from('exams').update({ is_active: !exam.is_active }).eq('id', exam.id)
    toast(exam.is_active ? 'Examen desactivado' : 'Examen activado ✓', 'success')
    load()
  }

  async function deleteExam(id) {
    if (!confirm('¿Eliminar este examen y todos sus resultados?')) return
    await supabase.from('exams').delete().eq('id', id)
    toast('Examen eliminado'); load()
  }

  async function toggleQuestion(examId, qId) {
    const current = examQuestions[examId] ?? []
    if (current.includes(qId)) {
      await supabase.from('exam_questions').delete().eq('exam_id', examId).eq('question_id', qId)
      setExamQuestions(prev => ({ ...prev, [examId]: prev[examId].filter(id => id !== qId) }))
    } else {
      await supabase.from('exam_questions').insert({ exam_id: examId, question_id: qId, order_num: current.length + 1 })
      setExamQuestions(prev => ({ ...prev, [examId]: [...(prev[examId] ?? []), qId] }))
    }
  }

  async function loadResults(examId) {
    const { data } = await supabase.from('exam_results').select('*, profiles(full_name, email)').eq('exam_id', examId).order('completed_at', { ascending: false })
    setResults(data ?? [])
    setShowResults(examId)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{exams.length} exámenes</span>
        <button className="btn btn-navy btn-sm" onClick={() => setShowForm(!showForm)}><i className="ti ti-plus" /> Nuevo examen</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><i className="ti ti-file-certificate" />Nuevo examen oficial</div>
          <div className="g2">
            <div className="form-group">
              <label className="form-label">Título</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Examen Oficial Temporada 25/26" />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Examen de aptitud arbitral..." />
            </div>
            <div className="form-group">
              <label className="form-label">Tiempo límite (minutos)</label>
              <input className="form-input" type="number" value={form.time_limit_minutes} onChange={e => setForm({ ...form, time_limit_minutes: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Nota mínima para aprobar (%)</label>
              <input className="form-input" type="number" value={form.passing_score} onChange={e => setForm({ ...form, passing_score: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Disponible desde</label>
              <input className="form-input" type="datetime-local" value={form.available_from} onChange={e => setForm({ ...form, available_from: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Disponible hasta</label>
              <input className="form-input" type="datetime-local" value={form.available_until} onChange={e => setForm({ ...form, available_until: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-orange" onClick={saveExam}><i className="ti ti-check" /> Crear examen</button>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {exams.map(exam => {
        const eqIds = examQuestions[exam.id] ?? []
        const isExpanded = expandedExam === exam.id
        const isResultsOpen = showResults === exam.id
        return (
          <div key={exam.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: exam.is_active ? 'var(--ok-bg)' : 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-file-certificate" style={{ fontSize: 18, color: exam.is_active ? 'var(--ok)' : 'var(--muted)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{exam.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {eqIds.length} preguntas · {exam.time_limit_minutes} min · Aprobado ≥ {exam.passing_score}%
                  {exam.available_until && ` · Hasta ${fmtDate(exam.available_until)}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={`status ${exam.is_active ? 'status-active' : 'status-blocked'}`}>{exam.is_active ? 'Activo' : 'Inactivo'}</span>
                <button className="btn btn-outline btn-sm" onClick={() => toggleActive(exam)}>
                  {exam.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => loadResults(exam.id)}>
                  <i className="ti ti-chart-bar" /> Resultados
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setExpandedExam(isExpanded ? null : exam.id)}>
                  <i className={`ti ${isExpanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} /> Preguntas
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteExam(exam.id)}><i className="ti ti-trash" /></button>
              </div>
            </div>

            {/* Selector de preguntas */}
            {isExpanded && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                  Selecciona las preguntas del examen ({eqIds.length} seleccionadas)
                </div>
                {REGLAS.map(r => {
                  const rqs = questions.filter(q => q.rule_number === r.n)
                  if (!rqs.length) return null
                  return (
                    <div key={r.n} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Regla {r.n} — {r.name}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {rqs.map(q => {
                          const sel = eqIds.includes(q.id)
                          return (
                            <label key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: sel ? 'var(--ok-bg)' : 'transparent', border: `1px solid ${sel ? 'var(--ok)' : 'var(--border)'}` }}>
                              <input type="checkbox" checked={sel} onChange={() => toggleQuestion(exam.id, q.id)} style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: 12 }}>{q.question}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Resultados */}
            {isResultsOpen && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Resultados ({results.length} participantes)</div>
                {results.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Nadie ha realizado este examen aún.</div>
                ) : (
                  <table className="data-table">
                    <thead><tr><th>Árbitro</th><th>Nota</th><th>Resultado</th><th>Fecha</th></tr></thead>
                    <tbody>
                      {results.map(r => {
                        const pct = Math.round(r.score / r.total * 100)
                        return (
                          <tr key={r.id}>
                            <td style={{ fontSize: 13, fontWeight: 500 }}>{r.profiles?.full_name ?? '—'}</td>
                            <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, color: r.passed ? 'var(--ok)' : 'var(--err)' }}>{pct}%</td>
                            <td><span className={`status ${r.passed ? 'status-active' : 'status-blocked'}`}>{r.passed ? 'Aprobado' : 'Suspenso'}</span></td>
                            <td style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDateTime(r.completed_at)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

// ── 5. SITUACIONES ────────────────────────────────────────────────────────────
function AdminSituaciones() {
  const [situations, setSituations] = useState([])
  const EMPTY_FORM = { rule_ref: 'Regla 12', title: '', description: '', difficulty: 'med', scene_text: '', question: '', options: [{ text: '', icon: 'ti-check' }, { text: '', icon: 'ti-x' }, { text: '', icon: 'ti-circle-dot' }, { text: '', icon: 'ti-refresh' }], correct_option: 0, explanation: '', video_url: '' }
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('situations').select('id, title, rule_ref, difficulty, video_url, created_at').order('created_at', { ascending: false })
    if (data) setSituations(data)
  }

  async function save() {
    if (!form.title.trim()) return toast('El título es obligatorio', 'error')
    const { error } = editId
      ? await supabase.from('situations').update(form).eq('id', editId)
      : await supabase.from('situations').insert(form)
    if (error) return toast(error.message, 'error')
    toast(editId ? 'Situación actualizada' : 'Situación creada', 'success')
    setShowForm(false); setEditId(null); setForm(EMPTY_FORM); load()
  }

  async function deleteSit(id) {
    if (!confirm('¿Eliminar esta situación?')) return
    await supabase.from('situations').delete().eq('id', id)
    toast('Situación eliminada'); load()
  }

  function startEdit(id) {
    supabase.from('situations').select('*').eq('id', id).single().then(({ data }) => {
      if (data) { setForm(data); setEditId(id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    })
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{situations.length} situaciones</span>
        <button className="btn btn-navy btn-sm" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM) }}>
          <i className="ti ti-plus" /> Nueva situación
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><i className="ti ti-video" />{editId ? 'Editar situación' : 'Nueva situación'}</div>
          <div className="g2">
            <div className="form-group">
              <label className="form-label">Referencia reglamentaria</label>
              <input className="form-input" value={form.rule_ref} onChange={e => setForm({ ...form, rule_ref: e.target.value })} placeholder="Regla 12" />
            </div>
            <div className="form-group">
              <label className="form-label">Dificultad</label>
              <select className="form-select" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Básico</option><option value="med">Medio</option><option value="hard">Difícil</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Título</label>
            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="¿Falta o juego brusco?" />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción breve</label>
            <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Jugador cae al área tras contacto..." />
          </div>
          <div className="form-group">
            <label className="form-label">Escena (narración de la jugada)</label>
            <textarea className="form-textarea" value={form.scene_text} onChange={e => setForm({ ...form, scene_text: e.target.value })} placeholder="Minuto 67. El delantero penetra..." />
          </div>
          <div className="form-group">
            <label className="form-label">Pregunta al árbitro</label>
            <input className="form-input" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="¿Qué señalas?" />
          </div>
          {form.options.map((opt, i) => (
            <div className="form-group" key={i}>
              <label className="form-label">
                Opción {['A','B','C','D'][i]}
                {i === form.correct_option && <span style={{ marginLeft: 6, color: 'var(--ok)', fontSize: 11 }}>✓ Correcta</span>}
              </label>
              <input className="form-input" value={opt.text} onChange={e => { const ops = [...form.options]; ops[i] = { ...ops[i], text: e.target.value }; setForm({ ...form, options: ops }) }} placeholder={`Opción ${['A','B','C','D'][i]}`} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Opción correcta</label>
            <select className="form-select" value={form.correct_option} onChange={e => setForm({ ...form, correct_option: parseInt(e.target.value) })}>
              {[0,1,2,3].map(i => <option key={i} value={i}>Opción {['A','B','C','D'][i]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Explicación</label>
            <textarea className="form-textarea" value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} placeholder="Según la Regla X..." />
          </div>
          <div className="form-group">
            <label className="form-label">URL del vídeo (YouTube, Drive o Cloudinary — opcional)</label>
            <input className="form-input" value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtu.be/..." />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-orange" onClick={save}><i className="ti ti-check" /> {editId ? 'Actualizar' : 'Guardar'}</button>
            <button className="btn btn-outline" onClick={() => { setShowForm(false); setEditId(null) }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {situations.length === 0 && <div className="empty-state"><i className="ti ti-video" /><p>Sin situaciones. Crea la primera.</p></div>}
        {situations.map(s => (
          <div key={s.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, background: 'var(--navy)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-video" style={{ fontSize: 17, color: 'var(--orange)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {s.rule_ref} · <span className={`diff diff-${s.difficulty}`}>{DIFF_LABEL[s.difficulty]}</span>
                {s.video_url && <><i className="ti ti-check" style={{ fontSize: 10, marginLeft: 8, marginRight: 2, color: 'var(--ok)' }} /><span style={{ color: 'var(--ok)' }}>Vídeo</span></>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-outline btn-sm" onClick={() => startEdit(s.id)}><i className="ti ti-edit" /></button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteSit(s.id)}><i className="ti ti-trash" /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── 6. SIMULACROS ─────────────────────────────────────────────────────────────
function AdminSimulacros() {
  const [simulacros, setSimulacros] = useState([])
  const EMPTY = { title: '', description: '', video_url: '', duration_minutes: '', difficulty: 'med', is_published: false }
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('simulacros').select('*').order('created_at', { ascending: false })
    if (data) setSimulacros(data)
  }

  async function save() {
    if (!form.title.trim()) return toast('El título es obligatorio', 'error')
    const payload = { ...form, duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null }
    const { error } = editId
      ? await supabase.from('simulacros').update(payload).eq('id', editId)
      : await supabase.from('simulacros').insert(payload)
    if (error) return toast(error.message, 'error')
    toast(editId ? 'Simulacro actualizado' : 'Simulacro creado', 'success')
    setShowForm(false); setEditId(null); setForm(EMPTY); load()
  }

  async function togglePublish(s) {
    await supabase.from('simulacros').update({ is_published: !s.is_published }).eq('id', s.id)
    toast(s.is_published ? 'Despublicado' : 'Publicado ✓', 'success'); load()
  }

  async function deleteSim(id) {
    if (!confirm('¿Eliminar este simulacro?')) return
    await supabase.from('simulacros').delete().eq('id', id)
    toast('Simulacro eliminado'); load()
  }

  return (
    <>
      <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--orange-soft)', borderRadius: 8, border: '1px solid #fbd4a4', fontSize: 12, color: 'var(--orange2)' }}>
        <i className="ti ti-info-circle" style={{ marginRight: 6 }} />
        Los simulacros son vídeos completos de partido donde los árbitros pueden ver jugadas reales y evaluar sus decisiones. Sube el vídeo a YouTube o Google Drive y pega la URL aquí.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{simulacros.length} simulacros</span>
        <button className="btn btn-navy btn-sm" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY) }}>
          <i className="ti ti-plus" /> Nuevo simulacro
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><i className="ti ti-player-play" />{editId ? 'Editar simulacro' : 'Nuevo simulacro'}</div>
          <div className="g2">
            <div className="form-group">
              <label className="form-label">Título</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Simulacro — Partido liga regional" />
            </div>
            <div className="form-group">
              <label className="form-label">Dificultad</label>
              <select className="form-select" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Básico</option><option value="med">Medio</option><option value="hard">Difícil</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Partido de liga regional. 15 jugadas a analizar..." style={{ minHeight: 70 }} />
          </div>
          <div className="g2">
            <div className="form-group">
              <label className="form-label">URL del vídeo (YouTube / Drive / Cloudinary)</label>
              <input className="form-input" value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtu.be/..." />
            </div>
            <div className="form-group">
              <label className="form-label">Duración (minutos)</label>
              <input className="form-input" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} placeholder="90" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-orange" onClick={save}><i className="ti ti-check" /> {editId ? 'Actualizar' : 'Guardar'}</button>
            <button className="btn btn-outline" onClick={() => { setShowForm(false); setEditId(null) }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {simulacros.length === 0 && <div className="empty-state"><i className="ti ti-player-play" /><p>Sin simulacros. Añade el primero.</p></div>}
        {simulacros.map(s => (
          <div key={s.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, background: s.is_published ? 'var(--ok-bg)' : 'var(--off)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-player-play" style={{ fontSize: 17, color: s.is_published ? 'var(--ok)' : 'var(--muted)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  <span className={`diff diff-${s.difficulty}`}>{DIFF_LABEL[s.difficulty]}</span>
                  {s.duration_minutes && <> · {s.duration_minutes} min</>}
                  {s.video_url && <> · <i className="ti ti-link" style={{ fontSize: 10 }} /> URL asignada</>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={`status ${s.is_published ? 'status-active' : 'status-pending'}`}>{s.is_published ? 'Publicado' : 'Borrador'}</span>
                <button className="btn btn-outline btn-sm" onClick={() => togglePublish(s)}>
                  {s.is_published ? 'Despublicar' : 'Publicar'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => { setForm(s); setEditId(s.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                  <i className="ti ti-edit" />
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteSim(s.id)}><i className="ti ti-trash" /></button>
              </div>
            </div>
            {s.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>{s.description}</div>}
          </div>
        ))}
      </div>
    </>
  )
}

// ── 7. TEMARIO ────────────────────────────────────────────────────────────────
function AdminTemario() {
  const [rules, setRules] = useState(REGLAS.map(r => ({ ...r, video_url: '', description: '', key_points: '' })))
  const [editN, setEditN] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    supabase.from('rule_content').select('*').then(({ data }) => {
      if (data) {
        setRules(prev => prev.map(r => {
          const content = data.find(d => d.rule_number === r.n)
          return content ? { ...r, video_url: content.video_url ?? '', description: content.description ?? '', key_points: content.key_points ?? '' } : r
        }))
      }
      setLoading(false)
    })
  }, [])

  async function saveRule(n, data) {
    const { error } = await supabase.from('rule_content').upsert({ rule_number: n, ...data, updated_at: new Date().toISOString() }, { onConflict: 'rule_number' })
    if (error) return toast(error.message, 'error')
    toast('Contenido guardado ✓', 'success')
    setEditN(null)
  }

  if (loading) return <div className="spinner" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rules.map(r => (
        <div key={r.n} className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, background: 'var(--navy)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, color: 'var(--orange)', flexShrink: 0 }}>{r.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
              <div style={{ fontSize: 11 }}>
                {r.video_url
                  ? <span style={{ color: 'var(--ok)' }}><i className="ti ti-check" style={{ fontSize: 10, marginRight: 3 }} />Vídeo asignado</span>
                  : <span style={{ color: 'var(--muted)' }}>Sin vídeo</span>}
                {r.description && <span style={{ color: 'var(--muted)', marginLeft: 10 }}><i className="ti ti-check" style={{ fontSize: 10, marginRight: 3, color: 'var(--ok)' }} />Descripción</span>}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setEditN(editN === r.n ? null : r.n)}>
              <i className={`ti ${editN === r.n ? 'ti-chevron-up' : 'ti-edit'}`} /> {editN === r.n ? 'Cerrar' : 'Editar'}
            </button>
          </div>
          {editN === r.n && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div className="form-group">
                <label className="form-label">URL del vídeo (YouTube, Drive, Cloudinary)</label>
                <input className="form-input" value={r.video_url} onChange={e => setRules(rs => rs.map(x => x.n === r.n ? { ...x, video_url: e.target.value } : x))} placeholder="https://youtu.be/..." />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción de la regla</label>
                <textarea className="form-textarea" value={r.description} onChange={e => setRules(rs => rs.map(x => x.n === r.n ? { ...x, description: e.target.value } : x))} placeholder="Define las dimensiones del campo..." />
              </div>
              <div className="form-group">
                <label className="form-label">Puntos clave (uno por línea)</label>
                <textarea className="form-textarea" value={r.key_points} onChange={e => setRules(rs => rs.map(x => x.n === r.n ? { ...x, key_points: e.target.value } : x))} placeholder="La barrera debe estar a 9,15 m&#10;El portero tiene 6 segundos..." style={{ minHeight: 100 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-orange btn-sm" onClick={() => saveRule(r.n, { video_url: r.video_url, description: r.description, key_points: r.key_points })}>
                  <i className="ti ti-check" /> Guardar
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditN(null)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
