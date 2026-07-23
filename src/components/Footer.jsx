export function Footer() {
  return (
    <footer className="mx-auto mb-8 grid w-[min(1200px,calc(100%-32px))] gap-4 rounded-xl border border-white/10 bg-white/[.04] p-6 text-sm text-slate-400 md:grid-cols-3">
      <strong className="text-white">TunaTuna</strong>
      <span>Smart Service Hiring Platform</span>
      <span>Built for localhost with React, Express, Laravel, MySQL, Leaflet, and Chart.js.</span>
    </footer>
  );
}
