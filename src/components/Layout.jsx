import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/',            icon: 'ti-layout-dashboard', label: 'Dashboard',    group: 'Principal' },
  { to: '/tests',       icon: 'ti-clipboard-check',  label: 'Tests',        group: 'Principal' },
  { to: '/situaciones', icon: 'ti-video',             label: 'Situaciones',  group: 'Principal' },
  { to: '/temario',     icon: 'ti-book',              label: 'Temario',      group: 'Principal' },
  { to: '/insignias',   icon: 'ti-medal',             label: 'Insignias',    group: 'Progreso' },
  { to: '/misiones',    icon: 'ti-target',            label: 'Misiones',     group: 'Progreso' },
  { to: '/ranking',     icon: 'ti-trophy',            label: 'Ranking',      group: 'Progreso' },
]

const adminItems = [
  { to: '/admin',             icon: 'ti-layout-dashboard', label: 'Resumen' },
  { to: '/admin/usuarios',    icon: 'ti-users',             label: 'Usuarios' },
  { to: '/admin/preguntas',   icon: 'ti-database',          label: 'Preguntas' },
  { to: '/admin/examenes',    icon: 'ti-file-certificate',  label: 'Exámenes' },
  { to: '/admin/situaciones', icon: 'ti-video',             label: 'Situaciones' },
  { to: '/admin/simulacros',  icon: 'ti-player-play',       label: 'Simulacros' },
  { to: '/admin/temario',     icon: 'ti-book',              label: 'Temario' },
]

const groups = ['Principal', 'Progreso']

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const initials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '??'

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand" style={{ textDecoration: 'none' }}>
          <div className="brand-mark">CV</div>
          <div className="brand-name">
            ArbitroCV
            <span>Comité Árbitros FFCV</span>
          </div>
        </NavLink>

        <nav className="topnav-wrap">
          <NavLink to="/"            className={({ isActive }) => `tn${isActive ? ' on' : ''}`}><i className="ti ti-layout-dashboard" /> Inicio</NavLink>
          <NavLink to="/tests"       className={({ isActive }) => `tn${isActive ? ' on' : ''}`}><i className="ti ti-clipboard-check" /> Tests</NavLink>
          <NavLink to="/situaciones" className={({ isActive }) => `tn${isActive ? ' on' : ''}`}><i className="ti ti-video" /> Situaciones</NavLink>
          <NavLink to="/insignias"   className={({ isActive }) => `tn${isActive ? ' on' : ''}`}><i className="ti ti-medal" /> Insignias</NavLink>
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `tn${isActive ? ' on' : ''}`}><i className="ti ti-settings" /> Admin</NavLink>
          )}
        </nav>

        <button className="user-chip" onClick={handleSignOut} title="Cerrar sesión">
          <div className="user-av">{initials}</div>
          <span>{profile?.full_name?.split(' ')[0] ?? 'Usuario'}</span>
        </button>
      </header>

      <div className="body">
        <aside className="sidebar">
          {groups.map(group => (
            <div key={group}>
              <span className="sg">{group}</span>
              {navItems.filter(i => i.group === group).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `si${isActive ? ' on' : ''}`}
                >
                  <i className={`ti ${item.icon}`} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}

          {profile?.role === 'admin' && (
            <div>
              <span className="sg" style={{ marginTop: 8 }}>Admin</span>
              {adminItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) => `si${isActive ? ' on' : ''}`}
                >
                  <i className={`ti ${item.icon}`} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
