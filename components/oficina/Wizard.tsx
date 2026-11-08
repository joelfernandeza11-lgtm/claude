'use client';

import {
  Brief,
  COMMON_PAINS,
  DEPTHS,
  FORMATS,
  MARKETS,
  MARKET_PRESETS,
  MAX_MARKETS,
  Requirement,
  formatById,
  marketById,
} from '@/lib/oficina/types';
import type { HistoryItem } from '@/lib/oficina/client';
import { Assistant, Card, Field, Pill, Segmented, cx, inputCls } from './ui';

const STEPS = [
  { id: 'dolor', label: 'El dolor' },
  { id: 'formatos', label: 'Formatos' },
  { id: 'mercados', label: 'Mercados' },
  { id: 'calidad', label: 'Calidad' },
  { id: 'lanzar', label: 'Lanzar' },
] as const;

const REQ: { id: Requirement; label: string }[] = [
  { id: 'obligatorio', label: 'Obligatorio' },
  { id: 'preferido', label: 'Preferido' },
  { id: 'indiferente', label: 'Me da igual' },
];

export default function Wizard({
  brief,
  onChange,
  onLaunch,
  onDemo,
  history,
  onOpenHistory,
  blocked,
  step,
  setStep,
}: {
  brief: Brief;
  onChange: (b: Brief) => void;
  onLaunch: () => void;
  onDemo: () => void;
  history: HistoryItem[];
  onOpenHistory: (h: HistoryItem) => void;
  blocked?: string;
  step: number;
  setStep: (fn: (s: number) => number) => void;
}) {
  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => onChange({ ...brief, [k]: v });
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const canNext = step === 0 ? brief.pain.trim().length >= 3 : step === 2 ? brief.markets.length > 0 : true;
  const depth = DEPTHS.find((d) => d.id === brief.depth)!;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr_300px]">
      {/* Stepper */}
      <nav aria-label="Pasos" className="hidden lg:block">
        <ol className="space-y-1">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => (i <= step || brief.pain.trim().length >= 3) && setStep(() => i)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                  i === step ? 'bg-white/[0.06] text-white' : 'text-slate-400 hover:text-white',
                )}
              >
                <span
                  className={cx(
                    'flex h-6 w-6 items-center justify-center rounded-full border text-xs',
                    i < step ? 'border-emerald-400 bg-emerald-400 text-slate-900' : i === step ? 'border-emerald-400 text-emerald-300' : 'border-white/20',
                  )}
                >
                  {i < step ? '✓' : i + 1}
                </span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        {history.length > 0 && (
          <div className="mt-8">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Búsquedas anteriores</p>
            <ul className="space-y-1">
              {history.slice(0, 6).map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => onOpenHistory(h)}
                    className="w-full truncate rounded-lg px-3 py-1.5 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                    title={h.brief.pain}
                  >
                    {h.demo ? '🧪 ' : ''}
                    {h.brief.pain} <span className="text-slate-600">· {h.brands.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Paso actual */}
      <main className="min-w-0 space-y-5">
        {blocked && step !== 4 && <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">{blocked}</p>}
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 lg:hidden">
          Paso {step + 1} de {STEPS.length} · {STEPS[step].label}
        </p>

        {step === 0 && (
          <>
            <Assistant title="Arranquemos por lo importante">
              Las mejores marcas nacen de un <b>dolor concreto</b>, no de un producto. Contame qué problema querés resolver y yo me encargo de ver cómo lo
              resuelve el mercado global hoy.
            </Assistant>
            <Card className="space-y-5 p-5">
              <Field label="¿Qué dolor o problema querés resolver?" hint="Cuanto más específico, mejores referencias. Ej: “caída de pelo en hombres de 30–45”.">
                <input
                  autoFocus
                  className={inputCls}
                  value={brief.pain}
                  maxLength={300}
                  onChange={(e) => set('pain', e.target.value)}
                  placeholder="Ej: caída de pelo"
                />
              </Field>
              <div>
                <p className="mb-2 text-xs text-slate-500">O elegí uno frecuente:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_PAINS.map((p) => (
                    <Pill key={p.label} active={brief.pain === p.label} onClick={() => set('pain', p.label)} title={p.hint}>
                      {p.label}
                    </Pill>
                  ))}
                </div>
              </div>
              <Field label="¿Ya tenés una idea de producto? (opcional)" hint="Ej: “gomitas con biotina y saw palmetto para hombres”. Sirve para afinar la búsqueda.">
                <input
                  className={inputCls}
                  value={brief.productIdea}
                  maxLength={400}
                  onChange={(e) => set('productIdea', e.target.value)}
                  placeholder="Tu hipótesis de producto"
                />
              </Field>
            </Card>
          </>
        )}

        {step === 1 && (
          <>
            <Assistant title="¿En qué formato lo resuelven?">
              Un mismo dolor se vende como cápsulas, gomitas, shampoo, sérums… Cada formato tiene su economía (costo, recompra, ticket). Elegí los que te
              interesan o dejá que <b>yo detecte qué formatos existen</b>.
            </Assistant>
            <Card className="p-5">
              <button
                type="button"
                onClick={() => set('formats', [])}
                aria-pressed={brief.formats.length === 0}
                className={cx(
                  'mb-4 flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors',
                  brief.formats.length === 0 ? 'border-violet-400/50 bg-violet-400/10' : 'border-white/10 hover:border-white/25',
                )}
              >
                <span className="text-xl">🔎</span>
                <span>
                  <span className="block text-sm font-semibold text-white">Que el agente detecte los formatos</span>
                  <span className="block text-xs text-slate-400">Recomendado si todavía estás explorando: busca la mayor variedad posible.</span>
                </span>
              </button>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {FORMATS.map((f) => {
                  const on = brief.formats.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set('formats', toggle(brief.formats, f.id))}
                      className={cx(
                        'flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition-colors',
                        on ? 'border-emerald-400/60 bg-emerald-400/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/25',
                      )}
                    >
                      <span className="text-xl" aria-hidden>{f.glyph}</span>
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <Assistant title="¿Dónde miramos?">
              Los mercados más maduros (EE.UU., Reino Unido, Canadá, Australia) suelen ir <b>1–3 años adelante</b>: lo que hoy funciona ahí es lo que
              mañana llega a otros países. Cada mercado es un agente que busca en paralelo. Máximo {MAX_MARKETS}.
            </Assistant>
            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                {MARKET_PRESETS.map((p) => (
                  <Pill key={p.id} onClick={() => set('markets', p.markets)} active={p.markets.length === brief.markets.length && p.markets.every((m) => brief.markets.includes(m))}>
                    {p.label}
                  </Pill>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {MARKETS.map((m) => {
                  const on = brief.markets.includes(m.id);
                  const full = !on && brief.markets.length >= MAX_MARKETS;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={on}
                      disabled={full}
                      onClick={() => set('markets', toggle(brief.markets, m.id))}
                      className={cx(
                        'flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                        on ? 'border-emerald-400/60 bg-emerald-400/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/25',
                      )}
                    >
                      <span className="text-xl" aria-hidden>{m.flag}</span>
                      {m.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                {brief.markets.length}/{MAX_MARKETS} mercados · más mercados = más costo de API, pero el tiempo casi no cambia porque corren en paralelo.
              </p>
            </Card>
          </>
        )}

        {step === 3 && (
          <>
            <Assistant title="¿Qué hace que una marca valga como referencia?">
              No me sirve cualquier marca. Siempre exijo <b>tienda o landing propia</b>. Después decidís qué tan estrictos somos con anuncios y Amazon.
              Ojo: <b>no puedo abrir la Biblioteca de Anuncios de Meta</b> desde acá, así que te dejo el enlace ya filtrado para que lo confirmes en 1 clic.
            </Assistant>
            <Card className="space-y-6 p-5">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5">
                <div>
                  <p className="text-sm font-medium text-white">Landing / tienda propia</p>
                  <p className="text-xs text-slate-500">Siempre obligatorio: descarta marcas que solo venden en marketplaces.</p>
                </div>
                <span className="rounded-md bg-emerald-400/15 px-2 py-1 text-xs font-semibold text-emerald-300">Siempre</span>
              </div>

              <Field label="Anuncios activos en Meta (Facebook / Instagram)" hint="“Obligatorio” descarta marcas sin ninguna señal de anuncios. “Preferido” solo las prioriza.">
                <Segmented value={brief.metaAds} onChange={(v) => set('metaAds', v)} options={REQ} />
              </Field>
              <Field label="Presencia en Amazon" hint="Es una señal de demanda real y de validación del producto.">
                <Segmented value={brief.amazon} onChange={(v) => set('amazon', v)} options={REQ} />
              </Field>

              <Field label="Profundidad de la búsqueda">
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {DEPTHS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      aria-pressed={brief.depth === d.id}
                      onClick={() => set('depth', d.id)}
                      className={cx(
                        'rounded-xl border p-3 text-left transition-colors',
                        brief.depth === d.id ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-white/10 hover:border-white/25',
                      )}
                    >
                      <p className="text-sm font-semibold text-white">{d.label}</p>
                      <p className="text-xs text-slate-400">{d.desc}</p>
                      <p className="mt-1 text-xs text-slate-500">{d.eta}</p>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Posicionamiento de precio">
                <Segmented
                  value={brief.priceTier}
                  onChange={(v) => set('priceTier', v)}
                  options={[
                    { id: 'cualquiera', label: 'Cualquiera' },
                    { id: 'accesible', label: 'Accesible' },
                    { id: 'medio', label: 'Medio' },
                    { id: 'premium', label: 'Premium' },
                  ]}
                />
              </Field>

              <Field label="Algo más que deba saber (opcional)" hint="Público objetivo, ingredientes que querés evitar, restricciones, etc.">
                <textarea className={cx(inputCls, 'min-h-[84px]')} maxLength={600} value={brief.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>
            </Card>
          </>
        )}

        {step === 4 && (
          <>
            <Assistant title="Todo listo para abrir la oficina">
              Voy a poner <b>{brief.markets.length} agentes</b> a trabajar en paralelo, uno por mercado. Vas a verlos buscar en vivo y las marcas
              irán apareciendo a medida que las encuentren. Tiempo estimado: <b>{depth.eta}</b>.
            </Assistant>
            <Card className="space-y-4 p-5">
              <Row k="Dolor" v={brief.pain} />
              {brief.productIdea && <Row k="Idea" v={brief.productIdea} />}
              <Row k="Formatos" v={brief.formats.length ? brief.formats.map((f) => `${formatById(f)?.glyph} ${formatById(f)?.label}`).join(' · ') : 'Que el agente los detecte'} />
              <Row k="Mercados" v={brief.markets.map((m) => `${marketById(m)?.flag} ${marketById(m)?.label}`).join(' · ')} />
              <Row k="Exigencias" v={`Landing propia · Meta Ads: ${brief.metaAds} · Amazon: ${brief.amazon}`} />
              <Row k="Profundidad" v={`${depth.label} (${depth.perMarket} marcas por mercado)`} />
            </Card>
            {blocked && <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">{blocked}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onLaunch}
                className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
              >
                Abrir la búsqueda →
              </button>
              <button type="button" onClick={onDemo} className="text-sm text-slate-400 underline-offset-4 hover:text-white hover:underline">
                Probar con datos de demo
              </button>
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white disabled:invisible"
          >
            ← Atrás
          </button>
          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente →
            </button>
          )}
        </div>
      </main>

      {/* Brief vivo */}
      <aside className="hidden lg:block">
        <Card className="sticky top-6 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Tu brief</p>
          <dl className="space-y-3 text-sm">
            <Mini k="Dolor" v={brief.pain || '—'} />
            <Mini k="Formatos" v={brief.formats.length ? `${brief.formats.length} elegidos` : 'Auto-detección'} />
            <Mini k="Mercados" v={brief.markets.map((m) => marketById(m)?.flag).join(' ') || '—'} />
            <Mini k="Meta Ads" v={brief.metaAds} />
            <Mini k="Amazon" v={brief.amazon} />
            <Mini k="Profundidad" v={`${depth.label} · ${depth.eta}`} />
          </dl>
        </Card>
      </aside>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4 text-sm">
      <span className="w-24 shrink-0 text-slate-500">{k}</span>
      <span className="min-w-0 text-slate-200">{v}</span>
    </div>
  );
}
function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="text-slate-200">{v}</dd>
    </div>
  );
}
