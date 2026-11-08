import { checkAccess, hasKey } from './server';
import { MAX_MARKETS, MARKETS, FORMATS, Brief, DEPTHS } from './types';

export function guard(req: Request): Response | null {
  if (!checkAccess(req)) return Response.json({ error: 'access_denied', message: 'Código de acceso incorrecto.' }, { status: 401 });
  if (!hasKey()) {
    return Response.json(
      { error: 'missing_key', message: 'Falta configurar ANTHROPIC_API_KEY en el servidor.' },
      { status: 503 },
    );
  }
  return null;
}

export function parseBrief(input: unknown): Brief | string {
  if (!input || typeof input !== 'object') return 'Brief inválido.';
  const b = input as Partial<Brief>;
  const pain = typeof b.pain === 'string' ? b.pain.trim().slice(0, 300) : '';
  if (pain.length < 3) return 'Contame qué dolor o problema querés resolver.';
  const validMarkets = new Set(MARKETS.map((m) => m.id));
  const markets = Array.from(new Set((b.markets ?? []).filter((m) => validMarkets.has(m)))).slice(0, MAX_MARKETS);
  if (!markets.length) return 'Elegí al menos un mercado.';
  const validFormats = new Set<string>(FORMATS.map((f) => f.id));
  const formats = (b.formats ?? []).filter((f) => validFormats.has(f));
  const req = (v: unknown) => (v === 'obligatorio' || v === 'indiferente' ? v : 'preferido');
  return {
    pain,
    productIdea: typeof b.productIdea === 'string' ? b.productIdea.trim().slice(0, 400) : '',
    formats,
    markets,
    metaAds: req(b.metaAds),
    amazon: req(b.amazon),
    depth: DEPTHS.some((d) => d.id === b.depth) ? (b.depth as Brief['depth']) : 'estandar',
    priceTier: (['accesible', 'medio', 'premium'] as const).find((p) => p === b.priceTier) ?? 'cualquiera',
    notes: typeof b.notes === 'string' ? b.notes.trim().slice(0, 600) : '',
  };
}

/** Respuesta NDJSON en streaming: una línea JSON por evento. */
export function ndjson(run: (emit: (e: unknown) => void, signal: AbortSignal) => Promise<void>, req: Request): Response {
  const enc = new TextEncoder();
  const ac = new AbortController();
  req.signal.addEventListener('abort', () => ac.abort());
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: unknown) => {
        try {
          controller.enqueue(enc.encode(JSON.stringify(e) + '\n'));
        } catch {
          /* cliente desconectado */
        }
      };
      try {
        await run(emit, ac.signal);
      } catch (err) {
        emit({ t: 'error', message: err instanceof Error ? err.message : 'Error inesperado' });
      } finally {
        try {
          controller.close();
        } catch {
          /* ya cerrado */
        }
      }
    },
    cancel() {
      ac.abort();
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no' },
  });
}
