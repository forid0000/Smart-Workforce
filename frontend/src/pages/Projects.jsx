import { useEffect, useState } from 'react';
import { projectsAPI } from '../services/api.js';
import Badge from '../components/Badge.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';

const statusColor = {
  PLANNING: 'slate',
  ACTIVE: 'green',
  ON_HOLD: 'yellow',
  COMPLETED: 'indigo',
  CANCELLED: 'red',
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'PLANNING' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await projectsAPI.list();
      setProjects(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function onCreate(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await projectsAPI.create(form);
      setForm({ name: '', description: '', status: 'PLANNING' });
      setOpen(false);
      await load();
    } catch (e2) {
      setSubmitError(e2?.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-sm text-slate-500">{projects.length} projects</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + New Project
        </button>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <Spinner />
      ) : projects.length === 0 ? (
        <EmptyState title="No projects yet" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500">Project #{p.id}</div>
                  <div className="text-lg font-semibold text-slate-800">{p.name}</div>
                  <p className="text-sm text-slate-600 mt-1">{p.description}</p>
                </div>
                <Badge color={statusColor[p.status] || 'slate'}>{p.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>📌 {p._count?.tasks ?? 0} tasks</span>
                <span>Created: {new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create Project">
        <form onSubmit={onCreate} className="space-y-3">
          <ErrorBanner message={submitError} />
          <div>
            <label className="text-sm text-slate-600">Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} />
          </div>
          <div>
            <label className="text-sm text-slate-600">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              <option>PLANNING</option>
              <option>ACTIVE</option>
              <option>ON_HOLD</option>
              <option>COMPLETED</option>
              <option>CANCELLED</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}