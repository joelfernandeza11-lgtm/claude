export function AtlasMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Atlas" className="shrink-0">
      <defs>
        <linearGradient id="atlas-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#6d5bd0" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#atlas-g)" />
      <g fill="none" stroke="#0A0F1E" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="24" cy="24" r="11" />
        <ellipse cx="24" cy="24" rx="5" ry="11" />
        <path d="M13 24h22M15 18h18M15 30h18" strokeWidth="1.6" />
      </g>
      <circle cx="36.5" cy="11.5" r="3.2" fill="#0A0F1E" />
      <circle cx="36.5" cy="11.5" r="1.4" fill="#fde68a" />
    </svg>
  );
}

export function AtlasWordmark({ size = 36 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <AtlasMark size={size} />
      <span className="leading-tight">
        <span className="block text-base font-bold tracking-[0.18em] text-white">ATLAS</span>
        <span className="block text-[11px] text-slate-400">Oficina de inteligencia de producto</span>
      </span>
    </span>
  );
}
