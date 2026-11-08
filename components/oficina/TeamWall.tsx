'use client';

import { marketById } from '@/lib/oficina/types';
import type { AgentState, FeedItem } from '@/lib/oficina/types';
import { Card, Spinner, cx } from './ui';

const AVATARS = ['🧑‍💻', '👩‍💻', '👨‍💻', '🧑‍🔬', '👩‍🔬', '🧑‍🏫', '👨‍🔬', '👩‍🏫'];

export default function TeamWall({ markets, agents, feed }: { markets: string[]; agents: Record<string, AgentState>; feed: FeedItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-3 sm:grid-cols-2">
        {markets.map((id, i) => {
          const m = marketById(id);
          const a = agents[id] ?? { status: 'waiting', sources: 0, brands: 0 };
          return (
            <Card key={id} className={cx('p-3.5 transition-colors', a.status === 'searching' && 'border-emerald-400/30')}>
              <div className="flex items-center gap-3">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-2xl" aria-hidden>
                  {AVATARS[i % AVATARS.length]}
                  <span className="absolute -bottom-1 -right-1 text-base">{m?.flag}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">Analista {m?.label}</p>
                  <p className="text-xs text-slate-500">
                    {a.status === 'waiting' && 'Llegando a su escritorio'}
                    {a.status === 'searching' && 'Investigando…'}
                    {a.status === 'done' && `Entregó ${a.brands} marcas`}
                    {a.status === 'error' && 'Tuvo un problema'}
                  </p>
                </div>
                {a.status === 'searching' && <Spinner />}
                {a.status === 'done' && <span className="text-emerald-400" aria-hidden>✓</span>}
                {a.status === 'error' && <span className="text-rose-400" aria-hidden>!</span>}
              </div>
              <p className="mt-2.5 min-h-[2.4rem] text-xs leading-relaxed text-slate-400">
                {a.status === 'error' ? a.message : a.lastQuery ? `🔍 ${a.lastQuery}` : '—'}
              </p>
              <p className="text-xs text-slate-600">{a.sources} fuentes leídas</p>
            </Card>
          );
        })}
      </div>
      <Card className="h-fit p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actividad en vivo</p>
        <ul className="max-h-[300px] space-y-2 overflow-y-auto pr-1 text-xs" aria-live="polite">
          {feed.length === 0 && <li className="text-slate-600">Iniciando agentes…</li>}
          {[...feed].reverse().map((f) => (
            <li key={f.id} className="flex gap-2 text-slate-400">
              <span aria-hidden>{marketById(f.market)?.flag}</span>
              <span className="min-w-0 break-words">{f.kind === 'query' ? '🔍 ' : f.kind === 'source' ? '📄 ' : ''}{f.text}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
