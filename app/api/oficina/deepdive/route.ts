import { guard, ndjson } from '@/lib/oficina/http';
import { extractJson, runSearchAgent } from '@/lib/oficina/server';
import { hostOf, safeUrl } from '@/lib/oficina/links';
import type { DeepDive } from '@/lib/oficina/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const SYSTEM = `You are a senior DTC ecommerce analyst. You investigate ONE brand in depth using web search and report only what you found. Never invent facts, prices, reviews or ad claims; if something could not be verified say so explicitly ("no verificado"). Write in neutral Spanish. Output ONLY one JSON object inside a \`\`\`json fence.`;

const arr = (v: unknown, n = 8): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((s) => s.slice(0, 400)).slice(0, n) : [];

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const body = (await req.json().catch(() => null)) as { name?: string; website?: string; pain?: string; market?: string } | null;
  const name = body?.name?.trim().slice(0, 80);
  const website = safeUrl(body?.website?.trim());
  if (!name || !website) return Response.json({ error: 'bad_request', message: 'Falta la marca.' }, { status: 400 });
  const pain = (body?.pain ?? '').slice(0, 300);
  const market = /^[A-Z]{2}$/.test(body?.market ?? '') ? body!.market! : undefined;

  return ndjson(async (emit, signal) => {
    emit({ t: 'start' });
    const text = await runSearchAgent({
      system: SYSTEM,
      maxSearches: 8,
      country: market,
      signal,
      onQuery: (q) => emit({ t: 'query', q }),
      onSource: (domain, title) => emit({ t: 'source', domain, title }),
      prompt: `Investigate the brand "${name}" (${hostOf(website)}) in the context of the problem "${pain}"${market ? ` in market ${market}` : ''}.
Look at: its main product pages and price points, bundles/subscriptions/guarantees, health or benefit claims it makes, key ingredients/tech, the ad angles and creative hooks it uses on Meta/Instagram/TikTok (only what you can find evidence for), the structure of its landing/PDP, and customer reviews (Amazon, Trustpilot, Reddit) including recurring complaints.

Return:
{
 "overview": "3-4 sentences in Spanish",
 "products": [{"name":"","format":"","price":"","note":""}],
 "offers": ["bundle / subscription / guarantee / discount mechanics"],
 "claims": ["main claims and ingredients, flag any that look regulatory-risky"],
 "adAngles": ["angles/hooks with evidence, or 'no verificado'"],
 "landingNotes": ["how the landing/PDP is built: hero promise, proof, upsells"],
 "reviews": "summary of review sentiment and recurring complaints",
 "strengths": [""],
 "weaknesses": [""],
 "differentiate": ["concrete ways a new brand could differentiate"],
 "sources": ["URLs you saw"]
}`,
    });
    const j = extractJson<Record<string, unknown>>(text);
    if (!j) throw new Error('No se pudo interpretar la investigación.');
    const prods = Array.isArray(j.products) ? (j.products as Record<string, unknown>[]) : [];
    const result: DeepDive = {
      overview: String(j.overview ?? ''),
      products: prods.slice(0, 12).map((p) => ({
        name: String(p.name ?? ''),
        format: String(p.format ?? ''),
        price: String(p.price ?? ''),
        note: p.note ? String(p.note) : undefined,
      })),
      offers: arr(j.offers),
      claims: arr(j.claims),
      adAngles: arr(j.adAngles),
      landingNotes: arr(j.landingNotes),
      reviews: String(j.reviews ?? ''),
      strengths: arr(j.strengths),
      weaknesses: arr(j.weaknesses),
      differentiate: arr(j.differentiate),
      sources: arr(j.sources, 10).map((s) => safeUrl(s)).filter((s): s is string => Boolean(s)),
    };
    emit({ t: 'result', result });
  }, req);
}
