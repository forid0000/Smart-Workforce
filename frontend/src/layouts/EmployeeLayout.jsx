import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center font-bold">
            SW
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Smart Workforce</div>
            <div className="text-xs text-slate-500">Employee Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600">
            {user?.employee?.name || user?.email}
            <span className="ml-2 inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg"
          >
            🚪 Logout
          </button>
        </div>
      </header>
      <main className="p-6 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}