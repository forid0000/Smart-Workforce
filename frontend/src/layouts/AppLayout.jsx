import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/employees', label: 'Employees', icon: '👥' },
  { to: '/skills', label: 'Skills', icon: '🎯' },
  { to: '/projects', label: 'Projects', icon: '📁' },
  { to: '/tasks', label: 'Tasks', icon: '📝' },
  { to: '/task-assignment', label: 'Task Assignment', icon: '🚀' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center font-bold">
              SW
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Smart Workforce</div>
              <div className="text-xs text-slate-500">Task Allocation</div>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="px-3 py-2 text-xs text-slate-500">
            Logged in as
            <div className="text-sm font-semibold text-slate-700 truncate">
              {user?.email || 'admin@smartworkforce.com'}
            </div>
            <div className="mt-0.5 inline-block px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs">
              {user?.role || 'ADMIN'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="text-sm text-slate-500">
            Smart Workforce &amp; Task Allocation System
          </div>
          <div className="text-sm text-slate-500">CP-1 Demo Build</div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}