import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Skills from './pages/Skills.jsx';
import Projects from './pages/Projects.jsx';
import Tasks from './pages/Tasks.jsx';
import TaskAssignment from './pages/TaskAssignment.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import EmployeeLayout from './layouts/EmployeeLayout.jsx';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/' : '/me'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute role="ADMIN">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="skills" element={<Skills />} />
        <Route path="projects" element={<Projects />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="task-assignment" element={<TaskAssignment />} />
        <Route path="task-assignment/:taskId" element={<TaskAssignment />} />
      </Route>

      {/* Employee routes */}
      <Route
        path="/me"
        element={
          <ProtectedRoute role="EMPLOYEE">
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}