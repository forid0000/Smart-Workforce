import { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api.js';
import Card from '../components/Card.jsx';
import WorkloadBar from '../components/WorkloadBar.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await dashboardAPI.get();
        setData(res.data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Live data from PostgreSQL via Prisma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="Total Employees" value={data.totalEmployees} icon="👥" color="brand" />
        <Card title="Active Tasks" value={data.activeTasks} icon="📌" color="blue" />
        <Card title="Completed Tasks" value={data.completedTasks} icon="✅" color="green" />
        <Card title="Overdue Tasks" value={data.overdueTasks} icon="⚠️" color="red" />
        <Card title="Average Workload" value={`${data.averageWorkloadPercent}%`} icon="📊" color="yellow" />
        <Card title="Overloaded Employees" value={data.overloadedEmployees} icon="🔥" color="red" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Employee Workload</h2>
          <span className="text-sm text-slate-500">{data.employeeWorkload.length} employees</span>
        </div>
        <div className="space-y-4">
          {data.employeeWorkload.map((w) => (
            <WorkloadBar
              key={w.employeeId}
              percent={w.workloadPercent}
              label={`${w.name} (${w.assignedHours}h / ${w.capacity}h)`}
              sublabel={`${w.workloadPercent}% – ${w.workloadLevel}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}