export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-subtle">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand-600" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}
