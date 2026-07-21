export function StatCard({ icon: Icon, label, value }) {
  return (
    <article className="glass-card p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <strong className="mt-1 block text-2xl text-white">{value}</strong>
    </article>
  );
}
