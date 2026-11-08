'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Brand, Brief, DeepDive, EMPTY_BRIEF, StreamEvent, Synthesis } from '@/lib/oficina/types';
import { DEMO_BRANDS, DEMO_QUERIES } from '@/lib/oficina/demo';
import { HistoryItem, lsGet, lsSet, mergeBrands, readNdjson } from '@/lib/oficina/client';
import Wizard from './Wizard';
import SearchRoom, { AgentState, FeedItem } from './SearchRoom';
import Results, { SynthState } from './Results';
import DeepDivePanel from './DeepDivePanel';

type Phase = 'brief' | 'running' | 'results';

const K = { brief: 'oficina.brief', shortlist: 'oficina.shortlist', history: 'oficina.history', code: 'oficina.code' };

export default function OficinaApp() {
  const [phase, setPhase] = useState<Phase>('brief');
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<Brief>(() => ({ ...EMPTY_BRIEF, ...lsGet<Partial<Brief>>(K.brief, {}) }));
  const [brands, setBrands] = useState<Brand[]>([]);
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [agentErrors, setAgentErrors] = useState<{ market: string; message: string }[]>([]);
  const [synth, setSynth] = useState<SynthState>({ status: 'idle' });
  const [shortlist, setShortlist] = useState<string[]>(() => lsGet<string[]>(K.shortlist, []));
  const [history, setHistory] = useState<HistoryItem[]>(() => lsGet<HistoryItem[]>(K.history, []));
  const [blocked, setBlocked] = useState('');
  const [demo, setDemo] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [deep, setDeep] = useState<Brand | null>(null);
  const [deepCache, setDeepCache] = useState<Record<string, DeepDive>>({});
  const abortRef = useRef<AbortController | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const feedId = useRef(0);
  const [accessCode, setAccessCode] = useState(() => lsGet<string>(K.code, ''));

  useEffect(() => { lsSet(K.brief, brief); }, [brief]);
  useEffect(() => { lsSet(K.shortlist, shortlist); }, [shortlist]);
  useEffect(() => () => { abortRef.current?.abort(); timers.current.forEach(clearTimeout); }, []);

  const pushFeed = useCallback((market: string, kind: FeedItem['kind'], text: string) => {
    setFeed((f) => [...f.slice(-80), { id: ++feedId.current, market, kind, text }]);
  }, []);
  const patchAgent = useCallback((m: string, p: Partial<AgentState>) => {
    setAgents((a) => ({ ...a, [m]: { ...(a[m] ?? { status: 'waiting', sources: 0, brands: 0 }), ...p } }));
  }, []);

  const reset = (markets: string[]) => {
    setBrands([]);
    setFeed([]);
    setAgentErrors([]);
    setSynth({ status: 'idle' });
    setAgents(Object.fromEntries(markets.map((m) => [m, { status: 'waiting', sources: 0, brands: 0 } as AgentState])));
    setStartedAt(Date.now());
  };

  const saveHistory = useCallback((b: Brief, list: Brand[], s: Synthesis | undefined, isDemo: boolean) => {
    if (!list.length) return;
    setHistory((h) => {
      const next = [{ id: String(Date.now()), at: Date.now(), brief: b, brands: list, synthesis: s, demo: isDemo }, ...h].slice(0, 8);
      lsSet(K.history, next);
      return next;
    });
  }, []);

  const runSynthesis = useCallback(
    async (b: Brief, list: Brand[], isDemo: boolean) => {
      if (isDemo) {
        setSynth({ status: 'error', error: 'El análisis de oportunidades no está disponible en modo demo.' });
        return;
      }
      setSynth({ status: 'loading' });
      try {
        const res = await fetch('/api/oficina/synthesis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(accessCode ? { 'x-access-code': accessCode } : {}) },
          body: JSON.stringify({ brief: b, brands: list }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.message || `Error ${res.status}`);
        setSynth({ status: 'ready', data: j as Synthesis });
        setHistory((h) => {
          const next = h.map((x, i) => (i === 0 && x.brief.pain === b.pain ? { ...x, synthesis: j as Synthesis } : x));
          lsSet(K.history, next);
          return next;
        });
      } catch (e) {
        setSynth({ status: 'error', error: e instanceof Error ? e.message : 'Error' });
      }
    },
    [accessCode],
  );

  const finish = useCallback(
    (b: Brief, list: Brand[], isDemo: boolean) => {
      setPhase('results');
      saveHistory(b, list, undefined, isDemo);
      if (list.length) void runSynthesis(b, list, isDemo);
      else setSynth({ status: 'idle' });
    },
    [runSynthesis, saveHistory],
  );

  // ---------- Búsqueda real ----------
  const launch = useCallback(
    async () => {
      setBlocked('');
      setDemo(false);
      setPhase('running');
      reset(brief.markets);
      const ac = new AbortController();
      abortRef.current = ac;
      let collected: Brand[] = [];
      let code = accessCode;
      try {
        let res: Response | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          res = await fetch('/api/oficina/search', {
            method: 'POST',
            signal: ac.signal,
            headers: { 'Content-Type': 'application/json', ...(code ? { 'x-access-code': code } : {}) },
            body: JSON.stringify(brief),
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
          setPhase('brief');
          setBlocked(j.message || `No se pudo iniciar la búsqueda${res ? ` (${res.status})` : ''}.`);
          return;
        }
        for await (const ev of readNdjson<StreamEvent>(res)) {
          switch (ev.t) {
            case 'agent':
              patchAgent(ev.market, { status: ev.status, message: ev.message });
              if (ev.status === 'error') setAgentErrors((e) => [...e, { market: ev.market, message: ev.message ?? 'error' }]);
              break;
            case 'query':
              patchAgent(ev.market, { lastQuery: ev.q });
              pushFeed(ev.market, 'query', ev.q);
              break;
            case 'source':
              setAgents((a) => ({ ...a, [ev.market]: { ...(a[ev.market] ?? { status: 'searching', brands: 0, sources: 0 }), sources: (a[ev.market]?.sources ?? 0) + 1 } }));
              pushFeed(ev.market, 'source', ev.domain);
              break;
            case 'brands':
              patchAgent(ev.market, { brands: ev.brands.length });
              collected = mergeBrands(collected, ev.brands);
              setBrands(collected);
              break;
            case 'error':
              setBlocked(ev.message);
              break;
          }
        }
        finish(brief, collected, false);
      } catch (e) {
        if (ac.signal.aborted) return;
        setPhase('brief');
        setBlocked(e instanceof Error ? e.message : 'Error de conexión');
      }
    },
    [brief, accessCode, finish, patchAgent, pushFeed],
  );

  // ---------- Demo ----------
  const launchDemo = () => {
    const b: Brief = { ...brief, pain: brief.pain || 'Caída de pelo', markets: ['US', 'GB', 'CA', 'AU'] };
    setBrief(b);
    setDemo(true);
    setBlocked('');
    setPhase('running');
    reset(b.markets);
    let collected: Brand[] = [];
    b.markets.forEach((m, i) => {
      const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
      const base = 400 + i * 500;
      at(base, () => patchAgent(m, { status: 'searching' }));
      DEMO_QUERIES.slice(0, 3).forEach((q, k) => at(base + 700 * (k + 1), () => { patchAgent(m, { lastQuery: q }); pushFeed(m, 'query', q); }));
      at(base + 3200, () => {
        const list = DEMO_BRANDS[m] ?? [];
        patchAgent(m, { status: 'done', brands: list.length, sources: 6 });
        collected = mergeBrands(collected, list);
        setBrands(collected);
      });
    });
    timers.current.push(setTimeout(() => finish(b, collected, true), 400 + b.markets.length * 500 + 3800));
  };

  const cancel = () => {
    abortRef.current?.abort();
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase('brief');
  };

  const openHistory = (h: HistoryItem) => {
    setBrief(h.brief);
    setBrands(h.brands);
    setDemo(Boolean(h.demo));
    setAgentErrors([]);
    setSynth(h.synthesis ? { status: 'ready', data: h.synthesis } : { status: 'idle' });
    setPhase('results');
    if (!h.synthesis && !h.demo) void runSynthesis(h.brief, h.brands, false);
  };

  const toggleSave = (id: string) => setShortlist((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-200">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <button type="button" onClick={() => phase !== 'running' && setPhase('brief')} className="flex items-center gap-2.5 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-lg" aria-hidden>🏢</span>
            <span>
              <span className="block text-sm font-semibold leading-tight text-white">Oficina de Producto</span>
              <span className="block text-xs leading-tight text-slate-500">Investigación de mercado ecommerce global</span>
            </span>
          </button>
          {phase === 'results' && (
            <span className="text-xs text-slate-500">{shortlist.length} en shortlist</span>
          )}
        </div>
      </header>

      {phase === 'brief' ? (
        <Wizard brief={brief} onChange={setBrief} onLaunch={() => launch()} onDemo={launchDemo} history={history} onOpenHistory={openHistory} blocked={blocked} step={step} setStep={setStep} />
      ) : phase === 'running' ? (
        <SearchRoom markets={brief.markets} agents={agents} feed={feed} brands={brands} startedAt={startedAt} onCancel={cancel} demo={demo} />
      ) : (
        <Results
          brief={brief}
          brands={brands}
          agentErrors={agentErrors}
          synth={synth}
          onRetrySynth={() => runSynthesis(brief, brands, demo)}
          shortlist={shortlist}
          onToggleSave={toggleSave}
          onDeepDive={setDeep}
          onRefine={() => setPhase('brief')}
          onNew={() => { setBrief({ ...EMPTY_BRIEF }); setStep(0); setPhase('brief'); }}
          demo={demo}
        />
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
