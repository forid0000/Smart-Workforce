import { useEffect, useState } from 'react';
import { skillsAPI } from '../services/api.js';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await skillsAPI.list();
      setSkills(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load skills');
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
      await skillsAPI.create({ name });
      setName('');
      setOpen(false);
      await load();
    } catch (e2) {
      setSubmitError(e2?.response?.data?.message || 'Failed to create skill');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Skills</h1>
          <p className="text-sm text-slate-500">{skills.length} skills available</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + Add Skill
        </button>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <Spinner />
      ) : skills.length === 0 ? (
        <EmptyState title="No skills" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">Skill ID #{s.id}</div>
                  <div className="text-lg font-semibold text-slate-800">{s.name}</div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 grid place-items-center text-xl">
                  🎯
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-600 flex items-center gap-4">
                <span>👥 <b>{s.employeeCount}</b> employees</span>
                <span>📌 <b>{s.taskCount}</b> tasks</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Skill">
        <form onSubmit={onCreate} className="space-y-3">
          <ErrorBanner message={submitError} />
          <div>
            <label className="text-sm text-slate-600">Skill name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
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