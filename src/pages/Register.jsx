import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const { signUp } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', password2: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.password2) return setError('Las contraseñas no coinciden.')
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    setLoading(true)
    setError('')
    const err = await signUp(form.email, form.password, form.fullName)
    if (err) { setError(err.message); setLoading(false) }
    else setDone(true)
  }

  if (done) return (
    <div className="auth-page">
      <div className="auth-box" style={{ textAlign: 'center' }}>
        <i className="ti ti-circle-check" style={{ fontSize: 48, color: 'var(--ok)', marginBottom: 16, display: 'block' }} />
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, marginBottom: 8, color: 'var(--navy)' }}>
          Solicitud enviada
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
          Un administrador revisará tu solicitud y activará tu cuenta. Recibirás un email cuando esté lista.
        </p>
        <Link to="/login" className="btn btn-navy" style={{ display: 'inline-flex' }}>
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="brand-mark">CV</div>
          <div className="brand-name" style={{ color: 'var(--navy)' }}>
            ArbitroCV
            <span style={{ color: 'var(--muted)' }}>Comité Árbitros FFCV</span>
          </div>
        </div>

        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, marginBottom: 6, color: 'var(--navy)' }}>
          Crear cuenta
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
          Tu cuenta será revisada por un administrador antes de activarse.
        </p>

        {error && <div className="auth-error"><i className="ti ti-alert-circle" /> {error}</div>}

        <form onSubmit={handleSubmit}>
          {[
            { key: 'fullName',  label: 'Nombre completo', type: 'text',     placeholder: 'Carlos Martínez' },
            { key: 'email',     label: 'Email',            type: 'email',    placeholder: 'tu@email.com' },
            { key: 'password',  label: 'Contraseña',       type: 'password', placeholder: '••••••••' },
            { key: 'password2', label: 'Repetir contraseña', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div className="form-group" key={f.key}>
              <label className="form-label">{f.label}</label>
              <input
                className="form-input"
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                required
              />
            </div>
          ))}
          <button
            type="submit"
            className="btn btn-orange"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Solicitar acceso'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 20, textAlign: 'center' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--orange)', fontWeight: 600 }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
