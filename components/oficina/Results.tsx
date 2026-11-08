'use client';

import { useMemo, useState } from 'react';
import { Brand, Brief, FORMATS, formatById, marketById } from '@/lib/oficina/types';
import { brandsToCsv, download, sortByScore } from '@/lib/oficina/client';
import BrandCard from './BrandCard';
import { Card, Pill, cx } from './ui';

type Tab = 'marcas' | 'mapa' | 'shortlist';

/** Panel de evidencia: las marcas que respaldan las conclusiones de Atlas. */
export default function Results({
  brief,
  brands,
  agentErrors,
  shortlist,
  onToggleSave,
  onDeepDive,
}: {
  brief: Brief;
  brands: Brand[];
  agentErrors: { market: string; message: string }[];
  shortlist: string[];
  onToggleSave: (id: string) => void;
  onDeepDive: (b: Brand) => void;
}) {
  const [tab, setTab] = useState<Tab>('marcas');
  const [fFormat, setFFormat] = useState<string>('');
  const [fMarket, setFMarket] = useState<string>('');
  const [fMeta, setFMeta] = useState(false);
  const [fAmazon, setFAmazon] = useState(false);

  const sorted = useMemo(() => sortByScore(brands), [brands]);
  const filtered = useMemo(
    () =>
      sorted.filter(
        (b) =>
          (!fFormat || b.formats.some((f) => f.format === fFormat)) &&
          (!fMarket || b.markets.includes(fMarket)) &&
          (!fMeta || b.meta.status === 'confirmed' || b.meta.status === 'likely') &&
          (!fAmazon || b.amazon.status === 'confirmed' || b.amazon.status === 'likely'),
      ),
    [sorted, fFormat, fMarket, fMeta, fAmazon],
  );
  const saved = sorted.filter((b) => shortlist.includes(b.id));

  const presentFormats = useMemo(() => {
    const ids = new Set<string>();
    brands.forEach((b) => b.formats.forEach((f) => ids.add(f.format)));
    return FORMATS.filter((f) => ids.has(f.id));
  }, [brands]);

  const multi = brands.filter((b) => b.markets.length > 1).length;
  const tabs: { id: Tab; label: string; n?: number }[] = [
    { id: 'marcas', label: 'Marcas', n: brands.length },
    { id: 'mapa', label: 'Mapa de formatos' },
    { id: 'shortlist', label: 'Shortlist', n: saved.length },
  ];

  return (
    <div>
      <p className="mb-4 text-sm text-slate-400">
        {brands.length} marcas relevadas · {multi} presentes en más de un mercado. Ordenadas por un puntaje transparente (abrí «Ver evidencia» en cada una).
      </p>

      {agentErrors.length > 0 && (
        <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
          {agentErrors.length === 1 ? 'Un mercado falló' : `${agentErrors.length} mercados fallaron`}:{' '}
          {agentErrors.map((e) => `${marketById(e.market)?.label} (${e.message})`).join('; ')}.
        </p>
      )}

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-white/10" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              'whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors',
              tab === t.id ? 'border-emerald-400 text-white' : 'border-transparent text-slate-400 hover:text-white',
            )}
          >
            {t.label}
            {t.n !== undefined && <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-xs">{t.n}</span>}
          </button>
        ))}
      </div>

      {tab === 'marcas' && (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <select
              aria-label="Filtrar por formato"
              value={fFormat}
              onChange={(e) => setFFormat(e.target.value)}
              className="rounded-full border border-white/10 bg-[#0f1628] px-3 py-1.5 text-sm text-slate-200"
            >
              <option value="">Todos los formatos</option>
              {presentFormats.map((f) => (
                <option key={f.id} value={f.id}>{f.glyph} {f.label}</option>
              ))}
            </select>
            <select
              aria-label="Filtrar por mercado"
              value={fMarket}
              onChange={(e) => setFMarket(e.target.value)}
              className="rounded-full border border-white/10 bg-[#0f1628] px-3 py-1.5 text-sm text-slate-200"
            >
              <option value="">Todos los mercados</option>
              {brief.markets.map((m) => (
                <option key={m} value={m}>{marketById(m)?.flag} {marketById(m)?.label}</option>
              ))}
            </select>
            <Pill active={fMeta} onClick={() => setFMeta((v) => !v)}>Con señal de Meta Ads</Pill>
            <Pill active={fAmazon} onClick={() => setFAmazon((v) => !v)}>En Amazon</Pill>
            <button
              type="button"
              onClick={() => download(`marcas-${brief.pain.slice(0, 30).replace(/\W+/g, '-')}.csv`, brandsToCsv(filtered))}
              disabled={!filtered.length}
              className="ml-auto rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:border-white/30 disabled:opacity-40"
            >
              Exportar CSV ({filtered.length})
            </button>
          </div>
          {filtered.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-400">
              {brands.length === 0 ? 'No se encontraron marcas.' : 'Ninguna marca cumple los filtros actuales.'}
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((b) => (
                <BrandCard key={b.id} brand={b} saved={shortlist.includes(b.id)} onToggleSave={() => onToggleSave(b.id)} onDeepDive={() => onDeepDive(b)} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'mapa' && (
        <FormatMatrix brands={brands} markets={brief.markets} formats={presentFormats.map((f) => f.id)} onPick={(f, m) => { setFFormat(f); setFMarket(m); setTab('marcas'); }} />
      )}

      {tab === 'shortlist' &&
        (saved.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-400">Todavía no guardaste marcas. Tocá la ☆ en una marca para sumarla acá.</Card>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button type="button" onClick={() => download('shortlist.csv', brandsToCsv(saved))} className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:border-white/30">
                Exportar shortlist CSV
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {saved.map((b) => (
                <BrandCard key={b.id} brand={b} saved onToggleSave={() => onToggleSave(b.id)} onDeepDive={() => onDeepDive(b)} />
              ))}
            </div>
          </>
        ))}
    </div>
  );
}

function FormatMatrix({
  brands,
  markets,
  formats,
  onPick,
}: {
  brands: Brand[];
  markets: string[];
  formats: string[];
  onPick: (format: string, market: string) => void;
}) {
  if (!formats.length) return <Card className="p-8 text-center text-sm text-slate-400">Aún no hay formatos para mapear.</Card>;
  const count = (f: string, m?: string) => brands.filter((b) => b.formats.some((x) => x.format === f) && (!m || b.markets.includes(m))).length;
  const max = Math.max(1, ...formats.flatMap((f) => markets.map((m) => count(f, m))));
  return (
    <Card className="overflow-x-auto p-4">
      <p className="mb-4 text-sm text-slate-400">Cantidad de marcas por formato y mercado. Tocá una celda para ver esas marcas. Más oscuro = más competencia.</p>
      <table className="w-full min-w-[560px] border-separate border-spacing-1.5 text-sm">
        <thead>
          <tr>
            <th className="text-left font-medium text-slate-500">Formato</th>
            {markets.map((m) => (
              <th key={m} className="font-medium text-slate-400" title={marketById(m)?.label}>{marketById(m)?.flag}</th>
            ))}
            <th className="font-medium text-slate-400">Total</th>
          </tr>
        </thead>
        <tbody>
          {formats.map((f) => (
            <tr key={f}>
              <td className="whitespace-nowrap pr-3 text-slate-200">{formatById(f)?.glyph} {formatById(f)?.label}</td>
              {markets.map((m) => {
                const n = count(f, m);
                return (
                  <td key={m} className="text-center">
                    <button
                      type="button"
                      disabled={!n}
                      onClick={() => onPick(f, m)}
                      className="h-9 w-full rounded-lg text-white transition hover:ring-1 hover:ring-white/40 disabled:cursor-default"
                      style={{ background: n ? `rgba(52,211,153,${0.12 + (n / max) * 0.55})` : 'rgba(255,255,255,0.03)' }}
                      aria-label={`${formatById(f)?.label} en ${marketById(m)?.label}: ${n} marcas`}
                    >
                      {n || '·'}
                    </button>
                  </td>
                );
              })}
              <td className="text-center font-semibold text-white">{count(f)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">Una marca con varios formatos cuenta en cada uno. Sólo refleja las marcas relevadas, no el mercado completo.</p>
    </Card>
  );
}
