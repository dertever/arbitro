import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { REGLAS } from '../lib/data'

const TIMER_SECS = 600

export default function Tests() {
  const { profile } = useAuth()
  const toast = useToast()
  const [view, setView] = useState('selector') // selector | active | result
  const [questions, setQuestions] = useState([])
  const [selectedRule, setSelectedRule] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timer, setTimer] = useState(TIMER_SECS)
  const [progress, setProgress] = useState([])
  const timerRef = useRef(null)

  const ft = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  async function startTest(ruleNum) {
    const query = supabase.from('questions').select('*')
    if (ruleNum !== 'all') query.eq('rule_number', ruleNum)
    const { data, error } = await query.order('random()').limit(10)
    if (error || !data?.length) return toast('No hay preguntas para esta regla aún.', 'error')
    setQuestions(data.sort(() => Math.random() - 0.5))
    setSelectedRule(ruleNum)
    setCurrentQ(0)
    setAnswers({})
    setTimer(TIMER_SECS)
    setView('active')
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); finishTest(); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function selectAnswer(idx) {
    setAnswers(a => ({ ...a, [currentQ]: idx }))
  }

  async function finishTest() {
    clearInterval(timerRef.current)
    const correct = questions.filter((q, i) => answers[i] === q.correct_option).length
    const pct = Math.round((correct / questions.length) * 100)
    const xpEarned = correct * 20
    setView('result')

    if (!profile) return
    await supabase.from('test_results').insert({
      user_id: profile.id,
      rule_number: selectedRule === 'all' ? null : selectedRule,
      score: correct,
      total: questions.length,
      xp_earned: xpEarned,
    })
    await supabase.from('profiles').update({ xp: (profile.xp ?? 0) + xpEarned }).eq('id', profile.id)

    if (pct === 100) toast('¡Perfecto! Has desbloqueado la insignia "Examen perfecto"', 'success')
    else toast(`Test completado: ${pct}% · +${xpEarned} XP`, 'success')
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const q = questions[currentQ]
  const correct = questions.filter((q, i) => answers[i] === q.correct_option).length

  if (view === 'selector') return (
    <>
      <div className="ph"><h2>Tests por regla</h2><p>Elige una regla o lanza un test aleatorio con preguntas de todas las reglas.</p></div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button className="btn btn-orange" onClick={() => startTest('all')}><i className="ti ti-bolt" /> Test aleatorio completo</button>
        <button className="btn btn-outline" onClick={() => startTest('all')}><i className="ti ti-clock" /> Simulacro cronometrado</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        {REGLAS.map(r => (
          <RuleCard key={r.n} rule={r} onClick={() => startTest(r.n)} />
        ))}
      </div>
    </>
  )

  if (view === 'result') {
    const pct = Math.round((correct / questions.length) * 100)
    return (
      <>
        <div className="ph"><h2>Resultado</h2></div>
        <div className="card" style={{ textAlign: 'center', padding: '36px 32px' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--light)', marginBottom: 8 }}>Resultado del test</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 72, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{correct} de {questions.length} respuestas correctas</div>
          <div style={{ display: 'inline-block', background: 'var(--orange)', color: 'white', fontWeight: 700, fontSize: 14, padding: '8px 20px', borderRadius: 8, margin: '16px 0', fontFamily: 'DM Mono, monospace' }}>
            +{correct * 20} XP obtenidos
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
            <div className="sc"><div className="sc-label">Correctas</div><div className="sc-value" style={{ color: 'var(--ok)' }}>{correct}</div></div>
            <div className="sc"><div className="sc-label">Falladas</div><div className="sc-value" style={{ color: 'var(--err)' }}>{questions.length - correct}</div></div>
            <div className="sc"><div className="sc-label">Puntuación</div><div className="sc-value">{pct}%</div></div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-navy" onClick={() => startTest(selectedRule)}><i className="ti ti-refresh" /> Repetir</button>
            <button className="btn btn-outline" onClick={() => setView('selector')}><i className="ti ti-list" /> Elegir regla</button>
          </div>
        </div>
      </>
    )
  }

  if (!q) return <div className="spinner" />

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', background: 'var(--navy)', color: 'white', padding: '4px 10px', borderRadius: 6 }}>
            Regla {selectedRule === 'all' ? 'Mixto' : selectedRule}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{currentQ + 1} / {questions.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Mono, monospace', fontSize: 14, background: 'white', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: 8, color: timer < 60 ? 'var(--err)' : 'var(--text)' }}>
          <i className="ti ti-clock" />{ft(timer)}
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {questions.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i < currentQ ? 'var(--orange)' : i === currentQ ? 'var(--navy)' : 'var(--border)' }} />
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--light)', marginBottom: 10 }}>
          Pregunta {currentQ + 1}
        </div>
        <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.55, marginBottom: 22 }}>{q.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            const sel = answers[currentQ] === i
            return (
              <div
                key={i}
                onClick={() => selectAnswer(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  border: `1.5px solid ${sel ? 'var(--orange)' : 'var(--border)'}`,
                  borderRadius: 10, cursor: 'pointer',
                  background: sel ? 'var(--orange-soft)' : 'white',
                  fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 26, height: 26, borderRadius: 6, background: sel ? 'var(--orange)' : 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: sel ? 'white' : 'var(--muted)', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>
                  {['A', 'B', 'C', 'D'][i]}
                </div>
                {typeof opt === 'string' ? opt : opt.text}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {currentQ > 0 && <button className="btn btn-outline" onClick={() => setCurrentQ(q => q - 1)}>← Anterior</button>}
        {currentQ < questions.length - 1
          ? <button className="btn btn-navy" onClick={() => setCurrentQ(q => q + 1)}>Siguiente →</button>
          : <button className="btn btn-orange" onClick={finishTest}>Finalizar ✓</button>
        }
      </div>
    </>
  )
}

function RuleCard({ rule, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.18s' }}
      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--orange)'}
      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{rule.n}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.3 }}>{rule.name}</div>
      <div className="prog-bar" style={{ marginTop: 8 }}><div className="prog-fill" style={{ width: `${Math.floor(Math.random() * 60 + 10)}%` }} /></div>
    </div>
  )
}
