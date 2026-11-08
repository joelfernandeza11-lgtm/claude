import { guard, parseBrief } from '@/lib/oficina/http';
import { MODEL, client, extractJson } from '@/lib/oficina/server';
import {
  Brand,
  ConceptDossier,
  Decision,
  DiscoverResult,
  FORMATS,
  Finding,
  OptionItem,
  STAGES,
  StageId,
  stageIndex,
} from '@/lib/oficina/types';

export const maxDuration = 180;
export const dynamic = 'force-dynamic';

const SYSTEM = `Eres ATLAS, un analista senior de producto para marcas ecommerce DTC. Trabajas con un fundador que quiere llegar, ronda a ronda, desde un dolor del mercado hasta un concepto de producto concreto y validable.
Reglas:
- Basas tus conclusiones SOLO en las marcas y decisiones que recibes. Cada hallazgo debe marcar si es "evidencia" (se desprende directamente de los datos) o "inferencia" (tu interpretación). No inventes cifras, precios, tamaños de mercado ni reseñas. Si no hay datos suficientes, dilo y baja la confianza.
- Piensas como emprendedor: huecos de oferta, saturación, ángulos de comunicación, voz del cliente (quejas = oportunidad), precio/oferta, riesgo.
- Si el problema es de salud o bienestar, advierte el riesgo regulatorio de los claims en los mercados elegidos (FDA/FTC en EE.UU., ASA/MHRA en Reino Unido, Health Canada, TGA en Australia, EFSA/AEMPS en la UE, ANMAT en Argentina) y no recomiendes promesas de tratar o curar enfermedades.
- Español neutro, directo, sin relleno ni jerga innecesaria. Frases cortas.
- Devuelve SOLO un objeto JSON dentro de un bloque \`\`\`json.`;

const STAGE_TASK: Record<StageId, string> = {
  explorar: `RONDA 1 — RADAR GLOBAL. Tienes un barrido amplio de marcas en varios mercados.
Hallazgos (4 a 6): qué formatos dominan en cada mercado, qué está saturado, qué está subatendido (formato, segmento, ángulo, precio o mercado con pocos competidores fuertes), qué ángulos de comunicación se repiten y qué marcas aparecen en varios mercados.
Opciones (3 a 4): DIRECCIONES de producto distintas entre sí, cada una con formato, público, ángulo y posicionamiento de precio. Marca como "recommended" la que mejor equilibre hueco de mercado y evidencia. Pregunta: "¿Qué dirección exploramos a fondo?"`,
  enfocar: `RONDA 2 — FOCO. El fundador eligió una dirección y ahora tienes evidencia enfocada en ella.
Hallazgos (4 a 6): quiénes compiten directo, sus precios y mecánicas de oferta, qué piden y de qué se quejan los clientes (reviewThemes), qué ángulos de anuncios usan y dónde está el hueco real.
Opciones (3): formas de DIFERENCIARSE o SEGMENTAR (público x promesa) dentro de esa dirección. Marca una como "recommended". Pregunta: "¿Con qué diferencial y público vamos?"`,
  definir: `RONDA 3 — DEFINICIÓN. No hay búsqueda nueva: trabaja con la evidencia acumulada y las decisiones.
Hallazgos (3 a 5): implicancias de posicionamiento, precio y oferta; dónde hay riesgo de guerra de precios, de claims, de logística o de dependencia de anuncios. Si asumes costos, dilo explícitamente como supuesto.
Opciones (3): PAQUETES concretos de precio y oferta (ej. precio de entrada + suscripción + garantía), cada uno con rango de precio y lógica. Marca uno como "recommended". Pregunta: "¿Qué paquete de precio y oferta probamos?"`,
  concepto: `RONDA 4 — CONCEPTO. Con todas las decisiones, redacta la ficha del producto y un plan para validarlo antes de invertir en inventario.
No hay "options" (devuelve un arreglo vacío). Completa "concept" con todos los campos. El plan de validación debe tener 4 a 6 pasos baratos y medibles (ej. landing + test de anuncios, preventa, muestras, entrevistas) con métrica de éxito. "competitorSet" debe usar marcas presentes en los datos.`,
};

const FORMAT_IDS = FORMATS.map((f) => f.id).join(' | ');

const str = (v: unknown, n = 500): string => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const arr = (v: unknown, n = 8, len = 400): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((s) => s.trim().slice(0, len)).slice(0, n) : [];
type Raw = Record<string, unknown>;
const objs = (v: unknown, n: number): Raw[] => (Array.isArray(v) ? (v.filter((x) => x && typeof x === 'object') as Raw[]).slice(0, n) : []);

function compactBrand(b: Brand) {
  return {
    name: b.name,
    markets: b.markets,
    formats: b.formats.map((f) => `${f.format}${f.price ? ` (${f.price})` : ''}`),
    angle: b.angle,
    priceRange: b.priceRange,
    meta: b.meta.status,
    amazon: b.amazon.status,
    traction: b.traction,
    reviewThemes: b.reviewThemes,
  };
}

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const body = (await req.json().catch(() => null)) as { brief?: unknown; brands?: Brand[]; decisions?: Decision[] } | null;
  const brief = parseBrief(body?.brief);
  if (typeof brief === 'string') return Response.json({ error: 'bad_request', message: brief }, { status: 400 });

  const brands = (body?.brands ?? []).slice(0, 50);
  if (!brands.length) return Response.json({ error: 'bad_request', message: 'Todavía no hay marcas para analizar.' }, { status: 400 });

  const decisions = (body?.decisions ?? []).slice(0, 12).map((d) => ({
    stage: str(d.stage, 20),
    question: str(d.question, 200),
    answer: str(d.answer, 300),
    detail: str(d.detail, 500),
  }));
  const stage = STAGES[stageIndex(decisions.length)].id;

  const prompt = `ETAPA: ${stage}
Dolor a resolver: ${brief.pain}
Idea inicial del fundador: ${brief.productIdea || '(ninguna)'}
Mercados relevados: ${brief.markets.join(', ')}

Decisiones tomadas hasta ahora (en orden):
${decisions.length ? decisions.map((d, i) => `${i + 1}. [${d.stage}] ${d.question} → ${d.answer}${d.detail ? ` (${d.detail})` : ''}`).join('\n') : '(ninguna todavía)'}

Marcas relevadas (JSON):
${JSON.stringify(brands.map(compactBrand))}

TAREA:
${STAGE_TASK[stage]}

Devuelve exactamente esta forma:
{
  "headline": "una sola frase con la conclusión principal de esta ronda",
  "findings": [{"title": "título corto", "detail": "1-2 frases", "confidence": "alta|media|baja", "basis": "evidencia|inferencia"}],
  "question": "la pregunta que se le hace al fundador (vacío en la etapa concepto)",
  "options": [{"id": "a", "label": "nombre corto", "detail": "1-2 frases", "format": "${FORMAT_IDS} | otro", "audience": "público", "angle": "ángulo/promesa", "price": "posicionamiento o rango", "risk": "riesgo principal", "recommended": true}],
  "board": {"format": "formato que vamos viendo", "audience": "público", "angle": "ángulo", "price": "precio/oferta"},
  "readiness": 0,
  "concept": {
    "workingTitle": "título de trabajo (no es un nombre de marca registrable)",
    "oneLiner": "el producto en una frase",
    "format": "", "audience": "", "painStatement": "el dolor en palabras del cliente", "promise": "la promesa central",
    "keyComponents": ["componentes/ingredientes/características clave"],
    "positioning": "enunciado de posicionamiento",
    "heroAngles": ["2-3 ángulos de anuncio para testear"],
    "pricing": {"positioning": "", "range": "", "offer": "mecánica de oferta"},
    "competitorSet": [{"name": "", "why": "por qué es referencia"}],
    "differentiators": [""], "risks": [""],
    "validationPlan": [{"step": "", "how": "", "metric": ""}],
    "openQuestions": ["qué falta saber"]
  }
}
"readiness" es 0-100: qué tan listo está el fundador para invertir en un test real (suele ser ~25 tras la ronda 1, ~50 tras la 2, ~70 tras la 3 y hasta 85 en el concepto; bájalo si la evidencia es floja). Incluye "concept" solo en la etapa concepto.`;

  try {
    const res = await client().messages.create({
      model: MODEL,
      max_tokens: 10000,
      output_config: { effort: 'medium' },
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });
    if (res.stop_reason === 'refusal') return Response.json({ error: 'refusal', message: 'El modelo rechazó esta consulta.' }, { status: 422 });
    const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    const j = extractJson<Raw>(text);
    if (!j) return Response.json({ error: 'parse', message: 'No pude interpretar el análisis. Probá de nuevo.' }, { status: 502 });

    const validFormats = new Set<string>(FORMATS.map((f) => f.id));
    const findings: Finding[] = objs(j.findings, 8).map((f) => ({
      title: str(f.title, 120),
      detail: str(f.detail, 500),
      confidence: f.confidence === 'alta' || f.confidence === 'baja' ? f.confidence : 'media',
      basis: f.basis === 'inferencia' ? 'inferencia' : 'evidencia',
    }));
    const options: OptionItem[] =
      stage === 'concepto'
        ? []
        : objs(j.options, 5).map((o, i) => {
            const fmt = str(o.format, 30).toLowerCase();
            return {
              id: str(o.id, 20) || String.fromCharCode(97 + i),
              label: str(o.label, 100),
              detail: str(o.detail, 500),
              format: (validFormats.has(fmt) ? fmt : 'otro') as OptionItem['format'],
              audience: str(o.audience, 150) || undefined,
              angle: str(o.angle, 200) || undefined,
              price: str(o.price, 120) || undefined,
              risk: str(o.risk, 250) || undefined,
              recommended: o.recommended === true,
            };
          });
    if (options.length && !options.some((o) => o.recommended)) options[0].recommended = true;

    const bd = (j.board ?? {}) as Raw;
    const readiness = Number(j.readiness);

    let concept: ConceptDossier | undefined;
    if (stage === 'concepto') {
      const c = (j.concept ?? {}) as Raw;
      const pr = (c.pricing ?? {}) as Raw;
      concept = {
        workingTitle: str(c.workingTitle, 100),
        oneLiner: str(c.oneLiner, 300),
        format: str(c.format, 100),
        audience: str(c.audience, 250),
        painStatement: str(c.painStatement, 400),
        promise: str(c.promise, 300),
        keyComponents: arr(c.keyComponents, 10),
        positioning: str(c.positioning, 500),
        heroAngles: arr(c.heroAngles, 5),
        pricing: { positioning: str(pr.positioning, 250), range: str(pr.range, 100), offer: str(pr.offer, 300) },
        competitorSet: objs(c.competitorSet, 8).map((x) => ({ name: str(x.name, 80), why: str(x.why, 300) })),
        differentiators: arr(c.differentiators, 8),
        risks: arr(c.risks, 8),
        validationPlan: objs(c.validationPlan, 8).map((x) => ({ step: str(x.step, 150), how: str(x.how, 300), metric: str(x.metric, 200) })),
        openQuestions: arr(c.openQuestions, 6),
      };
      if (!concept.oneLiner && !concept.workingTitle) {
        return Response.json({ error: 'parse', message: 'El concepto vino incompleto. Probá de nuevo.' }, { status: 502 });
      }
    } else if (!options.length) {
      return Response.json({ error: 'parse', message: 'El análisis vino sin opciones. Probá de nuevo.' }, { status: 502 });
    }

    const out: DiscoverResult = {
      stage,
      headline: str(j.headline, 300),
      findings,
      question: stage === 'concepto' ? undefined : str(j.question, 200) || '¿Hacia dónde seguimos?',
      options,
      board: { format: str(bd.format, 120) || undefined, audience: str(bd.audience, 150) || undefined, angle: str(bd.angle, 200) || undefined, price: str(bd.price, 120) || undefined },
      readiness: Number.isFinite(readiness) ? Math.max(0, Math.min(100, Math.round(readiness))) : 30,
      concept,
    };
    return Response.json(out);
  } catch (err) {
    return Response.json({ error: 'upstream', message: err instanceof Error ? err.message : 'Error' }, { status: 502 });
  }
}
