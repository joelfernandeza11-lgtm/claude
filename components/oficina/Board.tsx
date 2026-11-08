'use client';

import { Brief, Decision, DiscoverResult, STAGES } from '@/lib/oficina/types';
import { Card, cx } from './ui';

export default function Board({
  brief,
  decisions,
  disc,
  stageIdx,
  working,
}: {
  brief: Brief;
  decisions: Decision[];
  disc?: DiscoverResult;
  stageIdx: number;
  working?: boolean;
}) {
  const board = disc?.board ?? {};
  const readiness = disc?.readiness ?? 0;
  const facts: [string, string | undefined][] = [
    ['Formato', board.format],
    ['Público', board.audience],
    ['Ángulo', board.angle],
    ['Precio / oferta', board.price],
  ];
  return (
    <Card className="space-y-5 p-4 lg:sticky lg:top-4">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Camino al producto</p>
        <p className="mb-3 text-sm text-slate-300">
          <span className="text-slate-500">Partimos de:</span> {brief.pain}
        </p>
        <ol className="space-y-0">
          {STAGES.map((s, i) => {
            const done = i < decisions.length;
            const current = i === stageIdx;
            const d = decisions[i];
            return (
              <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0">
                {i < STAGES.length - 1 && <span className={cx('absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-px', done ? 'bg-emerald-400/50' : 'bg-white/10')} aria-hidden />}
                <span
                  className={cx(
                    'z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs',
                    done ? 'border-emerald-400 bg-emerald-400 text-slate-900' : current ? 'border-emerald-400 text-emerald-300' : 'border-white/20 text-slate-500',
                    current && working && 'animate-pulse',
                  )}
                >
                  {done ? '✓' : i + 1}
                </span>
                <div className="min-w-0">
                  <p className={cx('text-sm font-medium', done || current ? 'text-white' : 'text-slate-500')}>{s.label}</p>
                  {d ? <p className="text-xs leading-snug text-emerald-200/90">{d.answer}</p> : <p className="text-xs text-slate-600">{s.blurb}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {facts.some(([, v]) => v) && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Lo que sabemos hasta ahora</p>
          <dl className="space-y-2 text-sm">
            {facts.map(([k, v]) => v && (
              <div key={k}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="text-slate-200">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Listo para un test real</p>
          <span className="text-sm font-semibold text-white">{readiness}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={readiness} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-400 transition-all duration-700" style={{ width: `${readiness}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">Estimación de Atlas según la solidez de la evidencia.</p>
      </div>
    </Card>
  );
}
