import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI, projectsAPI, skillsAPI } from '../services/api.js';
import Badge from '../components/Badge.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';

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

const emptyForm = {
  title: '',
  description: '',
  projectId: '',
  priority: 'MEDIUM',
  estimatedHours: 4,
  deadline: '',
  status: 'PENDING',
  skillIds: [],
  autoAssign: true,
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [autoAssignResult, setAutoAssignResult] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [t, p, s] = await Promise.all([
        tasksAPI.list(),
        projectsAPI.list(),
        skillsAPI.list(),
      ]);
      setTasks(t.data);
      setProjects(p.data);
      setSkills(s.data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); }, []);

  function updateForm(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }
  function toggleSkill(id) {
    setForm((p) => ({
      ...p,
      skillIds: p.skillIds.includes(id)
        ? p.skillIds.filter((x) => x !== id)
        : [...p.skillIds, id],
    }));
  }

  async function onCreate(e) {
    e.preventDefault();
    setSubmitError('');
    setAutoAssignResult(null);
    setSubmitting(true);
    try {
      const res = await tasksAPI.create({
        ...form,
        estimatedHours: Number(form.estimatedHours),
        projectId: Number(form.projectId),
      });
      if (res.data.autoAssigned) {
        setAutoAssignResult(res.data.autoAssigned);
      }
      setForm(emptyForm);
      await loadAll();
      // Keep modal open briefly to show result, then close
      setTimeout(() => setOpenCreate(false), 2500);
    } catch (e2) {
      setSubmitError(e2?.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  async function onUpdate(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await tasksAPI.update(editing.id, {
        title: editing.title,
        description: editing.description,
        projectId: Number(editing.projectId),
        priority: editing.priority,
        estimatedHours: Number(editing.estimatedHours),
        deadline: new Date(editing.deadline).toISOString(),
        status: editing.status,
        skillIds: editing.skillIds,
      });
      setEditing(null);
      await loadAll();
    } catch (e2) {
      setSubmitError(e2?.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!deleting) return;
    try {
      await tasksAPI.delete(deleting.id);
      setDeleting(null);
      await loadAll();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
          <p className="text-sm text-slate-500">{tasks.length} tasks</p>
        </div>
        <button
          onClick={() => { setOpenCreate(true); setAutoAssignResult(null); setSubmitError(''); setForm(emptyForm); }}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + Create Task
        </button>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <EmptyState title="No tasks yet" />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Task</th>
                <th className="text-left px-4 py-3">Project</th>
                <th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">Hours</th>
                <th className="text-left px-4 py-3">Deadline</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Assigned To</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{t.title}</td>
                  <td className="px-4 py-3 text-slate-600">{t.project?.name}</td>
                  <td className="px-4 py-3"><Badge color={priorityColor[t.priority]}>{t.priority}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.estimatedHours}h
                    {t.loggedHours > 0 && <div className="text-xs text-slate-500">{t.loggedHours}h logged</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fmt(t.deadline)}</td>
                  <td className="px-4 py-3"><Badge color={statusColor[t.status]}>{t.status}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.assignments?.length ? (
                      <span>{t.assignments[0].employeeName}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/task-assignment/${t.id}`}
                        className="px-2 py-1 rounded text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100">
                        {t.assignments?.length ? 'Reassign' : 'Assign'}
                      </Link>
                      <button onClick={() => {
                        setEditing({
                          ...t,
                          projectId: t.project?.id,
                          skillIds: t.requiredSkills.map((s) => s.id),
                          deadline: t.deadline ? new Date(t.deadline).toISOString().slice(0, 10) : '',
                        });
                      }}
                        className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">
                        Edit
                      </button>
                      <button onClick={() => setDeleting(t)}
                        className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create Task">
        <form onSubmit={onCreate} className="space-y-3">
          <ErrorBanner message={submitError} />
          {autoAssignResult && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm">
              <div className="font-semibold">✅ Auto-assigned to {autoAssignResult.employeeName}</div>
              <div className="text-xs mt-1">Score: {autoAssignResult.finalScore} · {autoAssignResult.recommendation}</div>
              <div className="text-xs mt-1">
                Skill {autoAssignResult.breakdown.skillMatch}% · Workload {autoAssignResult.breakdown.workload}% ·
                Avail {autoAssignResult.breakdown.availability}% · Deadline {autoAssignResult.breakdown.deadlineFit}%
              </div>
            </div>
          )}
          <div>
            <label className="text-sm text-slate-600">Title</label>
            <input required value={form.title} onChange={(e) => updateForm('title', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Description</label>
            <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Project</label>
              <select required value={form.projectId} onChange={(e) => updateForm('projectId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="">Select…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600">Priority</label>
              <select value={form.priority} onChange={(e) => updateForm('priority', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600">Estimated Hours</label>
              <input required type="number" min={1} value={form.estimatedHours}
                onChange={(e) => updateForm('estimatedHours', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Deadline</label>
              <input required type="date" value={form.deadline}
                onChange={(e) => updateForm('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">Required Skills</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {skills.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleSkill(s.id)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    form.skillIds.includes(s.id)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.autoAssign} onChange={(e) => updateForm('autoAssign', e.target.checked)} />
            <span>🤖 Auto-assign best employee using skill + workload + availability + deadline</span>
          </label>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setOpenCreate(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
              {submitting ? 'Saving…' : form.autoAssign ? 'Create & Auto-Assign' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit Task #${editing?.id}`}>
        {editing && (
          <form onSubmit={onUpdate} className="space-y-3">
            <ErrorBanner message={submitError} />
            <div>
              <label className="text-sm text-slate-600">Title</label>
              <input required value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Description</label>
              <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">Project</label>
                <select required value={editing.projectId} onChange={(e) => setEditing({ ...editing, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Priority</label>
                <select value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Estimated Hours</label>
                <input required type="number" min={1} value={editing.estimatedHours}
                  onChange={(e) => setEditing({ ...editing, estimatedHours: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm text-slate-600">Deadline</label>
                <input required type="date" value={editing.deadline}
                  onChange={(e) => setEditing({ ...editing, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-slate-600">Status</label>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  <option>PENDING</option><option>ASSIGNED</option><option>IN_PROGRESS</option>
                  <option>REVIEW</option><option>COMPLETED</option><option>OVERDUE</option><option>CANCELLED</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-600">Required Skills</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {skills.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setEditing({
                      ...editing,
                      skillIds: editing.skillIds.includes(s.id)
                        ? editing.skillIds.filter((x) => x !== s.id)
                        : [...editing.skillIds, s.id],
                    })}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      editing.skillIds.includes(s.id)
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={() => setEditing(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={submitting}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete task?">
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <b>{deleting?.title}</b>? This also removes
          all assignments and work logs.
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={() => setDeleting(null)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
          <button onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}