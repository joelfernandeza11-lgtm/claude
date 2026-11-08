import { guard, parseBrief } from '@/lib/oficina/http';
import { MODEL, client, extractJson } from '@/lib/oficina/server';
import type { Brand, Synthesis } from '@/lib/oficina/types';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const arr = (v: unknown, n = 6): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, n) : [];

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const body = (await req.json().catch(() => null)) as { brief?: unknown; brands?: Brand[] } | null;
  const brief = parseBrief(body?.brief);
  if (typeof brief === 'string') return Response.json({ error: 'bad_request', message: brief }, { status: 400 });
  const brands = (body?.brands ?? []).slice(0, 60);
  if (!brands.length) return Response.json({ error: 'bad_request', message: 'No hay marcas para analizar.' }, { status: 400 });

  // Resumen compacto: solo lo que el análisis necesita.
  const compact = brands.map((b) => ({
    name: b.name,
    markets: b.markets,
    formats: b.formats.map((f) => `${f.format}${f.price ? ` (${f.price})` : ''}`),
    angle: b.angle,
    priceRange: b.priceRange,
    meta: b.meta.status,
    amazon: b.amazon.status,
    traction: b.traction,
  }));

  try {
    const res = await client().messages.create({
      model: MODEL,
      max_tokens: 6000,
      output_config: { effort: 'low' },
      system:
        'Eres un estratega de producto ecommerce DTC. Analizas un set de marcas competidoras ya relevadas y detectas oportunidades. Respondes en español neutro, concreto y accionable, sin relleno. Solo usas los datos provistos; si algo no se puede concluir, dilo. Devuelve SOLO un objeto JSON dentro de un bloque ```json.',
      messages: [
        {
          role: 'user',
          content: `Problema a resolver: ${brief.pain}\nIdea del fundador: ${brief.productIdea || '(sin idea definida)'}\nMercados: ${brief.markets.join(', ')}\n\nMarcas relevadas (JSON):\n${JSON.stringify(compact)}\n\nDevuelve:\n{\n "summary": "3-4 oraciones: cómo está el mercado para este problema",\n "formatInsights": [{"format":"nombre del formato","saturation":"baja|media|alta","note":"por qué"}],\n "gaps": ["huecos u oportunidades concretas (formato, ángulo, precio, mercado sin competidores fuertes)"],\n "angles": ["ángulos de comunicación que se repiten o que nadie usa"],\n "risks": ["riesgos: regulatorios (claims de salud), saturación, logística, dependencia de ads"],\n "nextSteps": ["3-5 pasos concretos para validar antes de crear la marca"]\n}`,
        },
      ],
    });
    const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    const j = extractJson<Record<string, unknown>>(text);
    if (!j) return Response.json({ error: 'parse', message: 'No se pudo interpretar el análisis.' }, { status: 502 });
    const out: Synthesis = {
      summary: typeof j.summary === 'string' ? j.summary : '',
      formatInsights: Array.isArray(j.formatInsights)
        ? (j.formatInsights as Record<string, unknown>[]).slice(0, 12).map((f) => ({
            format: String(f.format ?? ''),
            saturation: f.saturation === 'alta' || f.saturation === 'baja' ? f.saturation : 'media',
            note: String(f.note ?? ''),
          }))
        : [],
      gaps: arr(j.gaps),
      angles: arr(j.angles),
      risks: arr(j.risks),
      nextSteps: arr(j.nextSteps),
    };
    return Response.json(out);
  } catch (err) {
    return Response.json({ error: 'upstream', message: err instanceof Error ? err.message : 'Error' }, { status: 502 });
  }
}
