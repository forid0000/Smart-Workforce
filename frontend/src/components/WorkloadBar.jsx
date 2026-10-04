export default function WorkloadBar({ percent = 0, label, sublabel }) {
  const safe = Math.max(0, Math.min(150, percent));
  let color = 'bg-green-500';
  if (safe >= 100) color = 'bg-red-500';
  else if (safe >= 80) color = 'bg-yellow-500';
  else if (safe >= 60) color = 'bg-blue-500';
  return (
    <div>
      {(label || sublabel) && (
        <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
          <span>{label}</span>
          <span className="font-medium text-slate-700">{sublabel || `${safe}%`}</span>
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div className={`h-2.5 ${color}`} style={{ width: `${Math.min(100, safe)}%` }} />
      </div>
    </div>
  );
}