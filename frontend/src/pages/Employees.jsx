import { useEffect, useState } from 'react';
import { employeesAPI, departmentsAPI, skillsAPI } from '../services/api.js';
import Badge from '../components/Badge.jsx';
import WorkloadBar from '../components/WorkloadBar.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';

const availColor = {
  AVAILABLE: 'green',
  BUSY: 'yellow',
  UNAVAILABLE: 'red',
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    position: '',
    capacity: 8,
    availability: 'AVAILABLE',
    departmentId: '',
    skillIds: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [emp, dept, skl] = await Promise.all([
        employeesAPI.list(q),
        departmentsAPI.list(),
        skillsAPI.list(),
      ]);
      setEmployees(emp.data);
      setDepartments(dept.data);
      setSkills(skl.data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

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
    setSubmitting(true);
    try {
      await employeesAPI.create({ ...form, capacity: Number(form.capacity), departmentId: Number(form.departmentId) });
      setOpenAdd(false);
      setForm({ name: '', email: '', position: '', capacity: 8, availability: 'AVAILABLE', departmentId: '', skillIds: [] });
      await loadAll();
    } catch (e2) {
      setSubmitError(e2?.response?.data?.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
          <p className="text-sm text-slate-500">{employees.length} employees in the system</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search name, position, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-72"
          />
          <button
            onClick={() => setOpenAdd(true)}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            + Add Employee
          </button>
        </div>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <Spinner label="Loading employees…" />
      ) : employees.length === 0 ? (
        <EmptyState title="No employees found" description="Try a different search or add a new employee." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Position</th>
                <th className="text-left px-4 py-3">Capacity</th>
                <th className="text-left px-4 py-3">Availability</th>
                <th className="text-left px-4 py-3">Workload</th>
                <th className="text-left px-4 py-3">Skills</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-500">#{e.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{e.name}</td>
                  <td className="px-4 py-3 text-slate-600">{e.department?.name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{e.position}</td>
                  <td className="px-4 py-3 text-slate-600">{e.capacity}h/day</td>
                  <td className="px-4 py-3">
                    <Badge color={availColor[e.availability] || 'slate'}>{e.availability}</Badge>
                  </td>
                  <td className="px-4 py-3 w-48">
                    <WorkloadBar percent={e.workloadPercent} sublabel={`${e.workloadPercent}% – ${e.workloadLevel}`} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {e.skills.slice(0, 3).map((s) => (
                        <Badge key={s.id} color="indigo">{s.name}</Badge>
                      ))}
                      {e.skills.length > 3 && (
                        <Badge color="slate">+{e.skills.length - 3}</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add Employee">
        <form onSubmit={onCreate} className="space-y-3">
          <ErrorBanner message={submitError} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Name</label>
              <input required value={form.name} onChange={(e) => updateForm('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Email</label>
              <input required type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Position</label>
              <input required value={form.position} onChange={(e) => updateForm('position', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Capacity (h/day)</label>
              <input required type="number" min={1} max={24} value={form.capacity}
                onChange={(e) => updateForm('capacity', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Department</label>
              <select required value={form.departmentId} onChange={(e) => updateForm('departmentId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="">Select…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600">Availability</label>
              <select value={form.availability} onChange={(e) => updateForm('availability', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">Skills</label>
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
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setOpenAdd(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
              {submitting ? 'Saving…' : 'Save Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}