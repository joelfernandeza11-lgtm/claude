import type { Brand, Brief, Signal, Synthesis } from './types';
import { formatById, marketById } from './types';
import { scoreBrand } from './score';

// ---------- Fusión de marcas entre mercados ----------

const RANK: Record<Signal, number> = { confirmed: 3, likely: 2, unknown: 1, none: 0 };
const best = (a: Signal, b: Signal): Signal => (RANK[a] >= RANK[b] ? a : b);
const uniq = <T,>(xs: T[]): T[] => Array.from(new Set(xs));

export function mergeBrands(existing: Brand[], incoming: Brand[]): Brand[] {
  const map = new Map(existing.map((b) => [b.id, b]));
  for (const n of incoming) {
    const cur = map.get(n.id);
    if (!cur) {
      map.set(n.id, n);
      continue;
    }
    const seen = new Set(cur.formats.map((f) => `${f.format}|${f.product.toLowerCase()}`));
    const formats = [...cur.formats, ...n.formats.filter((f) => !seen.has(`${f.format}|${f.product.toLowerCase()}`))];
    map.set(n.id, {
      ...cur,
      markets: uniq([...cur.markets, ...n.markets]),
      formats,
      meta: RANK[n.meta.status] > RANK[cur.meta.status] ? n.meta : cur.meta,
      amazon: {
        status: best(cur.amazon.status, n.amazon.status),
        url: cur.amazon.url ?? n.amazon.url,
        note: cur.amazon.note ?? n.amazon.note,
      },
      traction: Math.max(cur.traction, n.traction),
      tractionSignals: uniq([...cur.tractionSignals, ...n.tractionSignals]).slice(0, 8),
      sources: uniq([...cur.sources, ...n.sources]).slice(0, 10),
      why: cur.why || n.why,
      angle: cur.angle || n.angle,
    });
  }
  return Array.from(map.values());
}

export const sortByScore = (brands: Brand[]): Brand[] =>
  [...brands].sort((a, b) => scoreBrand(b).total - scoreBrand(a).total);

// ---------- NDJSON ----------

export async function* readNdjson<T>(res: Response): AsyncGenerator<T> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line) {
        try {
          yield JSON.parse(line) as T;
        } catch {
          /* línea corrupta */
        }
      }
    }
  }
  const tail = buf.trim();
  if (tail) {
    try {
      yield JSON.parse(tail) as T;
    } catch {
      /* ignorar */
    }
  }
}

// ---------- Almacenamiento local (nunca debe romper la UI) ----------

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin espacio o bloqueado */
  }
}

export interface HistoryItem {
  id: string;
  at: number;
  brief: Brief;
  brands: Brand[];
  synthesis?: Synthesis;
  demo?: boolean;
}

// ---------- CSV ----------

export function brandsToCsv(brands: Brand[]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ['Marca', 'Sitio', 'Puntaje', 'Mercados', 'Formatos', 'Rango de precio', 'Plataforma', 'Meta Ads', 'Nota Meta', 'Amazon', 'Link Amazon', 'Ángulo', 'Posicionamiento', 'Fuentes'];
  const rows = brands.map((b) => [
    b.name,
    b.website,
    scoreBrand(b).total,
    b.markets.map((m) => marketById(m)?.label ?? m).join(' | '),
    b.formats.map((f) => `${formatById(f.format)?.label ?? f.format}: ${f.product} ${f.price}`.trim()).join(' | '),
    b.priceRange,
    b.platform ?? '',
    b.meta.status,
    b.meta.note,
    b.amazon.status,
    b.amazon.url ?? '',
    b.angle,
    b.positioning,
    b.sources.join(' '),
  ]);
  return '﻿' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}

export function download(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
