import Anthropic from '@anthropic-ai/sdk';
import {
  Brand,
  BrandFormat,
  Brief,
  DEPTHS,
  FORMATS,
  FormatId,
  MarketDef,
  Signal,
  StreamEvent,
  formatById,
  marketById,
} from './types';
import { hostOf, safeUrl } from './links';

export const MODEL = process.env.OFICINA_MODEL || 'claude-opus-5-5';

let _client: Anthropic | null = null;
export function client(): Anthropic {
  if (!_client) _client = new Anthropic({ maxRetries: 2 });
  return _client;
}

export function hasKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/** Si OFICINA_ACCESS_CODE está definido, exige el header x-access-code. */
export function checkAccess(req: Request): boolean {
  const code = process.env.OFICINA_ACCESS_CODE;
  if (!code) return true;
  return req.headers.get('x-access-code') === code;
}

// ---------- JSON robusto ----------

export function extractJson<T = unknown>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates: string[] = [];
  if (fenced) candidates.push(fenced[1]);
  const first = text.search(/[\[{]/);
  if (first >= 0) candidates.push(text.slice(first));
  for (const c of candidates) {
    const s = c.trim();
    try {
      return JSON.parse(s) as T;
    } catch {
      // intenta recortar hasta el último cierre balanceado
      const end = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
      if (end > 0) {
        try {
          return JSON.parse(s.slice(0, end + 1)) as T;
        } catch {
          /* siguiente candidato */
        }
      }
    }
  }
  return null;
}

// ---------- Prompts ----------

const SYSTEM = `You are a senior ecommerce market researcher working for a founder who builds direct-to-consumer (DTC) brands.
Your job: find REAL brands currently selling online and report only what you can support with what you found while searching.

Hard rules:
- Never invent brands, URLs, prices or claims. Every URL you output must have appeared in your search results or be the brand's own domain you saw there. If you are not sure about a field, use "unknown" / empty values rather than guessing.
- A brand qualifies only if it sells to consumers through its OWN online store / landing page (a marketplace listing alone is not enough, but Amazon presence is a bonus signal).
- Meta (Facebook/Instagram) advertising: you cannot open the Meta Ad Library (it is JavaScript-rendered). Set meta.status to "confirmed" ONLY if a source you found explicitly shows the brand running Meta ads (e.g. an ad-spy/analysis page, an Ad Library snapshot quoted in an article, a press piece about their paid social). Use "likely" when there are strong indirect signals (sponsored posts seen, UGC-style ad creative discussed, heavy influencer/affiliate program, retargeting pixels reported). Otherwise "unknown". Be conservative: the founder will verify in the Ad Library himself.
- Prefer brands with real traction: many reviews, press coverage, retail/Amazon presence, active social following, multiple products. Skip dead sites, one-product dropship stores with no reviews, and brands that no longer operate.
- Write all descriptive text fields in Spanish (neutral Latin American). Keep product names, brand names and prices in their original language/currency.
- Output ONLY one JSON object inside a \`\`\`json code fence, no commentary before or after.`;

function formatsClause(brief: Brief): string {
  if (!brief.formats.length) {
    return `Formats: any. Detect which formats exist in the market (${FORMATS.map((f) => f.en).join('; ')}) and make sure the brands you pick cover as many DIFFERENT formats as possible.`;
  }
  const list = brief.formats.map((f) => formatById(f)?.en).filter(Boolean).join('; ');
  return `Formats wanted: ${list}. Try to cover each wanted format with at least one brand when such brands exist; you may add other formats only if clearly relevant.`;
}

const PRICE_HINT: Record<Brief['priceTier'], string> = {
  cualquiera: '',
  accesible: 'Prefer affordable / mass-market price points.',
  medio: 'Prefer mid-market price points.',
  premium: 'Prefer premium / high-AOV positioning.',
};

export function scanPrompt(brief: Brief, market: MarketDef): string {
  const depth = DEPTHS.find((d) => d.id === brief.depth) ?? DEPTHS[1];
  const formatIds = FORMATS.map((f) => f.id).join(' | ');
  return `Market: ${market.label} (${market.id}). Search in ${market.lang} and English. Amazon domain for this market: ${market.amazon}.

Problem / pain point to solve: ${brief.pain}
${brief.productIdea ? `Founder's product idea: ${brief.productIdea}` : ''}
${formatsClause(brief)}
${PRICE_HINT[brief.priceTier]}
Meta Ads requirement: ${brief.metaAds}. Amazon requirement: ${brief.amazon}. (If "obligatorio", drop brands with no signal at all; if "preferido", rank them higher; "indiferente" = ignore.)
${brief.notes ? `Extra notes from the founder: ${brief.notes}` : ''}
${
  brief.focus
    ? `\nFOCUS MODE — the founder already narrowed the search to this direction: ${brief.focus}\nPrioritise DIRECT competitors of exactly this concept (same format and similar audience), their price points and offer mechanics (bundles, subscription, guarantee), and what customers repeatedly praise or complain about in reviews (Amazon, Trustpilot, Reddit). Fill "reviewThemes" thoroughly. Ignore brands that only sell other formats.\n`
    : ''
}
Task: use web search (at most ${depth.searches} searches; run them efficiently, mixing queries such as best-of lists, "<pain> supplement/serum/shampoo brand ${market.label}", Amazon bestseller pages, brand sites, press/review sites and ad-intelligence pages) and return the ${depth.perMarket} strongest DTC brands for this market, favouring variety of formats over several brands that sell the same format.

JSON schema (return exactly this shape):
{
  "brands": [
    {
      "name": "Brand name",
      "website": "https://brand-domain.com",
      "positioning": "one sentence: who it targets and the core promise",
      "angle": "main marketing angle / hook they use",
      "why": "why it qualifies as a reference (traction evidence you found)",
      "priceRange": "e.g. US$ 30-60",
      "landing": true,
      "platform": "Shopify | WooCommerce | custom | unknown",
      "formats": [
        { "format": "one of: ${formatIds} | otro", "product": "product name", "price": "price with currency or empty", "url": "product page URL or empty" }
      ],
      "meta": { "status": "confirmed | likely | unknown | none", "note": "what evidence, in Spanish" },
      "amazon": { "status": "confirmed | likely | unknown | none", "url": "listing URL if found, else empty", "note": "short note" },
      "traction": 0,
      "tractionSignals": ["short evidence strings, e.g. '12k reseñas', 'prensa en Allure'"],
      "reviewThemes": ["recurring customer themes in Spanish, e.g. 'queja: sabor artificial', 'elogio: resultados a los 3 meses' (empty if not found)"],
      "sources": ["URLs you actually saw"]
    }
  ]
}
"traction" is an integer 0-10 (10 = category leader with massive reviews/press/retail). Return fewer brands rather than weak or unverifiable ones.`;
}

// ---------- Normalización ----------

const SIGNALS: Signal[] = ['confirmed', 'likely', 'unknown', 'none'];
const asSignal = (v: unknown): Signal => (SIGNALS.includes(v as Signal) ? (v as Signal) : 'unknown');
const str = (v: unknown, max = 400): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strArr = (v: unknown, max = 8): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((s) => s.trim().slice(0, 300)).slice(0, max) : [];

const FORMAT_IDS = new Set<string>(FORMATS.map((f) => f.id));

type Raw = Record<string, unknown>;

export function normalizeBrand(raw: Raw, market: string): Brand | null {
  const name = str(raw.name, 80);
  const website = safeUrl(str(raw.website, 300));
  if (!name || !website) return null;
  const rawFormats = Array.isArray(raw.formats) ? (raw.formats as Raw[]) : [];
  const formats: BrandFormat[] = rawFormats
    .map((f) => {
      const id = str(f.format, 30).toLowerCase();
      return {
        format: (FORMAT_IDS.has(id) ? id : 'otro') as FormatId | 'otro',
        product: str(f.product, 120),
        price: str(f.price, 60),
        url: safeUrl(str(f.url, 400)),
      };
    })
    .filter((f) => f.product || f.price);
  const meta = (raw.meta ?? {}) as Raw;
  const amazon = (raw.amazon ?? {}) as Raw;
  const traction = Number(raw.traction);
  return {
    id: hostOf(website),
    name,
    website,
    markets: [market],
    formats,
    positioning: str(raw.positioning),
    angle: str(raw.angle),
    why: str(raw.why, 500),
    priceRange: str(raw.priceRange, 60),
    landing: raw.landing !== false,
    platform: str(raw.platform, 40) || undefined,
    meta: { status: asSignal(meta.status), note: str(meta.note, 300) },
    amazon: { status: asSignal(amazon.status), url: safeUrl(str(amazon.url, 400)), note: str(amazon.note, 200) || undefined },
    traction: Number.isFinite(traction) ? Math.max(0, Math.min(10, traction)) : 3,
    tractionSignals: strArr(raw.tractionSignals, 6),
    reviewThemes: strArr(raw.reviewThemes, 6),
    sources: strArr(raw.sources, 6).map((s) => safeUrl(s)).filter((s): s is string => Boolean(s)),
  };
}

// ---------- Streaming de un agente ----------

type Emit = (e: StreamEvent) => void;

/**
 * Ejecuta una consulta con búsqueda web, emitiendo en vivo las búsquedas y fuentes
 * que va usando el agente. Resuelve `pause_turn` (límite de iteraciones del servidor).
 */
export async function runSearchAgent(opts: {
  prompt: string;
  system: string;
  maxSearches: number;
  country?: string;
  signal?: AbortSignal;
  onQuery?: (q: string) => void;
  onSource?: (domain: string, title: string) => void;
  maxTokens?: number;
}): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: opts.prompt }];
  let text = '';

  for (let turn = 0; turn < 4; turn++) {
    const stream = client().messages.stream(
      {
        model: MODEL,
        max_tokens: opts.maxTokens ?? 16000,
        system: opts.system,
        output_config: { effort: 'low' },
        tools: [
          {
            type: 'web_search_20260209',
            name: 'web_search',
            max_uses: opts.maxSearches,
            ...(opts.country ? { user_location: { type: 'approximate' as const, country: opts.country } } : {}),
          },
        ],
        messages,
      },
      { signal: opts.signal },
    );

    const inputBuf = new Map<number, string>();
    const isSearch = new Set<number>();
    for await (const ev of stream) {
      if (ev.type === 'content_block_start') {
        const b = ev.content_block;
        if (b.type === 'server_tool_use') {
          isSearch.add(ev.index);
          inputBuf.set(ev.index, '');
        } else if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
          for (const r of b.content.slice(0, 3)) {
            if (r.type === 'web_search_result') opts.onSource?.(hostOf(r.url), r.title);
          }
        }
      } else if (ev.type === 'content_block_delta' && ev.delta.type === 'input_json_delta' && isSearch.has(ev.index)) {
        inputBuf.set(ev.index, (inputBuf.get(ev.index) ?? '') + ev.delta.partial_json);
      } else if (ev.type === 'content_block_stop' && isSearch.has(ev.index)) {
        try {
          const q = (JSON.parse(inputBuf.get(ev.index) || '{}') as { query?: string }).query;
          if (q) opts.onQuery?.(q);
        } catch {
          /* input parcial: se ignora */
        }
      }
    }

    const final = await stream.finalMessage();
    for (const b of final.content) if (b.type === 'text') text += b.text;

    if (final.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: final.content as Anthropic.ContentBlockParam[] });
      continue;
    }
    if (final.stop_reason === 'refusal') throw new Error('El modelo rechazó esta consulta.');
    break;
  }
  return text;
}

export async function scanMarket(brief: Brief, market: MarketDef, emit: Emit, signal?: AbortSignal): Promise<Brand[]> {
  const depth = DEPTHS.find((d) => d.id === brief.depth) ?? DEPTHS[1];
  const text = await runSearchAgent({
    prompt: scanPrompt(brief, market),
    system: SYSTEM,
    maxSearches: depth.searches,
    country: market.id,
    signal,
    onQuery: (q) => emit({ t: 'query', market: market.id, q }),
    onSource: (domain, title) => emit({ t: 'source', market: market.id, domain, title }),
  });
  const parsed = extractJson<{ brands?: Raw[] } | Raw[]>(text);
  const list = Array.isArray(parsed) ? parsed : parsed?.brands;
  if (!Array.isArray(list)) throw new Error('No se pudo interpretar la respuesta del agente.');
  const out: Brand[] = [];
  for (const raw of list) {
    const b = normalizeBrand(raw as Raw, market.id);
    if (b) out.push(b);
  }
  return out;
}

export { marketById };
