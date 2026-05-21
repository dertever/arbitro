import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const err = await signIn(email, password)
    if (err) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

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
          Iniciar sesión
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
          Accede a tu plataforma de formación
        </p>

        {error && <div className="auth-error"><i className="ti ti-alert-circle" /> {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-orange"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <><i className="ti ti-loader-2" /> Entrando...</> : 'Entrar'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 20, textAlign: 'center' }}>
          ¿Aún no tienes cuenta?{' '}
          <Link to="/register" style={{ color: 'var(--orange)', fontWeight: 600 }}>
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
