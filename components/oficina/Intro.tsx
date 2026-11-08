'use client';

import { useState } from 'react';
import { Brief, COMMON_PAINS, DEPTHS, MARKETS, MARKET_PRESETS, MAX_MARKETS, Requirement, marketById } from '@/lib/oficina/types';
import type { HistoryItem } from '@/lib/oficina/client';
import { Card, Pill, Segmented, cx, inputCls } from './ui';

const REQ: { id: Requirement; label: string }[] = [
  { id: 'obligatorio', label: 'Obligatorio' },
  { id: 'preferido', label: 'Preferido' },
  { id: 'indiferente', label: 'Me da igual' },
];

export default function Intro({
  brief,
  onChange,
  onStart,
  onDemo,
  history,
  onOpenHistory,
  blocked,
}: {
  brief: Brief;
  onChange: (b: Brief) => void;
  onStart: () => void;
  onDemo: () => void;
  history: HistoryItem[];
  onOpenHistory: (h: HistoryItem) => void;
  blocked?: string;
}) {
  const [allMarkets, setAllMarkets] = useState(false);
  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => onChange({ ...brief, [k]: v });
  const toggleMarket = (id: string) =>
    set('markets', brief.markets.includes(id) ? brief.markets.filter((m) => m !== id) : [...brief.markets, id]);
  const ready = brief.pain.trim().length >= 3 && brief.markets.length > 0;
  const depth = DEPTHS.find((d) => d.id === brief.depth)!;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
      <section className="min-w-0 space-y-5">
        <div className="flex gap-3 rounded-2xl border border-violet-400/20 bg-violet-400/[0.06] p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-400/20 text-lg" aria-hidden>🧭</span>
          <div className="text-sm leading-relaxed text-slate-300">
            <p className="mb-1 font-semibold text-violet-200">Buenas, soy Atlas</p>
            Contame <b>qué dolor querés resolver</b>. Yo salgo a recorrer el mundo, te traigo lo que encuentre y, ronda a ronda, vamos descartando
            hasta llegar a <b>un producto concreto</b>, con conclusiones en cada paso. No hace falta que sepas el formato todavía: lo descubrimos juntos.
          </div>
        </div>

        <Card className="space-y-5 p-5">
          <div>
            <label htmlFor="pain" className="mb-1.5 block text-sm font-medium text-slate-200">¿Qué dolor o problema querés resolver?</label>
            <input
              id="pain"
              autoFocus
              className={cx(inputCls, 'py-3 text-base')}
              value={brief.pain}
              maxLength={300}
              onChange={(e) => set('pain', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ready && onStart()}
              placeholder="Ej: caída de pelo en hombres de 30 a 45"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {COMMON_PAINS.map((p) => (
                <Pill key={p.label} active={brief.pain === p.label} onClick={() => set('pain', p.label)} title={p.hint}>
                  {p.label}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-200">¿Dónde salimos a mirar?</p>
            <div className="flex flex-wrap items-center gap-2">
              {MARKET_PRESETS.map((p) => (
                <Pill key={p.id} onClick={() => set('markets', p.markets)} active={p.markets.length === brief.markets.length && p.markets.every((m) => brief.markets.includes(m))}>
                  {p.label}
                </Pill>
              ))}
              <button type="button" onClick={() => setAllMarkets((v) => !v)} className="text-xs text-slate-400 underline-offset-4 hover:text-white hover:underline">
                {allMarkets ? 'Ocultar' : 'Elegir uno por uno'}
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-400">{brief.markets.map((m) => `${marketById(m)?.flag} ${marketById(m)?.label}`).join(' · ')}</p>
            {allMarkets && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {MARKETS.map((m) => {
                  const on = brief.markets.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={on}
                      disabled={!on && brief.markets.length >= MAX_MARKETS}
                      onClick={() => toggleMarket(m.id)}
                      className={cx(
                        'flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                        on ? 'border-emerald-400/60 bg-emerald-400/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/25',
                      )}
                    >
                      <span className="text-lg" aria-hidden>{m.flag}</span>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <details className="group rounded-xl border border-white/10 bg-black/15 p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-300 marker:text-slate-500">Ajustes finos (opcional)</summary>
            <div className="mt-4 space-y-5">
              <div>
                <p className="mb-2 text-sm text-slate-300">Profundidad del radar</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {DEPTHS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      aria-pressed={brief.depth === d.id}
                      onClick={() => set('depth', d.id)}
                      className={cx('rounded-xl border p-3 text-left transition-colors', brief.depth === d.id ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-white/10 hover:border-white/25')}
                    >
                      <p className="text-sm font-semibold text-white">{d.label}</p>
                      <p className="text-xs text-slate-400">{d.desc}</p>
                      <p className="mt-1 text-xs text-slate-500">{d.eta}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm text-slate-300">Anuncios activos en Meta</p>
                  <Segmented value={brief.metaAds} onChange={(v) => set('metaAds', v)} options={REQ} />
                </div>
                <div>
                  <p className="mb-2 text-sm text-slate-300">Presencia en Amazon</p>
                  <Segmented value={brief.amazon} onChange={(v) => set('amazon', v)} options={REQ} />
                </div>
              </div>
              <p className="text-xs text-slate-500">Siempre exijo tienda o landing propia. Meta Ads no puedo confirmarlo solo: te dejo el enlace a la Biblioteca de Anuncios ya filtrado.</p>
              <div>
                <label htmlFor="idea" className="mb-1.5 block text-sm text-slate-300">¿Ya tenés una hipótesis de producto?</label>
                <input id="idea" className={inputCls} maxLength={400} value={brief.productIdea} onChange={(e) => set('productIdea', e.target.value)} placeholder="Ej: gomitas con biotina para hombres" />
              </div>
              <div>
                <label htmlFor="notes" className="mb-1.5 block text-sm text-slate-300">Algo más que deba saber</label>
                <textarea id="notes" className={cx(inputCls, 'min-h-[72px]')} maxLength={600} value={brief.notes} onChange={(e) => set('notes', e.target.value)} />
              </div>
            </div>
          </details>
        </Card>

        {blocked && <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">{blocked}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onStart}
            disabled={!ready}
            className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Abrir el radar global →
          </button>
          <span className="text-xs text-slate-500">{brief.markets.length} agentes en paralelo · {depth.eta}</span>
          <button type="button" onClick={onDemo} className="ml-auto text-sm text-slate-400 underline-offset-4 hover:text-white hover:underline">
            Ver una demo guiada
          </button>
        </div>
      </section>

      <aside className="space-y-4">
        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Así trabajamos</p>
          <ol className="space-y-3 text-sm text-slate-300">
            {[
              ['Radar global', 'Salgo a mirar qué se vende y qué huecos hay.'],
              ['Foco', 'Elegís una dirección y estudio a la competencia directa y a sus clientes.'],
              ['Definición', 'Afinamos público, precio y oferta.'],
              ['Concepto', 'Te entrego la ficha del producto y cómo validarlo.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 text-xs text-emerald-300">{i + 1}</span>
                <span><b className="text-white">{t}.</b> {d}</span>
              </li>
            ))}
          </ol>
        </Card>

        {history.length > 0 && (
          <Card className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Investigaciones anteriores</p>
            <ul className="space-y-1">
              {history.slice(0, 6).map((h) => (
                <li key={h.id}>
                  <button type="button" onClick={() => onOpenHistory(h)} className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white" title={h.brief.pain}>
                    <span className="block truncate">{h.demo ? '🧪 ' : ''}{h.brief.pain}</span>
                    <span className="text-xs text-slate-500">{h.brands.length} marcas · {h.decisions.length} decisiones{h.disc?.concept ? ' · concepto listo' : ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </aside>
    </div>
  );
}
