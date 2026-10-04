import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tasksAPI } from '../services/api.js';
import Badge from '../components/Badge.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

const recColor = {
  'HIGHLY RECOMMENDED': 'green',
  'RECOMMENDED': 'blue',
  'POSSIBLE': 'yellow',
  'NOT RECOMMENDED': 'red',
};

export default function TaskAssignment() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [selectedId, setSelectedId] = useState(taskId || '');
  const [taskDetail, setTaskDetail] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState('');
  const [assignError, setAssignError] = useState('');
  const [success, setSuccess] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await tasksAPI.list();
        setTasks(res.data);
        if (taskId) {
          setSelectedId(taskId);
        } else if (res.data.length > 0) {
          setSelectedId(res.data[0].id);
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    })();
  }, [taskId]);

  async function loadTaskAndRecs(id) {
    setError('');
    setAssignError('');
    setSuccess('');
    setRecommendations(null);
    setTaskDetail(null);
    if (!id) return;
    try {
      const [detail, recs] = await Promise.all([
        tasksAPI.get(id),
        tasksAPI.recommendations(id),
      ]);
      setTaskDetail(detail.data);
      setRecommendations(recs.data.recommendations);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load recommendations');
    }
  }

  useEffect(() => {
    if (selectedId) loadTaskAndRecs(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function onAssign(emp) {
    setAssignError('');
    setSuccess('');
    setAssigning(true);
    try {
      await tasksAPI.assign(selectedId, {
        employeeId: emp.employeeId,
        score: emp.finalScore,
      });
      setSuccess(`✅ ${emp.employeeName} was assigned. Task status updated to ASSIGNED.`);
      await loadTaskAndRecs(selectedId);
    } catch (e) {
      setAssignError(e?.response?.data?.message || 'Failed to assign task');
    } finally {
      setAssigning(false);
    }
  }

  if (loading) return <Spinner label="Loading tasks…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Task Assignment</h1>
        <p className="text-sm text-slate-500">
          Pick a task → calculate recommendations → assign the best employee.
        </p>
      </div>

      <ErrorBanner message={error} />

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <label className="text-sm text-slate-600">Task</label>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <select
            value={selectedId}
            onChange={(e) => navigate(`/task-assignment/${e.target.value}`)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white flex-1 min-w-[280px]"
          >
            <option value="">Select a task…</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.id} – {t.title}
              </option>
            ))}
          </select>
          <Link to="/tasks" className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
            Manage Tasks
          </Link>
        </div>
      </div>

      {taskDetail && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm text-slate-500">Selected Task #{taskDetail.id}</div>
              <div className="text-lg font-semibold text-slate-800">{taskDetail.title}</div>
              <p className="text-sm text-slate-600 mt-1">{taskDetail.description}</p>
              <div className="mt-3 flex items-center flex-wrap gap-2 text-sm text-slate-600">
                <span>⏱ {taskDetail.estimatedHours}h</span>
                <span>📅 Due {new Date(taskDetail.deadline).toLocaleDateString()}</span>
                <Badge color="indigo">{taskDetail.priority}</Badge>
                <Badge color="blue">{taskDetail.status}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase text-slate-500 mb-1">Required Skills</div>
            <div className="flex flex-wrap gap-1">
              {taskDetail.requiredSkills.length === 0 && (
                <span className="text-sm text-slate-400">No skills specified</span>
              )}
              {taskDetail.requiredSkills.map((s) => (
                <Badge key={s.id} color="indigo">{s.name}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {assignError && <ErrorBanner message={assignError} />}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recommended Employees</h2>
          <div className="text-xs text-slate-500">
            Score = Skill (40%) · Workload (25%) · Availability (20%) · Deadline (15%)
          </div>
        </div>

        {!selectedId ? (
          <EmptyState title="Select a task to see recommendations" />
        ) : !recommendations ? (
          <Spinner label="Calculating recommendations…" />
        ) : recommendations.length === 0 ? (
          <EmptyState title="No employees available" />
        ) : (
          <div className="space-y-3">
            {recommendations.map((r, idx) => (
              <div key={r.employeeId} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-xs text-slate-500">Rank #{idx + 1}</div>
                    <div className="text-lg font-semibold text-slate-800">{r.employeeName}</div>
                    <div className="text-sm text-slate-600">
                      {r.position} • {r.department} • {r.availability}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Current workload: {r.currentWorkloadPercent}% ({r.assignedHours}h / {r.capacity}h)
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge color={recColor[r.recommendation]}>{r.recommendation}</Badge>
                    <div className="text-3xl font-bold text-brand-700">{r.finalScore}</div>
                    <div className="text-xs text-slate-500">Final Score</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <Score label="Skill Match" value={r.skillMatch} />
                  <Score label="Workload" value={r.workload} />
                  <Score label="Availability" value={r.availabilityScore} />
                  <Score label="Deadline Fit" value={r.deadlineFit} />
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => onAssign(r)}
                    disabled={assigning}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
                  >
                    {assigning ? 'Assigning…' : `Assign ${r.employeeName}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Score({ label, value }) {
  let color = 'bg-red-500';
  if (value >= 80) color = 'bg-green-500';
  else if (value >= 60) color = 'bg-blue-500';
  else if (value >= 40) color = 'bg-yellow-500';
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-1.5 ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
        </div>
        <div className="text-sm font-semibold text-slate-700 w-12 text-right">{value}%</div>
      </div>
    </div>
  );
}