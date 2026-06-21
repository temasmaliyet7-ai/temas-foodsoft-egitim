export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-accent-dark">
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-accent/30 border-t-accent" />
      {label && <span className="font-bold">{label}</span>}
    </div>
  );
}
