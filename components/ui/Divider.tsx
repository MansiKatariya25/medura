export default function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-xs text-white/45">{label}</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

