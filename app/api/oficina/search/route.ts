import { guard, ndjson, parseBrief } from '@/lib/oficina/http';
import { marketById, scanMarket } from '@/lib/oficina/server';
import type { StreamEvent } from '@/lib/oficina/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const brief = parseBrief(await req.json().catch(() => null));
  if (typeof brief === 'string') return Response.json({ error: 'bad_request', message: brief }, { status: 400 });

  return ndjson(async (emit, signal) => {
    const send = (e: StreamEvent) => emit(e);
    send({ t: 'start', markets: brief.markets });

    // Un agente por mercado, todos en paralelo: el tiempo total ≈ el del mercado más lento.
    await Promise.all(
      brief.markets.map(async (id) => {
        const market = marketById(id)!;
        send({ t: 'agent', market: id, status: 'searching' });
        try {
          const brands = await scanMarket(brief, market, send, signal);
          send({ t: 'brands', market: id, brands });
          send({ t: 'agent', market: id, status: 'done', message: `${brands.length} marcas` });
        } catch (err) {
          if (signal.aborted) return;
          send({ t: 'agent', market: id, status: 'error', message: err instanceof Error ? err.message : 'Falló la búsqueda' });
        }
      }),
    );
    send({ t: 'done' });
  }, req);
}
