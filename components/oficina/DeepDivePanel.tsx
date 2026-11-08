'use client';

import { useEffect, useRef, useState } from 'react';
import type { Brand, DeepDive } from '@/lib/oficina/types';
import { readNdjson } from '@/lib/oficina/client';
import { Badge, Spinner } from './ui';

type Ev = { t: 'start' } | { t: 'query'; q: string } | { t: 'source'; domain: string; title: string } | { t: 'result'; result: DeepDive } | { t: 'error'; message: string };

export default function DeepDivePanel({
  brand,
  pain,
  accessCode,
  cache,
  onCache,
  onClose,
}: {
  brand: Brand;
  pain: string;
  accessCode: string;
  cache: Record<string, DeepDive>;
  onCache: (id: string, d: DeepDive) => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<DeepDive | null>(cache[brand.id] ?? null);
  const [err, setErr] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (cache[brand.id] && attempt === 0) return;
    if (brand.demo) return;
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/oficina/deepdive', {
          method: 'POST',
          signal: ac.signal,
          headers: { 'Content-Type': 'application/json', ...(accessCode ? { 'x-access-code': accessCode } : {}) },
          body: JSON.stringify({ name: brand.name, website: brand.website, pain, market: brand.markets[0] }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.message || `Error ${res.status}`);
        }
        for await (const ev of readNdjson<Ev>(res)) {
          if (ev.t === 'query') setLog((l) => [...l.slice(-5), `🔍 ${ev.q}`]);
          else if (ev.t === 'source') setLog((l) => [...l.slice(-5), `📄 ${ev.domain}`]);
          else if (ev.t === 'error') throw new Error(ev.message);
          else if (ev.t === 'result') {
            setData(ev.result);
            onCache(brand.id, ev.result);
          }
        }
      } catch (e) {
        if (!ac.signal.aborted) setErr(e instanceof Error ? e.message : 'Error');
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand.id, attempt]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Investigación de ${brand.name}`}
        className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#0c1222] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Investigación a fondo</p>
            <h2 className="text-xl font-semibold text-white">{brand.name}</h2>
            <p className="text-xs text-slate-500">{brand.id}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg px-2.5 py-1 text-xl leading-none text-slate-400 hover:bg-white/10 hover:text-white">
            ×
          </button>
        </div>

        {brand.demo && (
          <p className="rounded-xl border border-violet-400/30 bg-violet-400/10 p-3 text-sm text-violet-200">El modo demo no incluye investigación a fondo. Configurá <code>ANTHROPIC_API_KEY</code> para usarla.</p>
        )}

        {!brand.demo && !data && !err && (
          <div className="space-y-3 text-sm text-slate-300">
            <p className="flex items-center gap-2"><Spinner /> Un agente está revisando su sitio, precios, reseñas y anuncios… (~1–2 min)</p>
            <ul className="space-y-1 text-xs text-slate-500" aria-live="polite">
              {log.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </div>
        )}

        {err && (
          <div className="space-y-3 text-sm">
            <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-rose-200">{err}</p>
            {!brand.demo && <button type="button" onClick={() => { setErr(''); setData(null); setLog([]); setAttempt((a) => a + 1); }} className="rounded-lg bg-white/10 px-3 py-1.5 text-white hover:bg-white/15">Reintentar</button>}
          </div>
        )}

        {data && (
          <div className="space-y-6 text-sm leading-relaxed text-slate-300">
            <p>{data.overview}</p>
            {data.products.length > 0 && (
              <Section title="Productos y precios">
                <ul className="space-y-1.5">
                  {data.products.map((p, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-2">
                      <span className="text-white">{p.name}</span>
                      {p.format && <Badge tone="violet">{p.format}</Badge>}
                      {p.price && <span className="text-emerald-300">{p.price}</span>}
                      {p.note && <span className="text-xs text-slate-500">{p.note}</span>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            <Bullets title="Ofertas y mecánicas" items={data.offers} />
            <Bullets title="Claims e ingredientes" items={data.claims} />
            <Bullets title="Ángulos de anuncios" items={data.adAngles} />
            <Bullets title="Estructura de la landing" items={data.landingNotes} />
            {data.reviews && <Section title="Reseñas de clientes"><p>{data.reviews}</p></Section>}
            <Bullets title="Fortalezas" items={data.strengths} />
            <Bullets title="Debilidades" items={data.weaknesses} />
            <Bullets title="Cómo diferenciarte" items={data.differentiate} accent />
            {data.sources.length > 0 && (
              <Section title="Fuentes">
                <ul className="space-y-0.5 text-xs">
                  {data.sources.map((s) => (
                    <li key={s} className="truncate"><a className="text-slate-500 hover:text-slate-300 hover:underline" href={s} target="_blank" rel="noopener noreferrer">{s}</a></li>
                  ))}
                </ul>
              </Section>
            )}
            <p className="text-xs text-slate-600">Generado por IA con búsqueda web. Verificá los datos críticos (precios, claims, anuncios) en las fuentes.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </section>
  );
}
function Bullets({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  if (!items.length) return null;
  return (
    <Section title={title}>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2"><span className={accent ? 'text-emerald-400' : 'text-slate-600'} aria-hidden>•</span><span>{it}</span></li>
        ))}
      </ul>
    </Section>
  );
}
