'use client';

import { useEffect, useState } from 'react';
import { marketById } from '@/lib/oficina/types';
import type { Brand } from '@/lib/oficina/types';
import { Card, Spinner, cx } from './ui';

export interface AgentState {
  status: 'waiting' | 'searching' | 'done' | 'error';
  message?: string;
  lastQuery?: string;
  sources: number;
  brands: number;
}

export interface FeedItem {
  id: number;
  market: string;
  kind: 'query' | 'source' | 'info';
  text: string;
}

export default function SearchRoom({
  markets,
  agents,
  feed,
  brands,
  startedAt,
  onCancel,
  demo,
}: {
  markets: string[];
  agents: Record<string, AgentState>;
  feed: FeedItem[];
  brands: Brand[];
  startedAt: number;
  onCancel: () => void;
  demo?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const secs = Math.max(0, Math.floor((now - startedAt) / 1000));
  const finished = markets.filter((m) => agents[m]?.status === 'done' || agents[m]?.status === 'error').length;
  const pct = markets.length ? Math.round((finished / markets.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Los agentes están trabajando</h1>
          <p className="mt-1 text-sm text-slate-400">
            {demo ? 'Simulación con datos de ejemplo. ' : ''}
            {finished}/{markets.length} mercados listos · {brands.length} marcas encontradas · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-rose-400/50 hover:text-rose-300">
          Cancelar
        </button>
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {markets.map((id) => {
              const m = marketById(id);
              const a = agents[id] ?? { status: 'waiting', sources: 0, brands: 0 };
              return (
                <Card key={id} className={cx('p-4 transition-colors', a.status === 'searching' && 'border-emerald-400/30')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl" aria-hidden>{m?.flag}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">Agente {m?.label}</p>
                        <p className="text-xs text-slate-500">
                          {a.status === 'waiting' && 'Esperando turno'}
                          {a.status === 'searching' && 'Buscando…'}
                          {a.status === 'done' && `Listo · ${a.brands} marcas`}
                          {a.status === 'error' && 'Falló'}
                        </p>
                      </div>
                    </div>
                    {a.status === 'searching' && <Spinner />}
                    {a.status === 'done' && <span className="text-emerald-400" aria-hidden>✓</span>}
                    {a.status === 'error' && <span className="text-rose-400" aria-hidden>!</span>}
                  </div>
                  <p className="mt-3 min-h-[2.5rem] text-xs leading-relaxed text-slate-400">
                    {a.status === 'error' ? a.message : a.lastQuery ? `🔍 ${a.lastQuery}` : '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{a.sources} fuentes leídas</p>
                </Card>
              );
            })}
          </div>

          {brands.length > 0 && (
            <Card className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Encontradas hasta ahora</p>
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <span key={b.id} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm text-slate-200">
                    {b.markets.map((mk) => marketById(mk)?.flag).join('')} {b.name}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card className="h-fit p-4 lg:sticky lg:top-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actividad en vivo</p>
          <ul className="max-h-[480px] space-y-2 overflow-y-auto pr-1 text-xs" aria-live="polite">
            {feed.length === 0 && <li className="text-slate-600">Iniciando agentes…</li>}
            {feed.map((f) => (
              <li key={f.id} className="flex gap-2 text-slate-400">
                <span aria-hidden>{marketById(f.market)?.flag}</span>
                <span className="min-w-0 break-words">
                  {f.kind === 'query' ? '🔍 ' : f.kind === 'source' ? '📄 ' : ''}
                  {f.text}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
