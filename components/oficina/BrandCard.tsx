'use client';

import { useState } from 'react';
import type { Brand, Signal } from '@/lib/oficina/types';
import { formatById, marketById } from '@/lib/oficina/types';
import { adLibraryUrl, amazonSearchUrl, safeUrl } from '@/lib/oficina/links';
import { scoreBrand } from '@/lib/oficina/score';
import { Badge, Card, ScoreRing, cx } from './ui';

const metaBadge = (s: Signal) =>
  s === 'confirmed' ? <Badge tone="green">Meta Ads: confirmado</Badge>
  : s === 'likely' ? <Badge tone="amber" title="Hay señales indirectas. Confirmalo en la Biblioteca de Anuncios.">Meta Ads: probable</Badge>
  : s === 'none' ? <Badge tone="red">Sin Meta Ads</Badge>
  : <Badge tone="slate" title="El agente no pudo confirmarlo. Verificalo en la Biblioteca de Anuncios.">Meta Ads: verificar</Badge>;

const amazonBadge = (s: Signal) =>
  s === 'confirmed' ? <Badge tone="green">Amazon ✓</Badge>
  : s === 'likely' ? <Badge tone="amber">Amazon: probable</Badge>
  : s === 'none' ? <Badge tone="red">No está en Amazon</Badge>
  : <Badge tone="slate">Amazon: verificar</Badge>;

const linkCls = 'rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-300 hover:border-white/30 hover:text-white';

export default function BrandCard({
  brand,
  saved,
  onToggleSave,
  onDeepDive,
}: {
  brand: Brand;
  saved: boolean;
  onToggleSave: () => void;
  onDeepDive: () => void;
}) {
  const [open, setOpen] = useState(false);
  const score = scoreBrand(brand);
  const primary = brand.markets[0] ?? 'US';
  const adCountry = brand.markets.length === 1 ? brand.markets[0] : 'ALL';

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <ScoreRing value={score.total} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white">{brand.name}</h3>
            {brand.demo && <Badge tone="violet">demo</Badge>}
          </div>
          <a href={safeUrl(brand.website)} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-emerald-300/80 hover:underline">
            {brand.id}
          </a>
          <p className="mt-1 text-xs text-slate-500" title={brand.markets.map((m) => marketById(m)?.label).join(', ')}>
            {brand.markets.map((m) => marketById(m)?.flag).join(' ')}
            {brand.priceRange && ` · ${brand.priceRange}`}
            {brand.platform && brand.platform !== 'unknown' && ` · ${brand.platform}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? 'Quitar de la shortlist' : 'Guardar en la shortlist'}
          className={cx('rounded-lg p-1.5 text-lg leading-none transition-colors', saved ? 'text-amber-300' : 'text-slate-600 hover:text-slate-300')}
        >
          {saved ? '★' : '☆'}
        </button>
      </div>

      {brand.positioning && <p className="text-sm leading-relaxed text-slate-300">{brand.positioning}</p>}

      <div className="flex flex-wrap gap-1.5">
        {brand.formats.slice(0, 6).map((f, i) => (
          <Badge key={i} tone="violet" title={f.product}>
            {formatById(f.format)?.glyph ?? '📦'} {formatById(f.format)?.label.split(' /')[0] ?? 'Otro'}
            {f.price && ` · ${f.price}`}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone={brand.landing ? 'green' : 'red'}>{brand.landing ? 'Landing propia ✓' : 'Sin landing'}</Badge>
        {metaBadge(brand.meta.status)}
        {amazonBadge(brand.amazon.status)}
      </div>

      {brand.angle && (
        <p className="text-xs leading-relaxed text-slate-400">
          <span className="font-semibold text-slate-300">Ángulo: </span>
          {brand.angle}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <a className={linkCls} href={adLibraryUrl(brand.name, adCountry)} target="_blank" rel="noopener noreferrer" title="Abre la Biblioteca de Anuncios de Meta ya filtrada">
          Ver anuncios en Meta ↗
        </a>
        <a className={linkCls} href={safeUrl(brand.amazon.url) ?? amazonSearchUrl(brand.name, primary)} target="_blank" rel="noopener noreferrer">
          Amazon ↗
        </a>
        <a className={linkCls} href={safeUrl(brand.website)} target="_blank" rel="noopener noreferrer">
          Sitio ↗
        </a>
        <button type="button" onClick={onDeepDive} className="ml-auto rounded-lg bg-violet-400/20 px-2.5 py-1 text-xs font-medium text-violet-200 hover:bg-violet-400/30">
          Investigar a fondo
        </button>
      </div>

      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="text-left text-xs text-slate-500 hover:text-slate-300">
        {open ? '▾ Ocultar evidencia' : '▸ Ver evidencia y puntaje'}
      </button>
      {open && (
        <div className="space-y-3 border-t border-white/10 pt-3 text-xs text-slate-400">
          {brand.why && <p>{brand.why}</p>}
          {brand.meta.note && <p><b className="text-slate-300">Meta:</b> {brand.meta.note}</p>}
          {brand.tractionSignals.length > 0 && <p><b className="text-slate-300">Tracción:</b> {brand.tractionSignals.join(' · ')}</p>}
          {brand.formats.some((f) => f.url) && (
            <ul className="space-y-0.5">
              {brand.formats.filter((f) => f.url).map((f, i) => (
                <li key={i}>
                  <a className="text-emerald-300/80 hover:underline" href={safeUrl(f.url)} target="_blank" rel="noopener noreferrer">{f.product || f.url}</a>
                </li>
              ))}
            </ul>
          )}
          <ul className="space-y-1">
            {score.parts.map((p) => (
              <li key={p.label} className="flex items-center gap-2">
                <span className="w-44 shrink-0">{p.label}</span>
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full bg-emerald-400/70" style={{ width: `${(p.value / p.max) * 100}%` }} />
                </span>
                <span className="w-10 text-right tabular-nums">{p.value}/{p.max}</span>
              </li>
            ))}
          </ul>
          {brand.sources.length > 0 && (
            <ul className="space-y-0.5">
              {brand.sources.map((s) => (
                <li key={s} className="truncate">
                  <a className="text-slate-500 hover:text-slate-300 hover:underline" href={s} target="_blank" rel="noopener noreferrer">{s}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
