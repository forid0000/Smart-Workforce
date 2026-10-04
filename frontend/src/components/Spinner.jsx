export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm py-6 justify-center">
      <span className="h-4 w-4 border-2 border-slate-300 border-t-brand-600 rounded-full animate-spin" />
      <span>{label}</span>
    </div>
  );
}