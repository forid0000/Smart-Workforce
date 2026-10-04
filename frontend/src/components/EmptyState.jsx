export default function EmptyState({ title = 'No data', description }) {
  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center">
      <div className="text-3xl mb-2">📭</div>
      <div className="font-medium text-slate-700">{title}</div>
      {description && <div className="text-sm text-slate-500 mt-1">{description}</div>}
    </div>
  );
}