'use client';

import { useEffect, useState } from 'react';
import { MAP_ASPECT, MARKET_GEO, landPath, project } from '@/lib/oficina/world';
import type { AgentState } from '@/lib/oficina/types';
import { AtlasMark } from './AtlasLogo';

export type SceneMode = 'idle' | 'working' | 'thinking' | 'presenting';

const W = 1200;
const H = 380;
const MAP = { x: 24, y: 36, w: 640 };
const MAP_H = MAP.w / MAP_ASPECT;
const LAND_D = landPath(MAP.w, MAP_H);

const STATUS_COLOR = { waiting: '#64748b', searching: '#34d399', done: '#a78bfa', error: '#fb7185' } as const;

function TypedText({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v < text.length ? v + 1 : v)), 28);
    return () => clearInterval(t);
  }, [text]);
  return (
    <>
      {text.slice(0, n)}
      <span className="atlas-caret">▍</span>
    </>
  );
}

export default function OfficeScene({
  mode,
  markets,
  agents,
  query,
  sources,
  thought,
  pain,
  stageLabel,
  stats,
}: {
  mode: SceneMode;
  markets: string[];
  agents: Record<string, AgentState>;
  query?: string;
  sources: string[];
  thought?: string;
  pain?: string;
  stageLabel: string;
  stats: { sources: number; brands: number };
}) {
  const screen = { x: 890, y: 115, w: 270, h: 165 };
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  const pins = markets
    .map((id) => {
      const g = MARKET_GEO[id];
      if (!g) return null;
      const { fx, fy } = project(g[0], g[1]);
      return { id, x: MAP.x + fx * MAP.w, y: MAP.y + fy * MAP_H, st: agents[id]?.status ?? 'waiting' };
    })
    .filter((p): p is { id: string; x: number; y: number; st: AgentState['status'] } => p !== null);

  const live = mode === 'working';
  const modeCls = mode === 'working' ? 'atlas-working' : mode === 'thinking' ? 'atlas-thinking' : '';

  return (
    <div
      className={`atlas-scene relative w-full select-none overflow-hidden rounded-2xl border border-white/10 ${modeCls}`}
      style={{ aspectRatio: `${W} / ${H}`, background: '#0b1226' }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="sc-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d1530" />
            <stop offset="1" stopColor="#111c3a" />
          </linearGradient>
          <linearGradient id="sc-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a1124" />
            <stop offset="1" stopColor="#070c1a" />
          </linearGradient>
          <radialGradient id="sc-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#34d399" stopOpacity="0.28" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sc-lamp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fde68a" stopOpacity="0.35" />
            <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
          </linearGradient>
          <pattern id="sc-dots" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.15" fill="#7c93d6" />
          </pattern>
          <clipPath id="sc-land">
            <path d={LAND_D} />
          </clipPath>
        </defs>

        {/* Pared y piso */}
        <rect width={W} height={H} fill="url(#sc-wall)" />
        <rect y="335" width={W} height="45" fill="url(#sc-floor)" />
        <g stroke="rgba(255,255,255,0.03)">
          {[100, 300, 520, 760, 1000, 1160].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="335" />
          ))}
        </g>

        {/* Mapamundi en la pared */}
        <g transform={`translate(${MAP.x} ${MAP.y})`}>
          <rect x="-12" y="-12" width={MAP.w + 24} height={MAP_H + 24} rx="14" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.09)" />
          <g stroke="rgba(124,147,214,0.12)" strokeWidth="0.6">
            {[0.2, 0.4, 0.6, 0.8].map((f) => (
              <line key={`h${f}`} x1="0" y1={MAP_H * f} x2={MAP.w} y2={MAP_H * f} />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map((f) => (
              <line key={`v${f}`} x1={MAP.w * f} y1="0" x2={MAP.w * f} y2={MAP_H} />
            ))}
          </g>
          <g clipPath="url(#sc-land)">
            <rect width={MAP.w} height={MAP_H} fill="url(#sc-dots)" opacity="0.55" />
          </g>
        </g>

        {/* Resplandor de la pantalla */}
        <ellipse cx="1025" cy="205" rx="250" ry="150" fill="url(#sc-glow)" opacity={live || mode === 'thinking' ? 1 : 0.45} />

        {/* Arcos: los datos viajan desde cada mercado hasta la computadora */}
        {live &&
          pins
            .filter((p) => p.st === 'searching')
            .map((p) => (
              <path
                key={`arc-${p.id}`}
                d={`M${p.x} ${p.y} Q${(p.x + 1025) / 2} ${Math.min(p.y, 200) - 70} 1025 195`}
                fill="none"
                stroke="#34d399"
                strokeOpacity="0.55"
                strokeWidth="1.4"
                className="atlas-arc"
              />
            ))}

        {/* Pines de mercado */}
        {pins.map((p) => (
          <g key={p.id} transform={`translate(${p.x} ${p.y})`}>
            {p.st === 'searching' && <circle r="5" fill={STATUS_COLOR.searching} opacity="0.5" className="atlas-ping" />}
            <circle r="4.2" fill={STATUS_COLOR[p.st]} stroke="#0b1226" strokeWidth="1.5" />
          </g>
        ))}

        {/* Escritorio */}
        <rect x="725" y="318" width="475" height="14" rx="4" fill="#1d2845" />
        <rect x="725" y="332" width="475" height="48" fill="#121a33" />
        <rect x="740" y="332" width="6" height="48" fill="#0d1429" />
        <rect x="1170" y="332" width="6" height="48" fill="#0d1429" />

        {/* Lámpara */}
        <polygon points="1148,236 1192,236 1210,318 1130,318" fill="url(#sc-lamp)" className="atlas-glow" />
        <path d="M1180 318 L1176 280 L1160 246" stroke="#2a3558" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M1146 240 L1176 236 L1170 250 Z" fill="#2f3b66" />
        <ellipse cx="1180" cy="318" rx="14" ry="3" fill="#2a3558" />

        {/* Monitor */}
        <rect x="1018" y="295" width="14" height="23" fill="#1a2340" />
        <rect x="985" y="316" width="80" height="4" rx="2" fill="#2a3558" />
        <rect x="880" y="105" width="290" height="190" rx="12" fill="#070b18" stroke="#26324f" strokeWidth="2" />
        <rect x={screen.x} y={screen.y} width={screen.w} height={screen.h} rx="6" fill="#0c1428" />

        {/* Teclado */}
        <rect x="868" y="311" width="150" height="8" rx="3" fill="#243152" />
        <g fill="#34406b">
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={872 + i * 10.2} y="313" width="7" height="2.4" rx="1" />
          ))}
        </g>

        {/* Taza con vapor */}
        <g>
          <rect x="1090" y="298" width="16" height="20" rx="3" fill="#e7e0d2" />
          <path d="M1106 303 q8 0 8 6 q0 6 -8 6" fill="none" stroke="#e7e0d2" strokeWidth="2.2" />
          <g stroke="#cbd5f5" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <path className="atlas-steam" d="M1095 294 q-3 -5 0 -9" />
            <path className="atlas-steam" d="M1099 294 q-3 -5 0 -9" />
            <path className="atlas-steam" d="M1103 294 q-3 -5 0 -9" />
          </g>
        </g>

        {/* Atlas, el analista */}
        <g>
          {/* silla */}
          <rect x="728" y="222" width="18" height="86" rx="8" fill="#17203d" />
          <rect x="728" y="300" width="112" height="12" rx="6" fill="#17203d" />
          <rect x="776" y="312" width="8" height="40" fill="#10172e" />
          <path d="M738 356 H822" stroke="#10172e" strokeWidth="5" strokeLinecap="round" />
          {/* piernas */}
          <line x1="790" y1="300" x2="852" y2="300" stroke="#1b2540" strokeWidth="22" strokeLinecap="round" />
          <line x1="852" y1="300" x2="854" y2="366" stroke="#1b2540" strokeWidth="20" strokeLinecap="round" />
          <ellipse cx="866" cy="372" rx="17" ry="6" fill="#090e1d" />
          {/* torso */}
          <path d="M752 306 L757 236 Q760 222 778 222 L808 224 Q821 230 819 247 L811 306 Z" fill="#6d5bd0" />
          <ellipse cx="772" cy="226" rx="16" ry="8" fill="#5b4bb5" />
          {/* brazo trasero */}
          <line x1="800" y1="244" x2="808" y2="282" stroke="#5748b0" strokeWidth="14" strokeLinecap="round" />
          <g className="atlas-arm-b">
            <line x1="808" y1="282" x2="874" y2="311" stroke="#5748b0" strokeWidth="12" strokeLinecap="round" />
            <circle cx="878" cy="312" r="5.5" fill="#c99670" />
          </g>
          {/* cabeza */}
          <g className="atlas-head">
            <rect x="782" y="212" width="14" height="16" fill="#c99670" />
            <ellipse cx="792" cy="196" rx="21" ry="24" fill="#d9a47a" />
            <path d="M770 198 Q766 168 792 168 Q820 170 815 190 Q804 181 790 184 Q778 187 774 204 Z" fill="#231b2e" />
            <path d="M811 195 l7 6 l-7 3 Z" fill="#d9a47a" />
            <path d="M772 190 Q790 162 812 184" stroke="#2a2540" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="783" cy="200" r="8" fill="#2a2540" stroke="#4a4678" strokeWidth="1.4" />
            <path d="M780 207 Q788 222 804 220" stroke="#2a2540" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="805" cy="220" r="2.4" fill="#34d399" />
            <circle cx="803" cy="193" r="1.6" fill="#231b2e" />
          </g>
          {/* brazo delantero */}
          <line x1="796" y1="240" x2="812" y2="278" stroke="#6d5bd0" strokeWidth="15" strokeLinecap="round" />
          <g className="atlas-arm-a">
            <line x1="812" y1="278" x2="884" y2="309" stroke="#6d5bd0" strokeWidth="13" strokeLinecap="round" />
            <circle cx="888" cy="310" r="6" fill="#d9a47a" />
          </g>
        </g>
      </svg>

      {/* Cartel de pared */}
      <div className="absolute left-[2%] top-[3%] flex items-center gap-[0.6cqw] text-[1cqw] font-semibold uppercase tracking-[0.2em] text-slate-400" style={{ fontSize: 'max(9px, 0.95cqw)' }}>
        <span className={`inline-block h-[0.7cqw] w-[0.7cqw] min-h-[6px] min-w-[6px] rounded-full ${live ? 'bg-emerald-400' : mode === 'thinking' ? 'bg-amber-300' : 'bg-slate-500'}`} />
        {live ? 'Buscando en vivo' : mode === 'thinking' ? 'Analizando' : mode === 'presenting' ? 'Conclusiones listas' : 'Oficina abierta'}
      </div>

      {/* Estadísticas del mapa */}
      <div className="absolute bottom-[19%] left-[2%] flex gap-[1.2cqw] text-slate-500" style={{ fontSize: 'max(9px, 0.95cqw)' }}>
        <span>{markets.length} mercados</span>
        <span>{stats.sources} fuentes</span>
        <span>{stats.brands} marcas</span>
      </div>

      {/* Post-its */}
      {pain && (
        <div
          className="atlas-sticky absolute left-[74.5%] top-[4%] w-[13.5%] rounded-sm bg-amber-200 p-[0.7cqw] font-medium leading-tight text-slate-800 shadow-lg"
          style={{ ['--r' as string]: '-3deg', fontSize: 'max(9px, 1cqw)' }}
        >
          <span className="block text-[0.8em] uppercase tracking-wider text-slate-500">Dolor</span>
          <span className="line-clamp-2">{pain}</span>
        </div>
      )}
      <div
        className="atlas-sticky absolute left-[89.5%] top-[6%] w-[8.5%] rounded-sm bg-emerald-200 p-[0.7cqw] font-medium leading-tight text-slate-800 shadow-lg"
        style={{ ['--r' as string]: '3deg', fontSize: 'max(9px, 1cqw)', animationDelay: '1s' }}
      >
        <span className="block text-[0.8em] uppercase tracking-wider text-slate-500">Etapa</span>
        <span>{stageLabel}</span>
      </div>

      {/* Globo de pensamiento de Atlas */}
      {thought && (
        <div
          key={thought}
          className="atlas-rise absolute left-[57%] top-[12%] max-w-[17%] rounded-xl border border-white/15 bg-[#161f3d]/95 px-[0.9cqw] py-[0.6cqw] leading-snug text-slate-200 shadow-xl"
          style={{ fontSize: 'max(9px, 0.95cqw)' }}
        >
          {thought}
          <span className="absolute -bottom-[5px] left-[55%] h-2.5 w-2.5 rotate-45 border-b border-r border-white/15 bg-[#161f3d]" />
        </div>
      )}

      {/* Contenido de la pantalla */}
      <div
        className="absolute overflow-hidden rounded-md"
        style={{
          left: pct(screen.x, W),
          top: pct(screen.y, H),
          width: pct(screen.w, W),
          height: pct(screen.h, H),
          fontSize: 'max(7px, 0.95cqw)',
        }}
      >
        {mode === 'idle' && (
          <div className="flex h-full flex-col items-center justify-center gap-[0.8em] text-slate-400">
            <AtlasMark size={28} />
            <span className="text-[1em]">Listo para investigar<span className="atlas-caret">▍</span></span>
          </div>
        )}

        {mode === 'working' && (
          <div className="relative flex h-full flex-col p-[0.9em] text-slate-300">
            <div className="atlas-scan pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent" />
            <div className="mb-[0.8em] flex items-center gap-[0.6em] rounded-md bg-white/5 px-[0.7em] py-[0.5em]">
              <span className="text-emerald-400">🔍</span>
              <span className="min-w-0 flex-1 truncate">{query ? <TypedText key={query} text={query} /> : <span className="text-slate-500">buscando…</span>}</span>
            </div>
            <ul className="flex-1 space-y-[0.5em] overflow-hidden">
              {sources.slice(0, 4).map((s, i) => (
                <li key={`${s}-${i}`} className="atlas-rise flex items-center gap-[0.6em] rounded bg-white/[0.04] px-[0.7em] py-[0.45em]">
                  <span className="h-[1em] w-[1em] shrink-0 rounded-sm bg-violet-400/60" />
                  <span className="truncate">{s}</span>
                </li>
              ))}
            </ul>
            <div className="mt-[0.5em] text-[0.9em] text-slate-500">
              {stats.sources} fuentes · {stats.brands} marcas
            </div>
          </div>
        )}

        {mode === 'thinking' && (
          <div className="flex h-full flex-col items-center justify-center gap-[0.9em] p-[1em] text-center text-slate-300">
            <span className="text-[1.6em]">💡</span>
            <span>
              Cruzando {stats.brands} marcas<span className="atlas-dots" />
            </span>
            <div className="w-3/4 space-y-[0.5em]">
              {[90, 60, 75].map((w, i) => (
                <div key={i} className="h-[0.5em] overflow-hidden rounded bg-white/10">
                  <div className="atlas-glow h-full rounded bg-emerald-400/60" style={{ width: `${w}%`, animationDelay: `${i * 0.4}s` }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'presenting' && (
          <div className="flex h-full flex-col items-center justify-center gap-[0.7em] text-center text-slate-300">
            <span className="flex h-[3em] w-[3em] items-center justify-center rounded-full bg-emerald-400/20 text-[1.6em] text-emerald-300">✓</span>
            <span>Conclusiones listas</span>
            <span className="text-[0.9em] text-slate-500">{stats.brands} marcas analizadas</span>
          </div>
        )}
      </div>
    </div>
  );
}
