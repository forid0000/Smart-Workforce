import { useEffect, useState } from 'react';
import { meAPI, workLogAPI } from '../services/api.js';
import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';
import WorkloadBar from '../components/WorkloadBar.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';

const statusColor = {
  PENDING: 'slate',
  ASSIGNED: 'blue',
  IN_PROGRESS: 'indigo',
  REVIEW: 'yellow',
  COMPLETED: 'green',
  OVERDUE: 'red',
  CANCELLED: 'red',
};

const priorityColor = {
  LOW: 'slate',
  MEDIUM: 'blue',
  HIGH: 'yellow',
  URGENT: 'red',
};

function fmt(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString();
}

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openLog, setOpenLog] = useState(null); // task object
  const [openLogsView, setOpenLogsView] = useState(null); // task object

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await meAPI.dashboard();
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function changeStatus(taskId, status) {
    try {
      await workLogAPI.create(taskId, { actualHours: 0, note: `Status changed to ${status}`, newStatus: status });
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to update status');
    }
  }

  if (loading) return <Spinner label="Loading your dashboard…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!data) return null;

  const { employee, stats, tasks } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome, <b>{employee.name}</b> · {employee.position} · {employee.department?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Tasks" value={stats.totalTasks} icon="📌" color="brand" />
        <Card title="Active" value={stats.activeTasks} icon="⚡" color="blue" />
        <Card title="Completed" value={stats.completedTasks} icon="✅" color="green" />
        <Card title="Overdue" value={stats.overdueTasks} icon="⚠️" color="red" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">My Workload</h2>
        <WorkloadBar
          percent={stats.workloadPercent}
          label={`${stats.assignedHours}h / ${employee.capacity}h daily capacity`}
          sublabel={`${stats.workloadPercent}% – ${stats.workloadLevel}`}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">My Assigned Tasks</h2>
          <span className="text-sm text-slate-500">{tasks.length} total</span>
        </div>
        {tasks.length === 0 ? (
          <EmptyState title="No tasks assigned yet" description="Your admin will assign tasks soon." />
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-slate-800">{t.title}</h3>
                      <Badge color={statusColor[t.status]}>{t.status}</Badge>
                      <Badge color={priorityColor[t.priority]}>{t.priority}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{t.description}</p>
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                      <span>📁 {t.project?.name}</span>
                      <span>⏱ {t.estimatedHours}h estimated</span>
                      <span>📅 Due {fmt(t.deadline)}</span>
                      <span>📝 {t.loggedHours}h logged</span>
                    </div>
                    {t.requiredSkills.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        {t.requiredSkills.map((s) => (
                          <Badge key={s.id} color="indigo">{s.name}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {t.status !== 'IN_PROGRESS' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                    <button onClick={() => changeStatus(t.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                      ▶ Start Work
                    </button>
                  )}
                  {t.status === 'IN_PROGRESS' && (
                    <button onClick={() => changeStatus(t.id, 'REVIEW')}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
                      📤 Submit for Review
                    </button>
                  )}
                  {t.status === 'REVIEW' && (
                    <button onClick={() => changeStatus(t.id, 'COMPLETED')}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100">
                      ✅ Mark Complete
                    </button>
                  )}
                  <button onClick={() => setOpenLog(t)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100">
                    + Log Work
                  </button>
                  <button onClick={() => setOpenLogsView(t)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">
                    View History ({t.workLogs.length})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openLog && (
        <LogWorkModal
          task={openLog}
          onClose={() => setOpenLog(null)}
          onSaved={async () => { setOpenLog(null); await load(); }}
        />
      )}

      {openLogsView && (
        <WorkLogHistoryModal
          task={openLogsView}
          onClose={() => setOpenLogsView(null)}
        />
      )}
    </div>
  );
}

function LogWorkModal({ task, onClose, onSaved }) {
  const [actualHours, setActualHours] = useState(1);
  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await workLogAPI.create(task.id, {
        actualHours: Number(actualHours),
        note: note || null,
        newStatus: newStatus || undefined,
      });
      onSaved();
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Failed to save work log');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Log work for: ${task.title}`}>
      <form onSubmit={submit} className="space-y-3">
        <ErrorBanner message={error} />
        <div>
          <label className="text-sm text-slate-600">Hours worked *</label>
          <input required type="number" step="0.5" min="0.5" value={actualHours}
            onChange={(e) => setActualHours(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Update status (optional)</label>
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="">No change</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Submit for Review</option>
            <option value="COMPLETED">Mark Complete</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={submitting}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function WorkLogHistoryModal({ task, onClose }) {
  return (
    <Modal open onClose={onClose} title={`Work history – ${task.title}`}>
      {task.workLogs.length === 0 ? (
        <EmptyState title="No work logs yet" />
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {task.workLogs.map((w) => (
            <div key={w.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{w.actualHours}h</span>
                <span className="text-slate-500 text-xs">{new Date(w.loggedAt).toLocaleString()}</span>
              </div>
              {w.note && <p className="text-sm text-slate-600 mt-1">{w.note}</p>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}