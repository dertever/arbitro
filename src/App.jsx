import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Tests from './pages/Tests'
import Situaciones from './pages/Situaciones'
import Temario from './pages/Temario'
import Insignias from './pages/Insignias'
import { Ranking, Misiones } from './pages/RankingMisiones'
import Admin from './pages/Admin'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (profile?.status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 40, maxWidth: 400, textAlign: 'center' }}>
          <i className="ti ti-clock" style={{ fontSize: 48, color: 'var(--orange)', display: 'block', marginBottom: 16 }} />
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, marginBottom: 8, color: 'var(--navy)' }}>Cuenta pendiente</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
            Tu solicitud está siendo revisada por un administrador. Recibirás un email cuando esté activada.
          </p>
          <button
            className="btn btn-outline"
            onClick={() => supabase.auth.signOut().then(() => { window.location.href = '/login' })}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  if (profile?.status === 'blocked') return <Navigate to="/login" replace />
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/" replace />

  return children
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="tests" element={<Tests />} />
            <Route path="situaciones" element={<Situaciones />} />
            <Route path="situaciones/:id" element={<Situaciones />} />
            <Route path="temario" element={<Temario />} />
            <Route path="insignias" element={<Insignias />} />
            <Route path="misiones" element={<Misiones />} />
            <Route path="ranking" element={<Ranking />} />
            <Route
              path="admin/*"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
