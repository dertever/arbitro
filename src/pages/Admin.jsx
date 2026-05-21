import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { REGLAS } from '../lib/data'

export default function Admin() {
  return (
    <>
      <div className="ph"><h2>Panel de administración</h2><p>Gestión de usuarios, preguntas, situaciones y temario.</p></div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1.5px solid var(--border)', paddingBottom: 0 }}>
        {[
          { to: '/admin', label: 'Usuarios', icon: 'ti-users' },
          { to: '/admin/preguntas', label: 'Preguntas', icon: 'ti-database' },
          { to: '/admin/situaciones', label: 'Situaciones', icon: 'ti-video' },
          { to: '/admin/temario', label: 'Temario', icon: 'ti-book' },
        ].map(tab => (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/admin'} style={({ isActive }) => ({
            padding: '7px 14px', borderRadius: '8px 8px 0 0',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
            background: 'transparent', color: isActive ? 'var(--navy)' : 'var(--muted)',
            borderBottom: isActive ? '2px solid var(--navy)' : '2px solid transparent',
            transition: 'all 0.15s', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
          })}>
            <i className={`ti ${tab.icon}`} />{tab.label}
          </NavLink>
        ))}
      </div>
      <Routes>
        <Route index element={<AdminUsuarios />} />
        <Route path="preguntas" element={<AdminPreguntas />} />
        <Route path="situaciones" element={<AdminSituaciones />} />
        <Route path="temario" element={<AdminTemario />} />
      </Routes>
    </>
  )
}

// ── USUARIOS ──────────────────────────────────────────────
function AdminUsuarios() {
  const [users, setUsers] = useState([])
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
  }

  async function approve(id) {
    await supabase.from('profiles').update({ status: 'active' }).eq('id', id)
    toast('Usuario aprobado', 'success'); load()
  }

  async function block(id) {
    await supabase.from('profiles').update({ status: 'blocked' }).eq('id', id)
    toast('Usuario bloqueado'); load()
  }

  async function setAdmin(id) {
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', id)
    toast('Rol actualizado', 'success'); load()
  }

  const statusCls = { active: 'status-active', pending: 'status-pending', blocked: 'status-blocked' }
  const statusLabel = { active: 'Activo', pending: 'Pendiente', blocked: 'Bloqueado' }

  return (
    <div className="card" style={{ padding: 0 }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th><th>Email</th><th>Estado</th><th>Rol</th><th>XP</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td style={{ fontWeight: 500 }}>{u.full_name ?? '—'}</td>
              <td style={{ color: 'var(--muted)', fontSize: 12 }}>{u.email ?? '—'}</td>
              <td><span className={`status ${statusCls[u.status ?? 'pending']}`}>{statusLabel[u.status ?? 'pending']}</span></td>
              <td><span style={{ fontSize: 11, color: 'var(--muted)' }}>{u.role ?? 'user'}</span></td>
              <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{u.xp ?? 0}</td>
              <td>
                {u.status === 'pending' && <button className="btn btn-outline btn-sm" onClick={() => approve(u.id)} style={{ marginRight: 4 }}>Aprobar</button>}
                {u.status === 'active' && <button className="btn btn-outline btn-sm" onClick={() => block(u.id)} style={{ marginRight: 4 }}>Bloquear</button>}
                {u.role !== 'admin' && <button className="btn btn-outline btn-sm" onClick={() => setAdmin(u.id)}>→ Admin</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── PREGUNTAS ─────────────────────────────────────────────
function AdminPreguntas() {
  const [questions, setQuestions] = useState([])
  const [form, setForm] = useState({ rule_number: 1, question: '', options: ['', '', '', ''], correct_option: 0, explanation: '' })
  const [showForm, setShowForm] = useState(false)
  const [csvText, setCsvText] = useState('')
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('questions').select('*').order('rule_number').limit(100)
    if (data) setQuestions(data)
  }

  async function save() {
    if (!form.question.trim()) return toast('La pregunta no puede estar vacía', 'error')
    const { error } = await supabase.from('questions').insert({
      rule_number: parseInt(form.rule_number),
      question: form.question,
      options: form.options,
      correct_option: parseInt(form.correct_option),
      explanation: form.explanation,
    })
    if (error) return toast(error.message, 'error')
    toast('Pregunta guardada', 'success')
    setShowForm(false)
    setForm({ rule_number: 1, question: '', options: ['', '', '', ''], correct_option: 0, explanation: '' })
    load()
  }

  async function importCSV() {
    const lines = csvText.trim().split('\n').slice(1) // skip header
    let count = 0
    for (const line of lines) {
      const [rule, question, a, b, c, d, correct, explanation] = line.split(',').map(s => s.replace(/^"|"$/g, '').trim())
      if (!question) continue
      await supabase.from('questions').insert({
        rule_number: parseInt(rule), question,
        options: [a, b, c, d],
        correct_option: parseInt(correct),
        explanation: explanation ?? '',
      })
      count++
    }
    toast(`${count} preguntas importadas`, 'success')
    setCsvText('')
    load()
  }

  async function deleteQ(id) {
    await supabase.from('questions').delete().eq('id', id)
    toast('Pregunta eliminada'); load()
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{questions.length} preguntas en la base de datos</span>
        <button className="btn btn-navy btn-sm" onClick={() => setShowForm(!showForm)}><i className="ti ti-plus" /> Nueva pregunta</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><i className="ti ti-plus" />Nueva pregunta</div>
          <div className="g2">
            <div className="form-group">
              <label className="form-label">Regla</label>
              <select className="form-select" value={form.rule_number} onChange={e => setForm({ ...form, rule_number: e.target.value })}>
                {REGLAS.map(r => <option key={r.n} value={r.n}>Regla {r.n} — {r.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Respuesta correcta (0–3)</label>
              <select className="form-select" value={form.correct_option} onChange={e => setForm({ ...form, correct_option: e.target.value })}>
                {[0, 1, 2, 3].map(i => <option key={i} value={i}>Opción {['A', 'B', 'C', 'D'][i]}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Pregunta</label>
            <textarea className="form-textarea" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="¿Qué distancia debe guardar la barrera...?" />
          </div>
          {form.options.map((opt, i) => (
            <div className="form-group" key={i}>
              <label className="form-label">Opción {['A', 'B', 'C', 'D'][i]}</label>
              <input className="form-input" value={opt} onChange={e => { const ops = [...form.options]; ops[i] = e.target.value; setForm({ ...form, options: ops }) }} placeholder={`Opción ${['A', 'B', 'C', 'D'][i]}`} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Explicación (opcional)</label>
            <textarea className="form-textarea" value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} placeholder="Según la Regla X..." />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-orange" onClick={save}><i className="ti ti-check" /> Guardar</button>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* CSV import */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title"><i className="ti ti-upload" />Importar desde CSV</div>
        <div style={{ background: 'var(--navy)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#7dd3fc', lineHeight: 1.9 }}>
            regla,pregunta,opcion_a,opcion_b,opcion_c,opcion_d,correcta,explicacion<br />
            12,"¿Qué distancia...","9.15 m","7 m","10 m","5 m",0,"La barrera debe..."
          </code>
        </div>
        <textarea className="form-textarea" value={csvText} onChange={e => setCsvText(e.target.value)} placeholder="Pega el CSV aquí..." style={{ marginBottom: 8, minHeight: 100 }} />
        <button className="btn btn-navy btn-sm" onClick={importCSV} disabled={!csvText.trim()}><i className="ti ti-upload" /> Importar</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>Regla</th><th>Pregunta</th><th>Correcta</th><th></th></tr></thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.id}>
                <td><span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, background: 'var(--navy)', color: 'white', padding: '2px 7px', borderRadius: 5 }}>R{q.rule_number}</span></td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{q.question}</td>
                <td style={{ fontSize: 12 }}>{(q.options ?? [])[q.correct_option]?.slice(0, 30)}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => deleteQ(q.id)}><i className="ti ti-trash" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── SITUACIONES ──────────────────────────────────────────
function AdminSituaciones() {
  const [situations, setSituations] = useState([])
  const [form, setForm] = useState({ rule_ref: 'Regla 12', title: '', description: '', difficulty: 'med', scene_text: '', question: '', options: [{ text: '', icon: 'ti-check' }, { text: '', icon: 'ti-x' }, { text: '', icon: 'ti-circle-dot' }, { text: '', icon: 'ti-refresh' }], correct_option: 0, explanation: '', video_url: '' })
  const [showForm, setShowForm] = useState(false)
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('situations').select('id, title, rule_ref, difficulty, video_url').order('created_at', { ascending: false })
    if (data) setSituations(data)
  }

  async function save() {
    if (!form.title.trim()) return toast('El título no puede estar vacío', 'error')
    const { error } = await supabase.from('situations').insert(form)
    if (error) return toast(error.message, 'error')
    toast('Situación guardada', 'success'); setShowForm(false); load()
  }

  async function deleteSit(id) {
    await supabase.from('situations').delete().eq('id', id)
    toast('Situación eliminada'); load()
  }

  async function updateVideo(id, url) {
    await supabase.from('situations').update({ video_url: url }).eq('id', id)
    toast('URL de vídeo guardada', 'success'); load()
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{situations.length} situaciones</span>
        <button className="btn btn-navy btn-sm" onClick={() => setShowForm(!showForm)}><i className="ti ti-plus" /> Nueva situación</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><i className="ti ti-video" />Nueva situación</div>
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
            <label className="form-label">Escena (texto que describe la jugada)</label>
            <textarea className="form-textarea" value={form.scene_text} onChange={e => setForm({ ...form, scene_text: e.target.value })} placeholder="Minuto 67. El delantero..." />
          </div>
          <div className="form-group">
            <label className="form-label">Pregunta al árbitro</label>
            <input className="form-input" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="¿Qué señalas?" />
          </div>
          {form.options.map((opt, i) => (
            <div className="form-group" key={i}>
              <label className="form-label">Opción {['A', 'B', 'C', 'D'][i]}{i === form.correct_option ? ' ✓ Correcta' : ''}</label>
              <input className="form-input" value={opt.text} onChange={e => { const ops = [...form.options]; ops[i] = { ...ops[i], text: e.target.value }; setForm({ ...form, options: ops }) }} placeholder={`Opción ${['A', 'B', 'C', 'D'][i]}`} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Opción correcta (0 = A, 1 = B, 2 = C, 3 = D)</label>
            <select className="form-select" value={form.correct_option} onChange={e => setForm({ ...form, correct_option: parseInt(e.target.value) })}>
              {[0, 1, 2, 3].map(i => <option key={i} value={i}>Opción {['A', 'B', 'C', 'D'][i]}</option>)}
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
            <button className="btn btn-orange" onClick={save}><i className="ti ti-check" /> Guardar situación</button>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {situations.map(s => (
          <div key={s.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'var(--navy)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-video" style={{ fontSize: 16, color: 'var(--orange)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.rule_ref}</div>
            </div>
            <VideoUrlInput current={s.video_url} onSave={url => updateVideo(s.id, url)} />
            <button className="btn btn-danger btn-sm" onClick={() => deleteSit(s.id)}><i className="ti ti-trash" /></button>
          </div>
        ))}
      </div>
    </>
  )
}

function VideoUrlInput({ current, onSave }) {
  const [val, setVal] = useState(current ?? '')
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input className="form-input" value={val} onChange={e => setVal(e.target.value)} placeholder="URL vídeo..." style={{ width: 200, fontSize: 11 }} />
      <button className="btn btn-outline btn-sm" onClick={() => onSave(val)}><i className="ti ti-check" /></button>
    </div>
  )
}

// ── TEMARIO ADMIN ─────────────────────────────────────────
function AdminTemario() {
  const [rules, setRules] = useState(REGLAS.map(r => ({ ...r, video_url: '', description: '', key_points: '' })))
  const [editN, setEditN] = useState(null)
  const toast = useToast()

  async function saveRule(n, data) {
    await supabase.from('rule_content').upsert({ rule_number: n, ...data }, { onConflict: 'rule_number' })
    toast('Contenido guardado', 'success')
    setEditN(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rules.map(r => (
        <div key={r.n} className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'var(--navy)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, color: 'var(--orange)', flexShrink: 0 }}>{r.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: r.video_url ? 'var(--ok)' : 'var(--muted)' }}>
                {r.video_url ? <><i className="ti ti-check" style={{ fontSize: 11, marginRight: 3 }} />Vídeo asignado</> : 'Sin vídeo'}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setEditN(editN === r.n ? null : r.n)}>
              <i className="ti ti-edit" /> Editar
            </button>
          </div>
          {editN === r.n && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div className="form-group">
                <label className="form-label">URL del vídeo (YouTube, Drive, Cloudinary)</label>
                <input className="form-input" value={r.video_url} onChange={e => setRules(rs => rs.map(x => x.n === r.n ? { ...x, video_url: e.target.value } : x))} placeholder="https://youtu.be/..." />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-textarea" value={r.description} onChange={e => setRules(rs => rs.map(x => x.n === r.n ? { ...x, description: e.target.value } : x))} />
              </div>
              <div className="form-group">
                <label className="form-label">Puntos clave (uno por línea)</label>
                <textarea className="form-textarea" value={r.key_points} onChange={e => setRules(rs => rs.map(x => x.n === r.n ? { ...x, key_points: e.target.value } : x))} placeholder="La barrera debe estar a 9,15 m&#10;El portero tiene 6 segundos..." />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-orange btn-sm" onClick={() => saveRule(r.n, { video_url: r.video_url, description: r.description, key_points: r.key_points })}><i className="ti ti-check" /> Guardar</button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditN(null)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
