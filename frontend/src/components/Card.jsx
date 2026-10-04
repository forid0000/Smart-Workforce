export default function Card({ title, value, icon, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    blue: 'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    purple: 'bg-purple-50 text-purple-700',
    slate: 'bg-slate-50 text-slate-700',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-start justify-between">
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-800">{value}</div>
      </div>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  );
}