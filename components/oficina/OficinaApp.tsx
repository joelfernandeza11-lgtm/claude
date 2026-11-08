'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AgentState,
  Brand,
  Brief,
  DeepDive,
  Decision,
  DiscoverResult,
  EMPTY_BRIEF,
  FeedItem,
  OptionItem,
  STAGES,
  StreamEvent,
  stageIndex,
} from '@/lib/oficina/types';
import { DEMO_BRANDS, DEMO_DISCOVER, DEMO_FOCUS_BRANDS, DEMO_QUERIES } from '@/lib/oficina/demo';
import { HistoryItem, lsGet, lsSet, mergeBrands, readNdjson } from '@/lib/oficina/client';
import { AtlasWordmark } from './AtlasLogo';
import OfficeScene, { SceneMode } from './OfficeScene';
import Intro from './Intro';
import TeamWall from './TeamWall';
import Conclusions from './Conclusions';
import Dossier from './Dossier';
import Board from './Board';
import Results from './Results';
import DeepDivePanel from './DeepDivePanel';
import { Card, Spinner } from './ui';

type Phase = 'intro' | 'working' | 'review';
type Disc = { status: 'idle' | 'loading' | 'ready' | 'error'; data?: DiscoverResult; error?: string };

const K = { brief: 'atlas.brief', shortlist: 'atlas.shortlist', history: 'atlas.history', code: 'atlas.code' };

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('aborted', 'AbortError')); }, { once: true });
  });

/** Brief de la búsqueda de una ronda: en la ronda 2 se enfoca en la dirección elegida. */
function searchBriefFor(brief: Brief, decs: Decision[]): Brief {
  const d = decs[decs.length - 1];
  if (!d) return { ...brief, focus: '' };
  const o = d.option;
  const focus = o
    ? [o.label + '.', o.detail, o.audience && `Audience: ${o.audience}.`, o.angle && `Angle: ${o.angle}.`, o.price && `Price positioning: ${o.price}.`].filter(Boolean).join(' ')
    : d.answer;
  return {
    ...brief,
    formats: o?.format && o.format !== 'otro' ? [o.format] : brief.formats,
    productIdea: brief.productIdea || o?.label || d.answer,
    focus,
  };
}

export default function OficinaApp() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [brief, setBrief] = useState<Brief>(() => ({ ...EMPTY_BRIEF, ...lsGet<Partial<Brief>>(K.brief, {}), focus: '' }));
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [agentErrors, setAgentErrors] = useState<{ market: string; message: string }[]>([]);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [disc, setDisc] = useState<Disc>({ status: 'idle' });
  const [shortlist, setShortlist] = useState<string[]>(() => lsGet<string[]>(K.shortlist, []));
  const [history, setHistory] = useState<HistoryItem[]>(() => lsGet<HistoryItem[]>(K.history, []));
  const [blocked, setBlocked] = useState('');
  const [demo, setDemo] = useState(false);
  const [sceneOpen, setSceneOpen] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);
  const [deep, setDeep] = useState<Brand | null>(null);
  const [deepCache, setDeepCache] = useState<Record<string, DeepDive>>({});
  const [accessCode, setAccessCode] = useState(() => lsGet<string>(K.code, ''));

  const abortRef = useRef<AbortController | null>(null);
  const brandsRef = useRef<Brand[]>([]);
  const lastDisc = useRef<DiscoverResult | undefined>(undefined);
  const [boardDisc, setBoardDisc] = useState<DiscoverResult | undefined>(undefined);
  const setLast = useCallback((d: DiscoverResult | undefined) => { lastDisc.current = d; setBoardDisc(d); }, []);
  const sessionId = useRef<string | null>(null);
  const feedId = useRef(0);

  useEffect(() => { lsSet(K.brief, brief); }, [brief]);
  useEffect(() => { lsSet(K.shortlist, shortlist); }, [shortlist]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const stageIdx = stageIndex(decisions.length);

  // ---------- Utilidades de estado ----------
  const patchAgent = useCallback((m: string, p: Partial<AgentState>) => {
    setAgents((a) => ({ ...a, [m]: { ...(a[m] ?? { status: 'waiting', sources: 0, brands: 0 }), ...p } }));
  }, []);
  const pushFeed = useCallback((market: string, kind: FeedItem['kind'], text: string) => {
    setFeed((f) => [...f.slice(-80), { id: ++feedId.current, market, kind, text }]);
  }, []);
  const resetRound = (markets: string[]) => {
    setFeed([]);
    setQuery('');
    setRecent([]);
    setAgentErrors([]);
    setAgents(Object.fromEntries(markets.map((m) => [m, { status: 'waiting', sources: 0, brands: 0 } as AgentState])));
  };

  const saveSession = useCallback((b: Brief, decs: Decision[], list: Brand[], data: DiscoverResult, isDemo: boolean) => {
    const id = (sessionId.current ??= String(Date.now()));
    setHistory((h) => {
      const item: HistoryItem = { id, at: Date.now(), brief: b, brands: list, decisions: decs, disc: data, demo: isDemo };
      const next = [item, ...h.filter((x) => x.id !== id)].slice(0, 6);
      lsSet(K.history, next);
      return next;
    });
  }, []);

  // ---------- Búsqueda real (un agente por mercado) ----------
  const realSearch = useCallback(
    async (b: Brief, signal: AbortSignal): Promise<Brand[]> => {
      let collected: Brand[] = [];
      let code = accessCode;
      let res: Response | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        res = await fetch('/api/oficina/search', {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', ...(code ? { 'x-access-code': code } : {}) },
          body: JSON.stringify(b),
        });
        if (res.status !== 401 || attempt > 0) break;
        const c = window.prompt('Esta oficina está protegida. Ingresá el código de acceso:');
        if (!c) break;
        code = c;
        setAccessCode(c);
        lsSet(K.code, c);
      }
      if (!res || !res.ok) {
        const j = res ? await res.json().catch(() => ({})) : {};
        throw new Error(j.message || `No se pudo iniciar la búsqueda${res ? ` (${res.status})` : ''}.`);
      }
      for await (const ev of readNdjson<StreamEvent>(res)) {
        switch (ev.t) {
          case 'agent':
            patchAgent(ev.market, { status: ev.status, message: ev.message });
            if (ev.status === 'error') setAgentErrors((e) => [...e, { market: ev.market, message: ev.message ?? 'error' }]);
            break;
          case 'query':
            patchAgent(ev.market, { lastQuery: ev.q });
            setQuery(ev.q);
            pushFeed(ev.market, 'query', ev.q);
            break;
          case 'source':
            setAgents((a) => ({ ...a, [ev.market]: { ...(a[ev.market] ?? { status: 'searching', brands: 0, sources: 0 }), sources: (a[ev.market]?.sources ?? 0) + 1 } }));
            setRecent((r) => [ev.domain, ...r].slice(0, 6));
            pushFeed(ev.market, 'source', ev.domain);
            break;
          case 'brands':
            patchAgent(ev.market, { brands: ev.brands.length });
            collected = mergeBrands(collected, ev.brands);
            setBrands(mergeBrands(brandsRef.current, collected));
            break;
          case 'error':
            throw new Error(ev.message);
        }
      }
      return collected;
    },
    [accessCode, patchAgent, pushFeed],
  );

  // ---------- Búsqueda simulada (demo) ----------
  const demoSearch = useCallback(
    async (b: Brief, idx: number, signal: AbortSignal): Promise<Brand[]> => {
      let collected: Brand[] = [];
      const data = idx === 0 ? DEMO_BRANDS : DEMO_FOCUS_BRANDS;
      await Promise.all(
        b.markets.map(async (m, i) => {
          await sleep(300 + i * 450, signal);
          patchAgent(m, { status: 'searching' });
          for (const q of DEMO_QUERIES.slice(0, 3)) {
            await sleep(750, signal);
            patchAgent(m, { lastQuery: q });
            setQuery(q);
            pushFeed(m, 'query', q);
            setRecent((r) => ['allure.com', 'reddit.com', 'amazon.com', 'trustpilot.com'].slice(0, (r.length % 4) + 1));
            setAgents((a) => ({ ...a, [m]: { ...(a[m] as AgentState), sources: (a[m]?.sources ?? 0) + 2 } }));
          }
          await sleep(500, signal);
          const list = data[m] ?? [];
          patchAgent(m, { status: 'done', brands: list.length });
          collected = mergeBrands(collected, list);
          setBrands(mergeBrands(brandsRef.current, collected));
        }),
      );
      return collected;
    },
    [patchAgent, pushFeed],
  );

  const realDiscover = useCallback(
    async (b: Brief, list: Brand[], decs: Decision[], signal: AbortSignal): Promise<DiscoverResult> => {
      const res = await fetch('/api/oficina/discover', {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', ...(accessCode ? { 'x-access-code': accessCode } : {}) },
        body: JSON.stringify({ brief: b, brands: list, decisions: decs }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || `Error ${res.status}`);
      return j as DiscoverResult;
    },
    [accessCode],
  );

  // ---------- Una ronda completa ----------
  const runRound = useCallback(
    async (decs: Decision[], isDemo: boolean, opts: { skipSearch?: boolean } = {}) => {
      const idx = stageIndex(decs.length);
      const ac = new AbortController();
      abortRef.current?.abort();
      abortRef.current = ac;
      setBlocked('');
      setDemo(isDemo);
      setPhase('working');
      setSceneOpen(true);
      setShowEvidence(false);
      setDisc({ status: 'loading' });
      const base = brandsRef.current;
      let all = base;
      try {
        if (idx <= 1 && !opts.skipSearch) {
          const sb = searchBriefFor(brief, decs);
          resetRound(sb.markets);
          setSearching(true);
          const found = isDemo ? await demoSearch(sb, idx, ac.signal) : await realSearch(sb, ac.signal);
          setSearching(false);
          all = mergeBrands(base, found);
          if (!all.length) throw new Error('Los agentes no encontraron marcas. Probá con otros mercados o un dolor más amplio.');
          brandsRef.current = all;
          setBrands(all);
        }
        if (isDemo) await sleep(1800, ac.signal);
        const data = isDemo ? DEMO_DISCOVER[STAGES[idx].id] : await realDiscover(brief, all, decs, ac.signal);
        setLast(data);
        setDisc({ status: 'ready', data });
        setPhase('review');
        setSceneOpen(false);
        saveSession(brief, decs, all, data, isDemo);
      } catch (e) {
        if (ac.signal.aborted) return;
        setSearching(false);
        const msg = e instanceof Error ? e.message : 'Error inesperado';
        if (decs.length === 0 && !lastDisc.current) {
          setPhase('intro');
          setBlocked(msg);
        } else if (all !== base || opts.skipSearch || idx > 1) {
          // La búsqueda anduvo pero falló el análisis: se puede reintentar sin buscar de nuevo.
          setPhase('review');
          setDisc({ status: 'error', error: msg });
        } else {
          // Falló la búsqueda de una ronda de foco: volvemos a la decisión anterior.
          setDecisions(decs.slice(0, -1));
          setPhase('review');
          setDisc(lastDisc.current ? { status: 'ready', data: lastDisc.current } : { status: 'error', error: msg });
          setBlocked(msg);
        }
      }
    },
    [brief, demoSearch, realSearch, realDiscover, saveSession, setLast],
  );

  // ---------- Acciones de la persona ----------
  const start = (isDemo = false) => {
    const b = isDemo ? { ...brief, pain: brief.pain || 'Caída de pelo', markets: ['US', 'GB', 'CA', 'AU'] } : brief;
    if (isDemo) setBrief(b);
    brandsRef.current = [];
    setLast(undefined);
    sessionId.current = null;
    setBrands([]);
    setDecisions([]);
    void runRound([], isDemo);
  };

  const choose = ({ option, text }: { option?: OptionItem; text?: string }) => {
    const data = disc.data;
    if (!data) return;
    const d: Decision = { stage: data.stage, question: data.question ?? 'Ajuste', answer: option?.label ?? text ?? '', detail: option?.detail, option };
    const next = [...decisions, d];
    setDecisions(next);
    void runRound(next, demo);
  };

  const steerConcept = (text: string) => {
    const next = [...decisions, { stage: 'concepto' as const, question: 'Ajuste al concepto', answer: text }];
    setDecisions(next);
    void runRound(next, demo, { skipSearch: true });
  };

  const undo = () => {
    if (!decisions.length) return;
    const next = decisions.slice(0, -1);
    setDecisions(next);
    void runRound(next, demo, { skipSearch: true });
  };

  const retryDiscover = () => void runRound(decisions, demo, { skipSearch: true });

  const cancel = () => {
    abortRef.current?.abort();
    setSearching(false);
    if (lastDisc.current && decisions.length > 0) {
      setDecisions((d) => d.slice(0, -1));
      setDisc({ status: 'ready', data: lastDisc.current });
      setPhase('review');
      setSceneOpen(false);
    } else {
      setPhase('intro');
      setDisc({ status: 'idle' });
    }
  };

  const openHistory = (h: HistoryItem) => {
    abortRef.current?.abort();
    sessionId.current = h.id;
    brandsRef.current = h.brands;
    setLast(h.disc);
    setBrief(h.brief);
    setBrands(h.brands);
    setDecisions(h.decisions);
    setAgentErrors([]);
    setDemo(Boolean(h.demo));
    setBlocked('');
    setShowEvidence(false);
    setSceneOpen(false);
    setPhase('review');
    if (h.disc) setDisc({ status: 'ready', data: h.disc });
    else void runRound(h.decisions, Boolean(h.demo), { skipSearch: true });
  };

  const newResearch = () => {
    if (phase === 'working' && !window.confirm('Hay una búsqueda en curso. ¿Cancelarla y empezar de nuevo?')) return;
    abortRef.current?.abort();
    brandsRef.current = [];
    setLast(undefined);
    sessionId.current = null;
    setBrands([]);
    setDecisions([]);
    setDisc({ status: 'idle' });
    setSearching(false);
    setBlocked('');
    setBrief({ ...EMPTY_BRIEF });
    setPhase('intro');
    setSceneOpen(true);
  };

  const toggleSave = (id: string) => setShortlist((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // ---------- Escena ----------
  const mode: SceneMode =
    phase === 'intro' ? 'idle' : phase === 'working' ? (searching ? 'working' : 'thinking') : disc.status === 'loading' ? 'thinking' : 'presenting';
  const thought =
    mode === 'working' ? query : mode === 'thinking' ? 'Cruzando la evidencia y armando conclusiones…' : mode === 'presenting' ? 'Listo. Mirá lo que encontré.' : '¿Qué dolor resolvemos hoy?';
  const totalSources = Object.values(agents).reduce((n, a) => n + a.sources, 0);
  const statusText = { idle: 'Atlas está listo', working: 'Atlas está buscando en la web', thinking: 'Atlas está analizando la evidencia', presenting: 'Atlas tiene conclusiones' }[mode];
  const stageLabel = STAGES[stageIdx].label;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-200">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button type="button" onClick={() => phase === 'intro' || newResearch()} aria-label="Atlas — inicio" className="text-left">
            <AtlasWordmark />
          </button>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {shortlist.length > 0 && <span>★ {shortlist.length} en shortlist</span>}
            {phase !== 'intro' && (
              <button type="button" onClick={newResearch} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:border-white/30 hover:text-white">
                Nueva investigación
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-4">
        <p className="sr-only" aria-live="polite">{statusText}</p>
        {sceneOpen ? (
          <OfficeScene
            mode={mode}
            markets={brief.markets}
            agents={agents}
            query={query}
            sources={recent}
            thought={thought}
            pain={brief.pain}
            stageLabel={stageLabel}
            stats={{ sources: totalSources, brands: brands.length }}
          />
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-400">
            <span>🏢 {statusText} · <span className="text-slate-300">{stageLabel}</span></span>
            <button type="button" onClick={() => setSceneOpen(true)} className="text-slate-300 underline-offset-4 hover:text-white hover:underline">Ver la oficina</button>
          </div>
        )}
        {sceneOpen && phase === 'review' && (
          <div className="mt-2 text-right">
            <button type="button" onClick={() => setSceneOpen(false)} className="text-xs text-slate-500 hover:text-slate-300">Ocultar la oficina</button>
          </div>
        )}
      </div>

      {phase === 'intro' && (
        <Intro brief={brief} onChange={setBrief} onStart={() => start(false)} onDemo={() => start(true)} history={history} onOpenHistory={openHistory} blocked={blocked} />
      )}

      {phase === 'working' && (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Ronda {stageIdx + 1} de {STAGES.length} · {stageLabel}</p>
                <h1 className="text-xl font-semibold text-white">
                  {searching ? (stageIdx === 0 ? 'Los analistas están recorriendo el mundo' : 'Estudiando a la competencia directa') : 'Atlas está sacando conclusiones'}
                </h1>
                {demo && <p className="mt-1 text-xs text-violet-300">🧪 Simulación con datos de ejemplo</p>}
              </div>
              <button type="button" onClick={cancel} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-rose-400/50 hover:text-rose-300">Cancelar</button>
            </div>
            {searching ? (
              <TeamWall markets={searching ? brief.markets : []} agents={agents} feed={feed} />
            ) : (
              <Card className="flex items-center gap-3 p-6 text-sm text-slate-300"><Spinner /> Cruzando {brands.length} marcas y decisiones previas…</Card>
            )}
          </div>
          <aside><Board brief={brief} decisions={decisions} disc={boardDisc} stageIdx={stageIdx} working /></aside>
        </div>
      )}

      {phase === 'review' && (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-6">
            {demo && <p className="rounded-xl border border-violet-400/30 bg-violet-400/10 p-3 text-sm text-violet-200">🧪 <b>Demo guiada:</b> datos y conclusiones ilustrativos, sin verificar. Con <code>ANTHROPIC_API_KEY</code> Atlas investiga de verdad.</p>}
            {blocked && <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">{blocked}</p>}

            {disc.status === 'loading' && <Card className="flex items-center gap-3 p-6 text-sm text-slate-300"><Spinner /> Atlas está analizando…</Card>}
            {disc.status === 'error' && (
              <Card className="space-y-3 p-6 text-sm text-slate-300">
                <p>No pude completar el análisis: {disc.error}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={retryDiscover} className="rounded-lg bg-white/10 px-3 py-1.5 text-white hover:bg-white/15">Reintentar</button>
                  {decisions.length > 0 && <button type="button" onClick={undo} className="rounded-lg px-3 py-1.5 text-slate-400 hover:text-white">Volver a la ronda anterior</button>}
                </div>
              </Card>
            )}
            {disc.status === 'ready' && disc.data && (
              disc.data.concept ? (
                <Dossier brief={brief} decisions={decisions} headline={disc.data.headline} concept={disc.data.concept} onSteer={steerConcept} demo={demo} />
              ) : (
                <Conclusions key={decisions.length} disc={disc.data} stageIdx={stageIdx} onChoose={choose} />
              )
            )}

            {disc.status === 'ready' && decisions.length > 0 && (
              <button type="button" onClick={undo} className="text-sm text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline">← Volver a la ronda anterior</button>
            )}

            <section>
              <button type="button" onClick={() => setShowEvidence((v) => !v)} aria-expanded={showEvidence} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-slate-200 hover:border-white/25">
                <span>📂 Evidencia: <b>{brands.length} marcas</b> relevadas, con sus señales de Meta Ads y Amazon</span>
                <span className="text-slate-500">{showEvidence ? 'Ocultar' : 'Ver'}</span>
              </button>
              {showEvidence && (
                <div className="mt-4">
                  <Results brief={brief} brands={brands} agentErrors={agentErrors} shortlist={shortlist} onToggleSave={toggleSave} onDeepDive={setDeep} />
                </div>
              )}
            </section>
          </div>
          <aside><Board brief={brief} decisions={decisions} disc={disc.data ?? boardDisc} stageIdx={stageIdx} /></aside>
        </div>
      )}

      {deep && (
        <DeepDivePanel
          key={deep.id}
          brand={deep}
          pain={brief.pain}
          accessCode={accessCode}
          cache={deepCache}
          onCache={(id, d) => setDeepCache((c) => ({ ...c, [id]: d }))}
          onClose={() => setDeep(null)}
        />
      )}
    </div>
  );
}
