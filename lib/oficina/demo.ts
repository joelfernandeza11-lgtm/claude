import type { Brand } from './types';

/**
 * MODO DEMO — datos ilustrativos para probar la interfaz sin API key.
 * NO son resultados verificados: no hay precios, ni confirmación de anuncios.
 */
const base = (b: Partial<Brand> & Pick<Brand, 'id' | 'name' | 'website' | 'markets'>): Brand => ({
  formats: [],
  positioning: '',
  angle: '',
  why: 'Ejemplo ilustrativo (modo demo).',
  priceRange: '',
  landing: true,
  meta: { status: 'unknown', note: 'Demo: sin verificar. Revisá la Biblioteca de Anuncios.' },
  amazon: { status: 'unknown' },
  traction: 5,
  tractionSignals: [],
  sources: [],
  demo: true,
  ...b,
});

export const DEMO_BRANDS: Record<string, Brand[]> = {
  US: [
    base({
      id: 'nutrafol.com', name: 'Nutrafol', website: 'https://nutrafol.com', markets: ['US'], traction: 9,
      positioning: 'Suplemento de salud capilar para hombres y mujeres, con enfoque “clínico”.',
      angle: 'Respaldo científico + médicos + estudios clínicos.',
      formats: [{ format: 'capsulas', product: 'Suplemento diario', price: '' }],
      meta: { status: 'likely', note: 'Demo: marca muy activa en paid social (ilustrativo).' },
      amazon: { status: 'likely' }, tractionSignals: ['Alta presencia en prensa (ilustrativo)'],
    }),
    base({
      id: 'forhims.com', name: 'Hims & Hers', website: 'https://www.forhims.com', markets: ['US'], traction: 9,
      positioning: 'Telehealth + productos de cuidado capilar en formato suscripción.',
      angle: 'Conveniencia, privacidad y suscripción.',
      formats: [{ format: 'kit', product: 'Kit capilar', price: '' }, { format: 'shampoo', product: 'Shampoo', price: '' }, { format: 'gomitas', product: 'Gomitas capilares', price: '' }],
      meta: { status: 'likely', note: 'Demo: gran inversión publicitaria (ilustrativo).' },
    }),
    base({
      id: 'vegamour.com', name: 'Vegamour', website: 'https://vegamour.com', markets: ['US'], traction: 7,
      positioning: 'Cuidado capilar “clean” con ingredientes botánicos.',
      angle: 'Fórmulas veganas / clean beauty.',
      formats: [{ format: 'serum', product: 'Sérum', price: '' }, { format: 'gomitas', product: 'Gomitas', price: '' }, { format: 'shampoo', product: 'Shampoo', price: '' }],
      amazon: { status: 'unknown' },
    }),
    base({
      id: 'keeps.com', name: 'Keeps', website: 'https://www.keeps.com', markets: ['US'], traction: 6,
      positioning: 'Suscripción de tratamiento capilar para hombres.',
      angle: 'Simple, discreto y a domicilio.',
      formats: [{ format: 'liquido', product: 'Tópico', price: '' }, { format: 'kit', product: 'Kit', price: '' }],
    }),
  ],
  GB: [
    base({
      id: 'viviscal.com', name: 'Viviscal', website: 'https://www.viviscal.com', markets: ['GB'], traction: 7,
      positioning: 'Suplementos para el crecimiento del cabello, con línea de shampoo.',
      angle: 'Complejo marino patentado y trayectoria.',
      formats: [{ format: 'capsulas', product: 'Suplemento', price: '' }, { format: 'shampoo', product: 'Shampoo', price: '' }],
      amazon: { status: 'likely' },
    }),
    base({
      id: 'hairburst.com', name: 'Hairburst', website: 'https://www.hairburst.com', markets: ['GB'], traction: 6,
      positioning: 'Vitaminas capilares con comunidad y UGC.',
      angle: 'Comunidad y resultados de clientas.',
      formats: [{ format: 'gomitas', product: 'Gomitas', price: '' }, { format: 'capsulas', product: 'Vitaminas', price: '' }, { format: 'shampoo', product: 'Shampoo', price: '' }],
      amazon: { status: 'likely' },
    }),
  ],
  CA: [
    base({
      id: 'nutrafol.com', name: 'Nutrafol', website: 'https://nutrafol.com', markets: ['CA'], traction: 8,
      formats: [{ format: 'capsulas', product: 'Suplemento diario', price: '' }],
      positioning: 'Suplemento de salud capilar.', angle: 'Respaldo científico.',
    }),
  ],
  AU: [
    base({
      id: 'hairburst.com', name: 'Hairburst', website: 'https://www.hairburst.com', markets: ['AU'], traction: 5,
      formats: [{ format: 'gomitas', product: 'Gomitas', price: '' }],
      positioning: 'Vitaminas capilares.', angle: 'Comunidad.',
    }),
  ],
};

export const DEMO_QUERIES = [
  'best hair loss brands online',
  'hair growth supplement reviews',
  'hair serum brands amazon bestsellers',
  'DTC hair loss subscription brands',
];
