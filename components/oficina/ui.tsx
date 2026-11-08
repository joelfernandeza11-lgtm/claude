'use client';

import type { ReactNode } from 'react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-white/10 bg-white/[0.03]', className)}>{children}</div>;
}

export function Pill({
  active,
  onClick,
  children,
  disabled,
  title,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cx(
        'rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        active
          ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-200'
          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cx(
            'rounded-lg px-3 py-1.5 text-sm transition-colors',
            value === o.id ? 'bg-emerald-400/20 text-emerald-200' : 'text-slate-400 hover:text-white',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ tone, children, title }: { tone: 'green' | 'amber' | 'slate' | 'red' | 'violet'; children: ReactNode; title?: string }) {
  const tones = {
    green: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    slate: 'border-white/10 bg-white/5 text-slate-400',
    red: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
    violet: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
  };
  return (
    <span title={title} className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}

export function ScoreRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 70 ? '#34d399' : value >= 45 ? '#fbbf24' : '#94a3b8';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Puntaje ${value} de 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

export function Assistant({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-violet-400/20 bg-violet-400/[0.06] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-400/20 text-lg" aria-hidden>
        🧭
      </div>
      <div className="min-w-0 text-sm leading-relaxed text-slate-300">
        {title && <p className="mb-1 font-semibold text-violet-200">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Cargando"
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-200">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export const inputCls =
  'w-full rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20';
