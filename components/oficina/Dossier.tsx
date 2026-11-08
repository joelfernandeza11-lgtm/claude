'use client';

import { useState } from 'react';
import { Brief, ConceptDossier, Decision } from '@/lib/oficina/types';
import { conceptToMarkdown, download } from '@/lib/oficina/client';
import { Badge, Card, cx, inputCls } from './ui';

export default function Dossier({
  brief,
  decisions,
  headline,
  concept,
  onSteer,
  demo,
}: {
  brief: Brief;
  decisions: Decision[];
  headline: string;
  concept: ConceptDossier;
  onSteer: (text: string) => void;
  demo?: boolean;
}) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const md = conceptToMarkdown(brief, decisions, concept);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* portapapeles bloqueado */
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Ronda 4 de 4 · Concepto</p>
        <h1 className="mt-1 text-xl font-semibold leading-snug text-white sm:text-2xl">{headline}</h1>
      </div>

      <Card className="space-y-4 border-emerald-400/20 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{concept.workingTitle}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{concept.oneLiner}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => download('concepto-producto.md', md, 'text/markdown;charset=utf-8')} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:border-white/30">
              Descargar .md
            </button>
            <button type="button" onClick={copy} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:border-white/30">
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Fact k="Formato" v={concept.format} />
          <Fact k="Público" v={concept.audience} />
          <Fact k="Dolor (en palabras del cliente)" v={concept.painStatement} />
          <Fact k="Promesa" v={concept.promise} />
        </dl>
        {demo && <p className="text-xs text-violet-300">🧪 Ficha de ejemplo del modo demo: no es una recomendación real.</p>}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Block title="Componentes / características clave" items={concept.keyComponents} />
        <Block title="Ángulos de anuncio para testear" items={concept.heroAngles} tone="text-violet-300" />
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-emerald-300">Posicionamiento</h3>
          <p className="text-sm leading-relaxed text-slate-300">{concept.positioning}</p>
        </Card>
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-emerald-300">Precio y oferta</h3>
          <dl className="space-y-1.5 text-sm text-slate-300">
            <div><dt className="inline text-slate-500">Posicionamiento: </dt><dd className="inline">{concept.pricing.positioning}</dd></div>
            <div><dt className="inline text-slate-500">Rango: </dt><dd className="inline">{concept.pricing.range}</dd></div>
            <div><dt className="inline text-slate-500">Oferta: </dt><dd className="inline">{concept.pricing.offer}</dd></div>
          </dl>
        </Card>
        <Block title="Diferenciales" items={concept.differentiators} />
        <Block title="Riesgos" items={concept.risks} tone="text-amber-300" />
      </div>

      {concept.competitorSet.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Competidores de referencia</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {concept.competitorSet.map((c, i) => (
              <li key={i}><Badge tone="violet">{c.name}</Badge> <span className="ml-1.5">{c.why}</span></li>
            ))}
          </ul>
        </Card>
      )}

      {concept.validationPlan.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-sky-300">Plan para validar antes de invertir</h3>
          <ol className="space-y-3">
            {concept.validationPlan.map((v, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sky-400/40 text-xs text-sky-300">{i + 1}</span>
                <span className="text-slate-300">
                  <b className="text-white">{v.step}.</b> {v.how} <span className="text-slate-500">· Métrica: {v.metric}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {concept.openQuestions.length > 0 && <Block title="Lo que todavía no sabemos" items={concept.openQuestions} tone="text-slate-300" />}

      <Card className="space-y-3 p-5">
        <label htmlFor="refine" className="block text-sm font-medium text-white">¿Querés ajustar algo del concepto?</label>
        <input id="refine" className={inputCls} maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej: hacelo para mujeres, con un precio más accesible" />
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => { onSteer(text.trim()); setText(''); }}
          className={cx('rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-40')}
        >
          Pedirle a Atlas que lo reformule
        </button>
      </Card>
      <p className="text-xs text-slate-500">Análisis asistido por IA a partir de las marcas relevadas. Validá precios, claims y anuncios en las fuentes antes de invertir.</p>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="text-slate-200">{v || '—'}</dd>
    </div>
  );
}

function Block({ title, items, tone = 'text-emerald-300' }: { title: string; items: string[]; tone?: string }) {
  if (!items.length) return null;
  return (
    <Card className="p-4">
      <h3 className={cx('mb-2 text-sm font-semibold', tone)}>{title}</h3>
      <ul className="space-y-1.5 text-sm leading-relaxed text-slate-300">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2"><span className="text-slate-600" aria-hidden>•</span><span>{it}</span></li>
        ))}
      </ul>
    </Card>
  );
}
