// Tipos y catálogos compartidos entre cliente y servidor de la "Oficina de Producto".

export type FormatId =
  | 'capsulas'
  | 'gomitas'
  | 'polvo'
  | 'liquido'
  | 'shampoo'
  | 'serum'
  | 'aceite'
  | 'crema'
  | 'spray'
  | 'parches'
  | 'dispositivo'
  | 'kit';

export interface FormatDef {
  id: FormatId;
  label: string;
  glyph: string;
  /** Descripción en inglés usada en los prompts de búsqueda. */
  en: string;
}

export const FORMATS: FormatDef[] = [
  { id: 'capsulas', label: 'Cápsulas / tabletas', glyph: '💊', en: 'capsules / tablets / softgels' },
  { id: 'gomitas', label: 'Gomitas', glyph: '🍬', en: 'gummies' },
  { id: 'polvo', label: 'Polvo / sticks', glyph: '🥄', en: 'powders / drink mixes / stick packs' },
  { id: 'liquido', label: 'Líquidos / shots', glyph: '🧪', en: 'liquid supplements / shots / tinctures / drops' },
  { id: 'shampoo', label: 'Shampoo / acondicionador', glyph: '🧴', en: 'shampoo / conditioner / wash' },
  { id: 'serum', label: 'Sérums / gotero tópico', glyph: '💧', en: 'serums / topical droppers' },
  { id: 'aceite', label: 'Aceites', glyph: '🫒', en: 'oils (topical or oral)' },
  { id: 'crema', label: 'Cremas / geles / mascarillas', glyph: '🫙', en: 'creams / gels / masks / balms' },
  { id: 'spray', label: 'Sprays / espumas', glyph: '💨', en: 'sprays / foams / mists' },
  { id: 'parches', label: 'Parches / tiras', glyph: '🩹', en: 'patches / strips' },
  { id: 'dispositivo', label: 'Dispositivos / tech', glyph: '🔦', en: 'devices / tools / wearables (e.g. LED, derma-roller, massager)' },
  { id: 'kit', label: 'Kits / sistemas', glyph: '🎁', en: 'bundles / multi-step kits / systems' },
];

export const formatById = (id: string): FormatDef | undefined => FORMATS.find((f) => f.id === id);

export interface MarketDef {
  id: string; // ISO-3166 alpha-2
  label: string;
  flag: string;
  /** Idioma/s en los que conviene buscar. */
  lang: string;
  amazon: string; // dominio de Amazon
  group: 'anglo' | 'europa' | 'latam' | 'otros';
}

export const MARKETS: MarketDef[] = [
  { id: 'US', label: 'Estados Unidos', flag: '🇺🇸', lang: 'English', amazon: 'amazon.com', group: 'anglo' },
  { id: 'CA', label: 'Canadá', flag: '🇨🇦', lang: 'English', amazon: 'amazon.ca', group: 'anglo' },
  { id: 'GB', label: 'Reino Unido', flag: '🇬🇧', lang: 'English', amazon: 'amazon.co.uk', group: 'anglo' },
  { id: 'AU', label: 'Australia', flag: '🇦🇺', lang: 'English', amazon: 'amazon.com.au', group: 'anglo' },
  { id: 'NZ', label: 'Nueva Zelanda', flag: '🇳🇿', lang: 'English', amazon: 'amazon.com.au', group: 'anglo' },
  { id: 'ES', label: 'España', flag: '🇪🇸', lang: 'Spanish', amazon: 'amazon.es', group: 'europa' },
  { id: 'DE', label: 'Alemania', flag: '🇩🇪', lang: 'German', amazon: 'amazon.de', group: 'europa' },
  { id: 'FR', label: 'Francia', flag: '🇫🇷', lang: 'French', amazon: 'amazon.fr', group: 'europa' },
  { id: 'IT', label: 'Italia', flag: '🇮🇹', lang: 'Italian', amazon: 'amazon.it', group: 'europa' },
  { id: 'NL', label: 'Países Bajos', flag: '🇳🇱', lang: 'Dutch', amazon: 'amazon.nl', group: 'europa' },
  { id: 'MX', label: 'México', flag: '🇲🇽', lang: 'Spanish', amazon: 'amazon.com.mx', group: 'latam' },
  { id: 'BR', label: 'Brasil', flag: '🇧🇷', lang: 'Portuguese', amazon: 'amazon.com.br', group: 'latam' },
  { id: 'AE', label: 'Emiratos Árabes', flag: '🇦🇪', lang: 'English', amazon: 'amazon.ae', group: 'otros' },
  { id: 'SG', label: 'Singapur', flag: '🇸🇬', lang: 'English', amazon: 'amazon.sg', group: 'otros' },
];

export const marketById = (id: string): MarketDef | undefined => MARKETS.find((m) => m.id === id);

export const MARKET_PRESETS: { id: string; label: string; markets: string[] }[] = [
  { id: 'top', label: 'Los más avanzados', markets: ['US', 'GB', 'CA', 'AU'] },
  { id: 'anglo', label: 'Anglo completo', markets: ['US', 'CA', 'GB', 'AU', 'NZ'] },
  { id: 'europa', label: 'Europa', markets: ['ES', 'DE', 'FR', 'IT'] },
  { id: 'mix', label: 'Mix global', markets: ['US', 'GB', 'AU', 'ES', 'DE'] },
];

export const MAX_MARKETS = 8;

export const COMMON_PAINS: { label: string; hint: string }[] = [
  { label: 'Caída de pelo', hint: 'hair loss / thinning' },
  { label: 'Sueño / insomnio', hint: 'sleep support' },
  { label: 'Estrés y ansiedad', hint: 'stress & anxiety relief' },
  { label: 'Dolor articular', hint: 'joint pain' },
  { label: 'Piel con acné', hint: 'acne-prone skin' },
  { label: 'Energía y fatiga', hint: 'energy / fatigue' },
  { label: 'Salud digestiva', hint: 'gut health / bloating' },
  { label: 'Menopausia', hint: 'menopause symptoms' },
  { label: 'Dolor de espalda', hint: 'back pain' },
  { label: 'Mal aliento / salud oral', hint: 'oral care / bad breath' },
  { label: 'Arrugas / antiedad', hint: 'anti-aging skin' },
  { label: 'Salud de mascotas', hint: 'pet health supplements' },
];

export type Depth = 'rapido' | 'estandar' | 'profundo';
export const DEPTHS: { id: Depth; label: string; perMarket: number; searches: number; eta: string; desc: string }[] = [
  { id: 'rapido', label: 'Rápido', perMarket: 3, searches: 4, eta: '~30–60 s', desc: 'Las 3 marcas más fuertes por mercado' },
  { id: 'estandar', label: 'Estándar', perMarket: 5, searches: 7, eta: '~60–90 s', desc: 'Balance entre cobertura y velocidad' },
  { id: 'profundo', label: 'Profundo', perMarket: 8, searches: 10, eta: '~1.5–3 min', desc: 'Mayor cobertura de formatos y nichos' },
];

export type Requirement = 'obligatorio' | 'preferido' | 'indiferente';

export interface Brief {
  pain: string;
  productIdea: string;
  formats: FormatId[]; // vacío = que el agente detecte los formatos
  markets: string[];
  metaAds: Requirement;
  amazon: Requirement;
  depth: Depth;
  priceTier: 'cualquiera' | 'accesible' | 'medio' | 'premium';
  notes: string;
}

export const EMPTY_BRIEF: Brief = {
  pain: '',
  productIdea: '',
  formats: [],
  markets: ['US', 'GB', 'CA', 'AU'],
  metaAds: 'preferido',
  amazon: 'preferido',
  depth: 'estandar',
  priceTier: 'cualquiera',
  notes: '',
};

// ---------- Resultados ----------

export type Signal = 'confirmed' | 'likely' | 'unknown' | 'none';

export interface BrandFormat {
  format: FormatId | 'otro';
  product: string;
  price: string; // texto libre con moneda, ej. "US$ 44/mes"
  url?: string;
}

export interface Brand {
  id: string; // dominio normalizado
  name: string;
  website: string;
  markets: string[];
  formats: BrandFormat[];
  positioning: string;
  angle: string;
  why: string;
  priceRange: string;
  landing: boolean;
  platform?: string; // Shopify, WooCommerce, propio...
  meta: { status: Signal; note: string };
  amazon: { status: Signal; url?: string; note?: string };
  traction: number; // 0-10 estimado por el agente
  tractionSignals: string[];
  sources: string[];
  demo?: boolean;
}

export interface ScoreBreakdown {
  total: number;
  parts: { label: string; value: number; max: number }[];
}

export type StreamEvent =
  | { t: 'start'; markets: string[] }
  | { t: 'agent'; market: string; status: 'searching' | 'done' | 'error'; message?: string }
  | { t: 'query'; market: string; q: string }
  | { t: 'source'; market: string; domain: string; title: string }
  | { t: 'brands'; market: string; brands: Brand[] }
  | { t: 'done' }
  | { t: 'error'; message: string };

export interface Synthesis {
  summary: string;
  formatInsights: { format: string; saturation: 'baja' | 'media' | 'alta'; note: string }[];
  gaps: string[];
  angles: string[];
  risks: string[];
  nextSteps: string[];
}

export interface DeepDive {
  overview: string;
  products: { name: string; format: string; price: string; note?: string }[];
  offers: string[];
  claims: string[];
  adAngles: string[];
  landingNotes: string[];
  reviews: string;
  strengths: string[];
  weaknesses: string[];
  differentiate: string[];
  sources: string[];
}
