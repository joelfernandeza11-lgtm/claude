'use client';

import { useState } from 'react';
import { DiscoverResult, OptionItem, STAGES, formatById } from '@/lib/oficina/types';
import { Badge, Card, cx, inputCls } from './ui';

export default function Conclusions({
  disc,
  stageIdx,
  onChoose,
}: {
  disc: DiscoverResult;
  stageIdx: number;
  onChoose: (choice: { option?: OptionItem; text?: string }) => void;
}) {
  const initial = disc.options.find((o) => o.recommended)?.id ?? disc.options[0]?.id ?? '';
  const [sel, setSel] = useState(initial);
  const [text, setText] = useState('');
  const stage = STAGES[stageIdx];
  const chosen = disc.options.find((o) => o.id === sel);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
          Ronda {stageIdx + 1} de {STAGES.length} · {stage.label}
        </p>
        <h1 className="mt-1 text-xl font-semibold leading-snug text-white sm:text-2xl">{disc.headline}</h1>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {disc.findings.map((f, i) => (
          <Card key={i} className="p-4">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <Badge tone={f.basis === 'evidencia' ? 'green' : 'violet'} title={f.basis === 'evidencia' ? 'Se desprende de los datos relevados' : 'Interpretación de Atlas'}>
                {f.basis}
              </Badge>
              <Badge tone={f.confidence === 'alta' ? 'green' : f.confidence === 'media' ? 'amber' : 'slate'}>confianza {f.confidence}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{f.detail}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-4 border-emerald-400/20 p-5">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-400/20 text-lg" aria-hidden>🧭</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Tu decisión</p>
            <h2 className="text-lg font-semibold text-white">{disc.question}</h2>
          </div>
        </div>

        <div role="radiogroup" aria-label={disc.question} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {disc.options.map((o) => {
            const on = sel === o.id && !text.trim();
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => { setSel(o.id); setText(''); }}
                className={cx(
                  'flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors',
                  on ? 'border-emerald-400/70 bg-emerald-400/10' : 'border-white/10 hover:border-white/25',
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{o.label}</span>
                  {o.recommended && <Badge tone="green">Atlas recomienda</Badge>}
                </span>
                <span className="text-sm leading-relaxed text-slate-300">{o.detail}</span>
                <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {o.format && o.format !== 'otro' && <Badge tone="violet">{formatById(o.format)?.glyph} {formatById(o.format)?.label.split(' /')[0]}</Badge>}
                  {o.audience && <Badge tone="slate">{o.audience}</Badge>}
                  {o.price && <Badge tone="slate">{o.price}</Badge>}
                </span>
                {o.angle && <span className="text-xs text-slate-400"><b className="text-slate-300">Ángulo:</b> {o.angle}</span>}
                {o.risk && <span className="text-xs text-amber-300/80"><b>Riesgo:</b> {o.risk}</span>}
              </button>
            );
          })}
        </div>

        <div>
          <label htmlFor="steer" className="mb-1.5 block text-sm text-slate-400">¿Ninguna te convence? Decile a Atlas hacia dónde ir:</label>
          <input
            id="steer"
            className={inputCls}
            maxLength={300}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ej: prefiero algo para mujeres con menopausia, en formato sérum"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onChoose(text.trim() ? { text: text.trim() } : { option: chosen })}
            disabled={!text.trim() && !chosen}
            className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 disabled:opacity-40"
          >
            {stageIdx === STAGES.length - 2 ? 'Armar el concepto →' : stageIdx < 1 ? 'Investigar esta dirección →' : 'Seguir con esta opción →'}
          </button>
          <span className="text-xs text-slate-500">
            {stageIdx < 1 ? 'Se lanza una nueva búsqueda enfocada (~1 min).' : 'Es un análisis, no una búsqueda nueva: tarda unos segundos.'}
          </span>
        </div>
      </Card>
    </div>
  );
}
